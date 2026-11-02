'use strict';
/**
 * User-facing literal scan (G14.app, docs/23 §9 rule 4).
 *
 * Every string a screen shows must come from the catalog through t() or a lib/i18n formatter.
 * This scan parses every .ts/.tsx file under src/ (except __tests__) with the TypeScript compiler
 * and reports text with letters, in any script, that reaches the screen as a literal:
 *   - JSX text;
 *   - string or template literals in user-facing props (label, title, placeholder, ...);
 *   - literals rendered from a JSX expression, following ?:, &&, ||, ?? and + branches;
 *   - literals in user-facing keys of option objects passed as props (options={{ title }}) or
 *     spread into props ({...(edit ? { action } : {})});
 *   - literals passed to display calls (Alert.alert, setError, setMessage, navigation.setOptions, ...),
 *     including the user-facing keys of objects, and arrays of objects, in their arguments:
 *     Alert.alert(t('a'), t('b'), [{ text: 'Delete' }]) and setOptions({ title: 'Home' });
 *   - any of these held in a const in the same file and reached through its name, aliases included.
 * Arguments to t() and other calls are never followed, so translation keys pass. Conditions are never
 * followed, and an object is read only at user-facing keys, so technical fields pass.
 *
 * Names resolve lexically within one file: the nearest binding wins, and only a plain
 * `const name = value` is followed. A parameter, let, var, destructuring, import, function, class or
 * catch binding of the same name stops the search. Each const is expanded at most once per display
 * site, so cyclic aliases end and the work per site is bounded by the file's consts. There is no
 * cross-file resolution. The remaining limits are listed in docs/evidence/G14.app/i18n-spine-notes.md §2.
 *
 * Known literals in screens owned by other lanes live in copy-literal-baseline.json. A finding matches
 * an entry on file, kind and text, counting duplicates. The check fails on any finding the baseline
 * does not list, and on any entry that no longer matches. baselineProblems() checks the entries against
 * a policy the caller pins: the Jest test pins the original entries, their owners and the migrated
 * screens, so the baseline can only lose entries. Run on its own, this CLI does not know that pin.
 *
 * This is deliberately separate from the colour and font guard (test-design-rules.cjs).
 * Run: node scripts/copy-literal-scan.cjs (from apps/mobile). Jest runs it too, through
 * src/lib/i18n/__tests__/copy-literals.test.ts, so `pnpm check` enforces it.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const appRoot = path.dirname(require.resolve('../package.json'));
const baselinePath = path.join(appRoot, 'scripts', 'copy-literal-baseline.json');
const scratchPrefix = 'fitlog-copy-scan-';

const LETTER = /\p{L}/u;
const SOURCE_FILE = /\.tsx?$/;
const SKIPPED_DIRECTORIES = new Set(['__tests__', 'node_modules']);
const USER_FACING_PROPS = new Set([
  'accessibilityHint', 'accessibilityLabel', 'action', 'alt', 'aria-label', 'body', 'caption', 'description', 'detail',
  'emptyText', 'error', 'errorText', 'eyebrow', 'headerBackTitle', 'headerTitle', 'helperText', 'hint', 'label',
  'message', 'placeholder', 'subtitle', 'tabBarAccessibilityLabel', 'tabBarLabel', 'text', 'title',
]);
const DISPLAY_CALLS = new Set(['alert', 'announceForAccessibility', 'setError', 'setMessage', 'setNotice', 'setOptions', 'setToast']);
/** let, const and using; `await using` sets both const and using, so only a plain const equals CONST. */
const BLOCK_SCOPED = ts.NodeFlags.Let | ts.NodeFlags.Const | (ts.NodeFlags.Using || 0);
const BASELINE_FIELDS = ['file', 'kind', 'text', 'owner'];
const BASELINE_FILE = /^src\/\S+\.tsx?$/;
const BASELINE_KIND = /^(jsx-text|jsx-expression|(prop|option):[A-Za-z-]+|call:[A-Za-z]+(:[A-Za-z-]+)?)$/;

const normalise = (text) => text.replace(/\s+/g, ' ').trim();
const hasWords = (text) => LETTER.test(text);

/** Template text with each interpolation shown as {} so a finding is stable and readable. */
function templateText(node) {
  return normalise(node.head.text + node.templateSpans.map((span) => `{}${span.literal.text}`).join(''));
}

function propertyName(property) {
  return property.name && (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ? property.name.text : '';
}

/** Strips parentheses, `as`, `satisfies` and `!`, none of which changes the value shown. */
const unwrap = (node) => (node && (ts.isParenthesizedExpression(node) || ts.isAsExpression(node)
  || ts.isNonNullExpression(node) || ts.isSatisfiesExpression(node)) ? unwrap(node.expression) : node);

// ---------------------------------------------------------------------------------------------
// Lexical scopes within one file. A binding maps a name to the VariableDeclaration of a plain
// `const name = value`, or to undefined for any other binding (opaque: the search stops there).
// ---------------------------------------------------------------------------------------------

/** Names a declaration binds: an identifier, or every name inside a destructuring pattern. */
function bindingNames(name) {
  if (ts.isIdentifier(name)) return [name.text];
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    return name.elements.flatMap((element) => (ts.isBindingElement(element) ? bindingNames(element.name) : []));
  }
  return [];
}

const opaque = (names) => names.map((name) => [name, undefined]);

function variableBindings(list) {
  const plainConst = (list.flags & BLOCK_SCOPED) === ts.NodeFlags.Const;
  return list.declarations.flatMap((declaration) => (plainConst && ts.isIdentifier(declaration.name) && declaration.initializer
    ? [[declaration.name.text, declaration]]
    : opaque(bindingNames(declaration.name))));
}

function importBindings(clause) {
  if (!clause) return [];
  const named = clause.namedBindings;
  return opaque([
    ...(clause.name ? [clause.name.text] : []),
    ...(named && ts.isNamespaceImport(named) ? [named.name.text] : []),
    ...(named && ts.isNamedImports(named) ? named.elements.map((element) => element.name.text) : []),
  ]);
}

function statementBindings(statement) {
  if (ts.isVariableStatement(statement)) return variableBindings(statement.declarationList);
  if (ts.isImportDeclaration(statement)) return importBindings(statement.importClause);
  const named = ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)
    || ts.isModuleDeclaration(statement) || ts.isImportEqualsDeclaration(statement);
  return named && statement.name && ts.isIdentifier(statement.name) ? opaque([statement.name.text]) : [];
}

/** `var` declarations anywhere in a file or function body hoist to it; nested functions and classes keep theirs. */
function hoistedVars(scope) {
  const found = [];
  const walk = (node) => {
    if (ts.isFunctionLike(node) || ts.isClassLike(node)) return;
    if (ts.isVariableDeclarationList(node) && (node.flags & BLOCK_SCOPED) === 0) found.push(...variableBindings(node));
    ts.forEachChild(node, walk);
  };
  ts.forEachChild(scope, walk);
  return found;
}

/** The bindings a node introduces for code inside it, or [] when it is not a scope. */
function scopeBindings(node) {
  if (ts.isSourceFile(node) || ts.isModuleBlock(node)) return [...node.statements.flatMap(statementBindings), ...hoistedVars(node)];
  if (ts.isBlock(node)) {
    const own = node.statements.flatMap(statementBindings);
    return node.parent && ts.isFunctionLike(node.parent) ? [...own, ...hoistedVars(node)] : own;
  }
  if (ts.isCaseBlock(node)) return node.clauses.flatMap((clause) => clause.statements.flatMap(statementBindings));
  if (ts.isFunctionLike(node)) {
    const ownName = ts.isFunctionExpression(node) && node.name ? [node.name.text] : [];
    return opaque([...ownName, ...node.parameters.flatMap((parameter) => bindingNames(parameter.name))]);
  }
  if (ts.isClassExpression(node) && node.name) return opaque([node.name.text]);
  if (ts.isForStatement(node) || ts.isForInStatement(node) || ts.isForOfStatement(node)) {
    return node.initializer && ts.isVariableDeclarationList(node.initializer) ? variableBindings(node.initializer) : [];
  }
  if (ts.isCatchClause(node)) return node.variableDeclaration ? opaque(bindingNames(node.variableDeclaration.name)) : [];
  return [];
}

/** For one file: the const declaration an identifier refers to, or undefined when anything else binds it. */
function constantResolver() {
  const cache = new Map();
  const bindingsOf = (scope) => {
    if (!cache.has(scope)) {
      const bindings = new Map();
      // A name bound twice in one scope is ambiguous (and invalid code), so it stays opaque.
      for (const [name, declaration] of scopeBindings(scope)) bindings.set(name, bindings.has(name) ? undefined : declaration);
      cache.set(scope, bindings);
    }
    return cache.get(scope);
  };
  return (identifier) => {
    for (let scope = identifier.parent; scope; scope = scope.parent) {
      const bindings = bindingsOf(scope);
      if (bindings.has(identifier.text)) return bindings.get(identifier.text);
    }
    return undefined;
  };
}

function scanSource(file, sourceText) {
  const scriptKind = file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  const constantFor = constantResolver();
  const findings = [];

  const report = (node, kind, text) => {
    const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
    findings.push({ file, line: line + 1, column: character + 1, kind, text });
  };

  /**
   * One display site. `at` is the name a const was reached through, where findings are reported;
   * `seen` holds the consts this site has expanded, so each is expanded once and cycles end.
   */
  const site = (at) => ({ at, seen: new Set() });

  /** Follows a name to the initializer of its same-file const, once per display site. */
  const follow = (identifier, trail, next) => {
    const declaration = constantFor(identifier);
    if (!declaration || trail.seen.has(declaration)) return;
    trail.seen.add(declaration);
    next(declaration.initializer, { at: trail.at || identifier, seen: trail.seen });
  };

  /** Follows only the parts of an expression whose value is shown. */
  const rendered = (expression, kind, trail) => {
    const node = unwrap(expression);
    if (!node) return;
    if (ts.isIdentifier(node)) {
      follow(node, trail, (value, next) => rendered(value, kind, next));
      return;
    }
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const text = normalise(node.text);
      if (hasWords(text)) report(trail.at || node, kind, text);
      return;
    }
    if (ts.isTemplateExpression(node)) {
      const statics = [node.head.text, ...node.templateSpans.map((span) => span.literal.text)];
      if (statics.some(hasWords)) report(trail.at || node, kind, templateText(node));
      node.templateSpans.forEach((span) => rendered(span.expression, kind, trail));
      return;
    }
    if (ts.isConditionalExpression(node)) {
      rendered(node.whenTrue, kind, trail);
      rendered(node.whenFalse, kind, trail);
      return;
    }
    if (ts.isBinaryExpression(node)) {
      const operator = node.operatorToken.kind;
      if (operator === ts.SyntaxKind.AmpersandAmpersandToken) rendered(node.right, kind, trail);
      else if (operator === ts.SyntaxKind.BarBarToken || operator === ts.SyntaxKind.QuestionQuestionToken
        || operator === ts.SyntaxKind.PlusToken) {
        rendered(node.left, kind, trail);
        rendered(node.right, kind, trail);
      }
      return;
    }
    if (ts.isArrayLiteralExpression(node)) node.elements.forEach((element) => rendered(element, kind, trail));
  };

  /**
   * The user-facing keys of objects: options={{ title: 'Home' }} and similar objects handed to
   * navigators or components, props spread in with {...(cond ? { action: 'Edit' } : {})} and, for
   * display calls only (intoArrays), arrays of such objects such as Alert.alert buttons. Conditional
   * branches and same-file consts are followed; every other field is ignored.
   */
  const userFacingKeys = (expression, prefix, trail, intoArrays) => {
    const node = unwrap(expression);
    if (!node) return;
    if (ts.isIdentifier(node)) {
      follow(node, trail, (value, next) => userFacingKeys(value, prefix, next, intoArrays));
      return;
    }
    if (ts.isConditionalExpression(node)) {
      userFacingKeys(node.whenTrue, prefix, trail, intoArrays);
      userFacingKeys(node.whenFalse, prefix, trail, intoArrays);
      return;
    }
    if (intoArrays && ts.isArrayLiteralExpression(node)) {
      node.elements.forEach((element) => userFacingKeys(element, prefix, trail, intoArrays));
      return;
    }
    if (!ts.isObjectLiteralExpression(node)) return;
    for (const property of node.properties) {
      const value = ts.isPropertyAssignment(property) ? property.initializer
        : ts.isShorthandPropertyAssignment(property) ? property.name : undefined;
      const name = value ? propertyName(property) : '';
      if (USER_FACING_PROPS.has(name)) rendered(value, `${prefix}:${name}`, site(trail.at));
    }
  };

  const visit = (node) => {
    if (ts.isJsxText(node)) {
      const text = normalise(node.text);
      if (hasWords(text)) report(node, 'jsx-text', text);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(source);
      const value = node.initializer;
      if (value && ts.isStringLiteral(value)) {
        const text = normalise(value.text);
        if (USER_FACING_PROPS.has(name) && hasWords(text)) report(value, `prop:${name}`, text);
      } else if (value && ts.isJsxExpression(value) && value.expression) {
        if (USER_FACING_PROPS.has(name)) rendered(value.expression, `prop:${name}`, site());
        else userFacingKeys(value.expression, 'option', site(), false);
      }
    } else if (ts.isJsxSpreadAttribute(node)) {
      userFacingKeys(node.expression, 'prop', site(), false);
    } else if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      rendered(node.expression, 'jsx-expression', site());
    } else if (ts.isCallExpression(node)) {
      const callee = node.expression;
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : '';
      if (DISPLAY_CALLS.has(name)) {
        // Two separate sites: a const the text pass expands must still be read for its fields.
        for (const argument of node.arguments) {
          rendered(argument, `call:${name}`, site());
          userFacingKeys(argument, `call:${name}`, site(), true);
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(source);
  return findings;
}

/** Every .ts/.tsx file under src/, as sorted posix paths relative to root. */
function listSourceFiles(root) {
  const files = [];
  const walk = (relativeDirectory) => {
    const entries = fs.readdirSync(path.join(root, relativeDirectory), { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const entry of entries) {
      const relative = `${relativeDirectory}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRECTORIES.has(entry.name)) walk(relative);
      } else if (entry.isFile() && SOURCE_FILE.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        files.push(relative);
      }
    }
  };
  if (fs.existsSync(path.join(root, 'src'))) walk('src');
  return files;
}

function readSource(root, file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function readBaseline() {
  const parsed = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (!parsed || !Array.isArray(parsed.entries)) throw new Error('copy-literal-baseline.json needs an "entries" array');
  return parsed.entries;
}

/** Matches findings to baseline entries on file, kind and text, counting duplicates. */
function compareWithBaseline(findings, baseline) {
  const key = (item) => [item.file, item.kind, item.text].join('\n');
  const allowance = new Map();
  for (const entry of baseline) allowance.set(key(entry), (allowance.get(key(entry)) || 0) + 1);
  const unexpected = [];
  for (const finding of findings) {
    const remaining = allowance.get(key(finding)) || 0;
    if (remaining > 0) allowance.set(key(finding), remaining - 1);
    else unexpected.push(finding);
  }
  const stale = [];
  for (const entry of baseline) {
    const remaining = allowance.get(key(entry)) || 0;
    if (remaining > 0) {
      stale.push(entry);
      allowance.set(key(entry), remaining - 1);
    }
  }
  return { unexpected, stale };
}

/** Shape problems of one baseline entry; [] when it has exactly the four non-empty text fields the scan could produce. */
function entryShapeProblems(entry, index) {
  const at = `Baseline entry ${index + 1}`;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [`${at} is not an object`];
  const exact = Object.keys(entry).sort().join(',') === [...BASELINE_FIELDS].sort().join(',');
  const fields = exact ? [] : [`${at} must have exactly the fields ${BASELINE_FIELDS.join(', ')}`];
  const empty = BASELINE_FIELDS.filter((field) => typeof entry[field] !== 'string' || entry[field] === '');
  if (empty.length) return [...fields, `${at} needs non-empty text in ${empty.join(', ')}`];
  return [
    ...fields,
    ...(BASELINE_FILE.test(entry.file) ? [] : [`${at} file must be a .ts or .tsx path under src/`]),
    ...(BASELINE_KIND.test(entry.kind) ? [] : [`${at} has an unknown kind ${entry.kind}`]),
    ...(entry.text === normalise(entry.text) && hasWords(entry.text) ? [] : [`${at} text must be normalised and contain a letter, as the scan reports it`]),
  ];
}

/**
 * Checks baseline entries against a policy the caller pins:
 *   - original: the entries as first written; the baseline must be a multiset subset of them, on
 *     (file, kind, text, owner), so entries can be removed but never added, swapped, re-kinded,
 *     re-owned or duplicated, whatever the count;
 *   - owners: the goals that may own an entry; forbiddenOwners: goals that never may;
 *   - migratedPaths: screens migrated to the catalog (a path ending in / is a directory), which may
 *     hold no entry at all.
 * Returns one message per problem, or [] when the baseline is acceptable.
 */
function baselineProblems(entries, policy) {
  if (!Array.isArray(entries)) return ['The baseline entries are not an array'];
  const tuple = (entry) => [entry.file, entry.kind, entry.text, entry.owner].join('\n');
  const allowance = new Map();
  for (const entry of policy.original) allowance.set(tuple(entry), (allowance.get(tuple(entry)) || 0) + 1);
  const migrated = (file) => policy.migratedPaths.some((p) => (p.endsWith('/') ? file.startsWith(p) : file === p));
  const problems = [];
  entries.forEach((entry, index) => {
    const shape = entryShapeProblems(entry, index);
    if (shape.length) {
      problems.push(...shape);
      return;
    }
    const at = `Baseline entry ${index + 1} ${entry.file} ${entry.kind} "${entry.text}" (${entry.owner})`;
    if (policy.forbiddenOwners.includes(entry.owner)) problems.push(`${at}: ${entry.owner} may not own a baseline entry`);
    else if (!policy.owners.includes(entry.owner)) problems.push(`${at}: unknown owner ${entry.owner}`);
    if (migrated(entry.file)) problems.push(`${at}: screen migrated to the catalog by G14.app, so it may not be baselined`);
    const remaining = allowance.get(tuple(entry)) || 0;
    if (remaining > 0) allowance.set(tuple(entry), remaining - 1);
    else problems.push(`${at}: not in the original baseline (entries may only be removed)`);
  });
  return problems;
}

function checkTree(root, baseline) {
  const files = listSourceFiles(root);
  const findings = files.flatMap((file) => scanSource(file, readSource(root, file)));
  return { files, findings, ...compareWithBaseline(findings, baseline) };
}

/** Test support: writes files into a new temporary directory and returns its path. */
function writeScratchTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), scratchPrefix));
  for (const [file, text] of Object.entries(files)) {
    const target = path.resolve(root, file);
    if (!target.startsWith(root + path.sep)) throw new Error(`Scratch file escapes the scratch directory: ${file}`);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  return root;
}

/** Test support: removes only a directory that writeScratchTree created. */
function removeTree(root) {
  const resolved = path.resolve(root);
  if (path.dirname(resolved) !== path.resolve(os.tmpdir()) || !path.basename(resolved).startsWith(scratchPrefix)) {
    throw new Error(`Refusing to remove ${root}: it is not a scratch directory made by this scan`);
  }
  fs.rmSync(resolved, { recursive: true, force: true });
}

function main() {
  const result = checkTree(appRoot, readBaseline());
  for (const finding of result.unexpected) {
    console.error(`${finding.file}:${finding.line}:${finding.column} ${finding.kind} "${finding.text}": move it to the catalog and show it through t() or a lib/i18n formatter.`);
  }
  for (const entry of result.stale) {
    console.error(`Stale baseline entry ${entry.file} ${entry.kind} "${entry.text}" (${entry.owner}): remove it from scripts/copy-literal-baseline.json.`);
  }
  if (result.unexpected.length || result.stale.length) {
    process.exitCode = 1;
    return;
  }
  console.log(`Copy literal scan passed: ${result.files.length} files, ${result.findings.length} baselined literals in other lanes' screens.`);
}

if (require.main === module) main();

module.exports = {
  appRoot, baselinePath, scanSource, listSourceFiles, readSource, readBaseline, compareWithBaseline, baselineProblems, checkTree,
  writeScratchTree, removeTree,
};
