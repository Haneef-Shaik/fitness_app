'use strict';

/**
 * fitlog-colors/no-literal-color — DS-1's colour guard. Every colour in app source must come from a
 * semantic role in useTheme().theme.colors; palette values live only in src/theme/themes/.
 *
 * Catches what the older `no-restricted-syntax` selector misses: template literals, named CSS colours
 * in colour positions, hex inside larger strings (shadows, gradients, inline SVG), numeric colours, and
 * PlatformColor / DynamicColorIOS, which bypass the Momentum palette.
 *
 * Colour positions (DS-1 review 2026-10-27T1605Z, L2): colour-named keys, props, variables, assignments
 * and defaults, including `tint` and `…Tint` props such as MomentumAsset's; the target of Reanimated's
 * withTiming/withSpring (strings only: a number there is an ordinary animation target); and
 * interpolateColor's output range. Reanimated calls are recognised through the file's own import
 * bindings (named, aliased, namespace or default import of react-native-reanimated, dot or static
 * computed access), so a same-named local function, parameter or other module's helper is not a colour
 * helper. PlatformColor / DynamicColorIOS are caught by name as before, and also through an aliased,
 * namespace or static computed import from react-native. Values that reach a colour only through other
 * variables, wrappers or re-exports are not followed.
 */

const pluginName = 'fitlog-colors';
const ruleName = 'no-literal-color';
const ruleId = `${pluginName}/${ruleName}`;

const hexBody = '(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})';
/** A hex colour standing alone or after a separator, so "page#fff" and "Rank #1" stay legal. */
const embeddedHex = new RegExp(`(?:^|[\\s,(:="'])#${hexBody}(?![0-9a-z_-])`, 'i');
/** Functional colours React Native accepts. `\b` keeps "argb(" legal. */
const colorFunction = /\b(?:rgba?|hsla?|hwb)\(/i;
/** Keys and props that hold a colour: color, backgroundColor, tintColor, colors, underlineColorAndroid… */
const colorKey = /colou?rs?(?:Android|IOS)?$/i;
const paintKeys = new Set(['fill', 'stroke']);
/** `tint` itself, or a camelCase name ending in `Tint` (iconTint); "stint" is not a tint. */
const tintKey = /^tint$|Tint$/;
/** Keywords that are not palette choices. */
const allowedKeywords = new Set(['transparent', 'none', 'currentcolor', 'inherit', '']);
const reactNative = 'react-native';
const paletteBypasses = new Set(['PlatformColor', 'DynamicColorIOS']);

/**
 * Reanimated helpers whose arguments are colours, by exported name: the argument index that carries the
 * colour, and whether a number there is a colour too ('any') or only a string is ('text').
 */
const reanimated = 'react-native-reanimated';
const reanimatedColorArguments = new Map([
  ['withTiming', { index: 0, kind: 'text' }],
  ['withSpring', { index: 0, kind: 'text' }],
  ['interpolateColor', { index: 2, kind: 'any' }],
]);

/** CSS named colours React Native resolves (CSS Color Module Level 4). */
const namedColors = new Set(`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue
darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid
darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink
deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold
goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush
lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey
lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime
limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin
navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise
palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue
saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow
springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`
  .split(/\s+/));

/** Nodes a colour value can pass through on its way to the key or prop that names it. */
const passThrough = new Set([
  'ArrayExpression', 'ConditionalExpression', 'LogicalExpression', 'ObjectExpression', 'JSXExpressionContainer',
  'TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression', 'ParenthesizedExpression',
]);

const isColorName = (name) => typeof name === 'string' && (colorKey.test(name) || paintKeys.has(name) || tintKey.test(name));

function keyName(key) {
  if (key.type === 'Identifier') return key.name;
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value;
  return null;
}

function memberName(target) {
  if (target.type === 'Identifier') return target.name;
  if (target.type === 'MemberExpression' && !target.computed && target.property.type === 'Identifier') {
    return target.property.name;
  }
  return null;
}

/** The text of a string literal or of a template literal without expressions, or null. */
function staticString(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis[0].value.cooked ?? null;
  return null;
}

/** The property a member is read through: `x.name`, or `x['name']` / x[`name`] with a static key. */
function propertyName(member) {
  if (!member.computed) return member.property.type === 'Identifier' ? member.property.name : null;
  return staticString(member.property);
}

/** The name a call is made through, as attempt 1 matched it: `name(…)`, `x.name(…)`, `x[name](…)`, plus `x['name'](…)`. */
function calleeName(callee) {
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type !== 'MemberExpression') return null;
  const name = propertyName(callee);
  if (name !== null) return name;
  return callee.computed && callee.property.type === 'Identifier' ? callee.property.name : null;
}

function findVariable(scope, name) {
  for (let current = scope; current; current = current.upper) {
    const variable = current.set.get(name);
    if (variable) return variable;
  }
  return null;
}

/**
 * The module and export an identifier is bound to through an import in its own scope chain, or null
 * when it is bound any other way (a local function, a parameter, a variable) or not bound at all.
 * `imported` is the export name, 'default' or '*' (a namespace).
 */
function importOf(scope, identifier) {
  const variable = findVariable(scope, identifier.name);
  const def = variable && variable.defs.length === 1 ? variable.defs[0] : null;
  if (!def || def.type !== 'ImportBinding' || !def.parent || !def.parent.source) return null;
  const source = def.parent.source.value;
  switch (def.node.type) {
    case 'ImportSpecifier': {
      const imported = def.node.imported;
      return { source, imported: imported.type === 'Identifier' ? imported.name : String(imported.value) };
    }
    case 'ImportDefaultSpecifier':
      return { source, imported: 'default' };
    case 'ImportNamespaceSpecifier':
      return { source, imported: '*' };
    default:
      return null;
  }
}

/**
 * The module export a call resolves to through the file's import bindings: `name(…)` for a named or
 * aliased import, `ns.name(…)` or `ns['name'](…)` for a namespace or default import. Null otherwise.
 */
function importedCallee(scope, callee) {
  if (callee.type === 'Identifier') return importOf(scope, callee);
  if (callee.type !== 'MemberExpression' || callee.object.type !== 'Identifier') return null;
  const object = importOf(scope, callee.object);
  const name = propertyName(callee);
  if (!object || name === null || (object.imported !== '*' && object.imported !== 'default')) return null;
  return { source: object.source, imported: name };
}

/**
 * Whether a value is a colour where it sits, and which kind. 'any': under a colour-named key, prop,
 * variable, assignment or default, or in interpolateColor's output range, where numbers are colours
 * too. 'text': the target of withTiming/withSpring, where only a string is a colour. Null elsewhere.
 * `colorArgument(call, argument)` decides for a call's argument.
 */
function colorPosition(node, colorArgument) {
  let child = node;
  for (let parent = node.parent; parent; child = parent, parent = parent.parent) {
    switch (parent.type) {
      case 'Property':
        if (parent.value !== child) return null;
        if (!parent.computed && isColorName(keyName(parent.key))) return 'any';
        break; // e.g. trackColor={{ false: 'grey' }}: keep climbing through the object
      case 'JSXAttribute':
        return parent.name.type === 'JSXIdentifier' && isColorName(parent.name.name) ? 'any' : null;
      case 'VariableDeclarator':
        return parent.id.type === 'Identifier' && isColorName(parent.id.name) ? 'any' : null;
      case 'AssignmentExpression':
        return parent.right === child && isColorName(memberName(parent.left)) ? 'any' : null;
      case 'AssignmentPattern':
        return parent.right === child && parent.left.type === 'Identifier' && isColorName(parent.left.name) ? 'any' : null;
      case 'ConditionalExpression':
        if (parent.test === child) return null;
        break;
      case 'CallExpression':
        return parent.callee === child ? null : colorArgument(parent, child);
      default:
        if (!passThrough.has(parent.type)) return null;
    }
  }
  return null;
}

const isNamedColor = (text) => {
  const keyword = text.trim().toLowerCase();
  return !allowedKeywords.has(keyword) && namedColors.has(keyword);
};

function isModuleSource(node) {
  const parent = node.parent;
  return Boolean(parent) && parent.source === node && /^(Import|Export(All|Named))Declaration$|^ImportExpression$/.test(parent.type);
}

/** The colour found in a string, without its separator ("#ACABA4", "rgba("), or null. */
function colourIn(text) {
  const hex = embeddedHex.exec(text);
  if (hex) return hex[0].replace(/^[^#]/, '');
  const fn = colorFunction.exec(text);
  return fn ? fn[0] : null;
}

const rule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow literal colours outside the Momentum palette files; use semantic theme roles.',
    },
    schema: [],
    messages: {
      literal: 'Literal colour {{value}} outside the theme. Use a semantic role from useTheme().theme.colors; palette values live only in src/theme/themes/.',
      bypass: '{{callee}}() bypasses the Momentum palette. Add a semantic role in src/theme/themes/ instead.',
    },
  },
  create(context) {
    const { sourceCode } = context;
    const report = (node, value) => context.report({
      node,
      messageId: 'literal',
      data: { value: JSON.stringify(String(value).length > 48 ? `${String(value).slice(0, 45)}...` : String(value)) },
    });
    const importedModules = new Set(sourceCode.ast.body
      .filter((statement) => statement.type === 'ImportDeclaration')
      .map((statement) => statement.source.value));
    const resolve = (call) => importedCallee(sourceCode.getScope(call), call.callee);

    /** The colour kind of `argument` in `call` when the call is a Reanimated colour helper, else null. */
    const colorArgument = (call, argument) => {
      if (!importedModules.has(reanimated)) return null;
      const target = resolve(call);
      const spec = target && target.source === reanimated ? reanimatedColorArguments.get(target.imported) : undefined;
      return spec && call.arguments[spec.index] === argument ? spec.kind : null;
    };

    /** PlatformColor / DynamicColorIOS by name (attempt 1), or through an alias, namespace or computed import. */
    const bypassName = (call) => {
      const name = calleeName(call.callee);
      if (name !== null && paletteBypasses.has(name)) return name;
      if (!importedModules.has(reactNative)) return null;
      const target = resolve(call);
      return target && target.source === reactNative && paletteBypasses.has(target.imported) ? target.imported : null;
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') {
          if (isModuleSource(node)) return;
          const found = colourIn(node.value);
          if (found) report(node, found);
          else if (isNamedColor(node.value) && colorPosition(node, colorArgument)) report(node, node.value);
        } else if (typeof node.value === 'number' && colorPosition(node, colorArgument) === 'any') {
          report(node, node.raw ?? node.value);
        }
      },
      TemplateLiteral(node) {
        const text = node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join('…');
        const found = colourIn(text);
        if (found) report(node, found);
        else if (node.expressions.length === 0 && isNamedColor(text) && colorPosition(node, colorArgument)) report(node, text);
      },
      CallExpression(node) {
        const name = bypassName(node);
        if (name) context.report({ node, messageId: 'bypass', data: { callee: name } });
      },
    };
  },
};

const plugin = { meta: { name: pluginName }, rules: { [ruleName]: rule } };

/** Where the guard runs, and the only places a literal colour may live. */
const colorGuardFiles = ['src/**/*.{js,jsx,ts,tsx,mjs,cjs}'];
const colorGuardIgnores = ['src/theme/themes/**', 'src/**/__tests__/**'];

/** The flat-config block to append to eslint.config.js (see docs/plan/runs/DS-1/handoff.md). */
function colorGuardConfig() {
  return {
    name: 'fitlog/colour-guard',
    files: [...colorGuardFiles],
    ignores: [...colorGuardIgnores],
    plugins: { [pluginName]: plugin },
    rules: { [ruleId]: 'error' },
  };
}

module.exports = { rule, plugin, ruleId, colorGuardFiles, colorGuardIgnores, colorGuardConfig };
