// DS-2 evidence probe: verifies the proposed literal-font selector (request R2 to DS-1) without editing the repo.
// Usage (from the repo root): node docs/evidence/DS-2/probes/guard-patch.cjs "$PWD/apps/mobile" [current]
// `current` swaps in today's selector to show which bypasses it misses. Exit 1 when any case differs.
const path = require('node:path');
const { createRequire } = require('node:module');

const appRoot = process.argv[2];
const appRequire = createRequire(path.join(appRoot, 'package.json'));
const { ESLint } = appRequire('eslint');

const TYPE_KEYS = 'fontSize|lineHeight|fontFamily|fontWeight|letterSpacing';
const proposed = [
  'error',
  {
    selector: 'Literal[value=/^(#[a-fA-F0-9]{3,8}|rgba?\\(|hsla?\\()/]',
    message: 'Use semantic theme colors. Define palette values in src/theme/themes/.',
  },
  {
    selector: [
      `Property[key.name=/^(${TYPE_KEYS}|borderRadius)$/] > Literal`,
      `Property[key.value=/^(${TYPE_KEYS}|borderRadius)$/] > Literal.value`,
      `Property[key.name=/^(${TYPE_KEYS})$/] > TemplateLiteral`,
      `Property[key.name=/^(${TYPE_KEYS})$/] > :matches(ConditionalExpression, LogicalExpression) > Literal`,
    ].join(', '),
    message: 'Use the shared typography or radius tokens from useTheme().',
  },
];
if (process.argv[3] === 'current') {
  proposed[2] = { ...proposed[2], selector: 'Property[key.name=/^(fontSize|lineHeight|fontFamily|borderRadius)$/] > Literal' };
}

async function main() {
  const eslint = new ESLint({
    cwd: appRoot,
    overrideConfig: { files: ['src/**/*.{ts,tsx}'], ignores: ['src/theme/**', 'src/**/__tests__/**'], rules: { 'no-restricted-syntax': proposed } },
  });
  const count = async (code) => {
    const [result] = await eslint.lintText(code, { filePath: path.join(appRoot, 'src/ui/guard-fixture.tsx') });
    return result.messages.filter((m) => m.ruleId === 'no-restricted-syntax').length;
  };
  const cases = [
    ['literal size (already caught today)', 'export const s = { fontSize: 16 };', 1],
    ['template-literal family', 'export const s = { fontFamily: `Inter` };', 1],
    ['quoted key', "export const s = { 'fontSize': 16 };", 1],
    ['conditional size', 'export const s = (big) => ({ fontSize: big ? 20 : 16 });', 2],
    ['fallback family', "export const s = (f) => ({ fontFamily: f || 'Inter' });", 1],
    ['literal weight', "export const s = { fontWeight: '700' };", 1],
    ['literal letter spacing', 'export const s = { letterSpacing: 0.5 };', 1],
    ['theme tokens', 'export const s = (t) => ({ ...t.typography.bodyLarge, fontFamily: t.typography.numberHero.fontFamily });', 0],
  ];
  let failed = 0;
  for (const [name, code, expected] of cases) {
    const actual = await count(code);
    if (actual !== expected) failed += 1;
    console.log(`${actual === expected ? 'ok  ' : 'FAIL'} ${name}: ${actual} (expected ${expected})`);
  }
  const results = await eslint.lintFiles(['src/**/*.{ts,tsx}']);
  const existing = results.flatMap((r) => r.messages.filter((m) => m.ruleId === 'no-restricted-syntax').map((m) => `${path.relative(appRoot, r.filePath)}:${m.line}`));
  console.log(`existing source flagged by the proposed selector: ${existing.length}${existing.length ? `\n${existing.join('\n')}` : ''}`);
  process.exitCode = failed || existing.length ? 1 : 0;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
