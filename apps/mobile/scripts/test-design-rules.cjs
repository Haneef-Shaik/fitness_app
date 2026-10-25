const assert = require('node:assert/strict');
const { ESLint } = require('eslint');

async function verify() {
  const eslint = new ESLint();
  const [bad] = await eslint.lintText(
    'export const style = { color: "#ffffff", fontSize: 16, borderRadius: 28 };',
    { filePath: 'src/ui/guard-fixture.ts' },
  );
  assert.equal(bad.messages.filter((message) => message.ruleId === 'no-restricted-syntax').length, 3,
    'The design rules must reject literal colors, font sizes and radii in UI code.');
  const [good] = await eslint.lintText(
    'export const styles = (theme) => ({ color: theme.colors.onSurface, ...theme.typography.body, borderRadius: theme.radius.card });',
    { filePath: 'src/ui/guard-fixture.ts' },
  );
  assert.equal(good.messages.filter((message) => message.ruleId === 'no-restricted-syntax').length, 0);
  console.log('Design rules verified: raw visual values fail; semantic tokens pass.');
}

verify().catch((error) => { console.error(error); process.exitCode = 1; });
