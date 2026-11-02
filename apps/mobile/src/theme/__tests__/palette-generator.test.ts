import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * End-to-end: the real generator script with the real @material/material-color-utilities (ESM-only, so it
 * cannot load inside Jest). These runs prove the committed palette regenerates from seed #C6F432 with no diff.
 */
const appRoot = join(__dirname, '..', '..', '..');
const themes = join(appRoot, 'src', 'theme', 'themes');
const recipePath = join(themes, 'momentum.recipe.json');
const palettePath = join(themes, 'momentum.json');

function generate(...args: string[]) {
  const run = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/generate-palette.ts', ...args], {
    cwd: appRoot,
    encoding: 'utf8',
    timeout: 60_000,
  });
  if (run.error) throw run.error;
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

let scratch = '';
beforeAll(() => { scratch = mkdtempSync(join(tmpdir(), 'fitlog-ds1-palette-')); });
afterAll(() => { if (scratch) rmSync(scratch, { recursive: true, force: true }); });

jest.setTimeout(120_000);

describe('theme:generate (real Material colour utilities)', () => {
  it('regenerates the committed palette from seed #C6F432 with no diff', () => {
    const before = readFileSync(palettePath, 'utf8');
    const run = generate('--check');
    expect(run.stderr).toBe('');
    expect(run.status).toBe(0);
    expect(run.stdout).toMatch(/momentum\.json matches its recipe: seed #C6F432/);
    expect(readFileSync(palettePath, 'utf8')).toBe(before);
  });

  it('fails every pin when the seed changes, naming the old and new Material values', () => {
    const recipe = JSON.parse(readFileSync(recipePath, 'utf8')) as { seed: string; curations: Record<string, object> };
    const pins = Object.keys(recipe.curations.dark ?? {}).length + Object.keys(recipe.curations.light ?? {}).length;
    const moved = join(scratch, 'ember.recipe.json');
    writeFileSync(moved, JSON.stringify({ ...recipe, seed: '#FF5A1F' }));
    const run = generate('--check', '--recipe', moved);
    expect(run.status).toBe(1);
    expect(run.stderr.match(/^.*but the seed now gives #[0-9A-F]{6}/gm)).toHaveLength(pins);
  });

  it('fails a hand edit to the generated palette and names the role', () => {
    const edited = join(scratch, 'edited.json');
    writeFileSync(edited, readFileSync(palettePath, 'utf8').replace('"coachInk": "#CDBDFF"', '"coachInk": "#CDBDFE"'));
    const run = generate('--check', '--palette', edited);
    expect(run.status).toBe(1);
    expect(run.stderr).toContain('dark.coachInk: generated #CDBDFF, committed "#CDBDFE"');
  });

  it('fails a formatting-only drift', () => {
    const reformatted = join(scratch, 'reformatted.json');
    writeFileSync(reformatted, JSON.stringify(JSON.parse(readFileSync(palettePath, 'utf8'))));
    const run = generate('--check', '--palette', reformatted);
    expect(run.status).toBe(1);
    expect(run.stderr).toMatch(/formatting differs/);
  });

  it('prints an exploratory candidate for another seed without touching the palette', () => {
    const before = readFileSync(palettePath, 'utf8');
    const run = generate('--candidate', '#ffb000');
    expect(run.status).toBe(0);
    const candidate = JSON.parse(run.stdout) as { id: string; colors: { dark: Record<string, string> } };
    expect(candidate.id).toBe('custom-ffb000');
    expect(candidate.colors.dark.coachInk).toBe('#CDBDFF');
    expect(readFileSync(palettePath, 'utf8')).toBe(before);
  });

  it('reports usage errors with exit code 2', () => {
    const run = generate('--force');
    expect(run.status).toBe(2);
    expect(run.stderr).toMatch(/Unknown option --force/);
  });
});
