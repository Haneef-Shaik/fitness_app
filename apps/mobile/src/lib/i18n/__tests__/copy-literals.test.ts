/**
 * Guard for docs/23 §9 rule 4: every string on a screen goes through the catalog.
 * The scanner is a plain Node module so it can also run on its own:
 *   node scripts/copy-literal-scan.cjs   (from apps/mobile)
 * It is separate from the colour and font guard in scripts/test-design-rules.cjs.
 *
 * Proof status: every test below is UNRUN. The 27 Oct source-correction phase (review findings M3
 * and M4) had no shell, so none of these tests has been seen to fail or to pass yet.
 */
interface Finding { file: string; line: number; column: number; kind: string; text: string }
interface BaselineEntry { file: string; kind: string; text: string; owner: string }
interface CheckResult { files: string[]; findings: Finding[]; unexpected: Finding[]; stale: BaselineEntry[] }
interface BaselinePolicy {
  original: readonly BaselineEntry[];
  owners: readonly string[];
  forbiddenOwners: readonly string[];
  migratedPaths: readonly string[];
}
interface LiteralScan {
  appRoot: string;
  scanSource(file: string, source: string): Finding[];
  listSourceFiles(root: string): string[];
  readSource(root: string, file: string): string;
  readBaseline(): BaselineEntry[];
  compareWithBaseline(findings: readonly Finding[], baseline: readonly BaselineEntry[]): Pick<CheckResult, 'unexpected' | 'stale'>;
  baselineProblems(entries: unknown, policy: BaselinePolicy): string[];
  checkTree(root: string, baseline: readonly BaselineEntry[]): CheckResult;
  writeScratchTree(files: Readonly<Record<string, string>>): string;
  removeTree(root: string): void;
}

const scan = jest.requireActual<LiteralScan>('../../../../scripts/copy-literal-scan.cjs');
const texts = (findings: readonly Finding[]) => findings.map((finding) => finding.text);
const kindsAndTexts = (findings: readonly Finding[]) => findings.map((finding) => [finding.kind, finding.text]);
const directoryOf = (file: string) => file.slice(0, file.lastIndexOf('/'));
/** Builds template-literal source text for fixtures without writing a template placeholder in a plain string. */
const slot = (expression: string) => ['$', '{', expression, '}'].join('');
const template = (...parts: string[]) => ['`', ...parts, '`'].join('');

/**
 * The baseline exactly as first written (scripts/copy-literal-baseline.json, 27 Oct 2026): 13
 * (file, kind, text, owner) tuples, copied from that file. Pinned here, apart from the JSON, so the
 * baseline may lose entries as their owners migrate them, but can never gain, swap, re-kind, re-own
 * or duplicate one. A fixed hash of the JSON would also block those legitimate removals.
 */
const ORIGINAL_BASELINE: readonly BaselineEntry[] = [
  { file: 'src/features/food/FoodScreen.tsx', kind: 'jsx-expression', text: 'g', owner: 'SC-4' },
  { file: 'src/features/food/FoodScreen.tsx', kind: 'jsx-expression', text: '{} kcal', owner: 'SC-4' },
  { file: 'src/features/food/FoodScreen.tsx', kind: 'jsx-text', text: 'g', owner: 'SC-4' },
  { file: 'src/features/gym/GymPlansScreen.tsx', kind: 'jsx-text', text: '· v', owner: 'G17.app' },
  { file: 'src/features/settings/ProfileScreen.tsx', kind: 'prop:label', text: 'English', owner: 'SC-6' },
  { file: 'src/features/settings/ProfileScreen.tsx', kind: 'prop:label', text: 'हिन्दी', owner: 'SC-6' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'prop:label', text: '{} (kg)', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-expression', text: '{}: {} kg × {} · {}', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-expression', text: '× {} kg', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-expression', text: 's', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-text', text: 'kg·reps', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-expression', text: '× {} kg', owner: 'SC-1' },
  { file: 'src/features/training/WorkoutScreen.tsx', kind: 'jsx-expression', text: 's', owner: 'SC-1' },
];

/**
 * Owners and screens are pinned here too. G14.app may never baseline its own literals, and no entry
 * may sit in a screen G14.app migrated to the catalog (paths ending in / are whole directories).
 */
const BASELINE_POLICY: BaselinePolicy = {
  original: ORIGINAL_BASELINE,
  owners: ['SC-1', 'SC-4', 'SC-6', 'G17.app'],
  forbiddenOwners: ['G14.app'],
  migratedPaths: [
    'src/lib/i18n/', 'src/features/today/', 'src/features/progress/',
    'src/features/today/TodayScreen.tsx', 'src/features/progress/ProgressScreen.tsx', 'src/features/progress/NewGoalScreen.tsx',
    'src/features/training/EditSetScreen.tsx', 'src/features/training/HistoryScreen.tsx', 'src/features/training/PlatesScreen.tsx',
    'src/features/training/ProgrammeScreen.tsx', 'src/features/training/ScheduleScreen.tsx',
  ],
};
const problemsFor = (entries: readonly unknown[]) => scan.baselineProblems(entries, BASELINE_POLICY);
const without = <T>(items: readonly T[], index: number): T[] => [...items.slice(0, index), ...items.slice(index + 1)];
const originalWithText = (text: string) => ORIGINAL_BASELINE.find((entry) => entry.text === text)!;

/** Directories holding a route or a component that renders the shared Screen. */
function screenDirectories(): string[] {
  const files = scan.listSourceFiles(scan.appRoot).filter((file) => file.endsWith('.tsx'));
  const screens = files.filter((file) => file.startsWith('src/app/') || /<Screen[\s>]/.test(scan.readSource(scan.appRoot, file)));
  return [...new Set(screens.map(directoryOf))].sort();
}

describe('user-facing literal rules', () => {
  it('flags visible JSX text in either script and ignores separators', () => {
    const found = scan.scanSource('src/features/x/X.tsx',
      'export const X = () => <><AppText>Hello there</AppText><AppText>नमस्ते</AppText><AppText>{a} · {b} — {c}</AppText></>;');
    expect(kindsAndTexts(found)).toEqual([['jsx-text', 'Hello there'], ['jsx-text', 'नमस्ते']]);
  });

  it('flags literal user-facing props but not technical props', () => {
    const found = scan.scanSource('src/features/x/X.tsx', [
      'export const X = () => <>',
      '<AppButton label="Save" testID="save-button" tone="error" />',
      '<Field label={t(\'save\')} placeholder="YYYY-MM-DD" inputMode="decimal" />',
      `<Header title={${template(slot("t('load')"), ' (kg)')}} action={t('edit')} />`,
      `<View accessibilityLabel={${template(slot('a'), ': ', slot('b'))}} style={{ fontWeight: 'bold' }} />`,
      '</>;',
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([['prop:label', 'Save'], ['prop:placeholder', 'YYYY-MM-DD'], ['prop:title', '{} (kg)']]);
    expect(found.map((finding) => finding.line)).toEqual([2, 3, 4]);
  });

  it('follows rendered branches but not translation keys or conditions', () => {
    const found = scan.scanSource('src/features/x/X.tsx', [
      'export const X = () => <AppText>',
      "{ready ? 'Ready' : t('notReady')}",
      "{t(mode === 'login' ? 'signIn' : 'signUp')}",
      "{count > 1 && 'many'}",
      "{name ?? 'Unknown'}",
      "{mode === 'kcal' ? '' : '—'}",
      `{${template('× ', slot('load'), ' kg')}}`,
      '</AppText>;',
    ].join('\n'));
    expect(texts(found)).toEqual(['Ready', 'many', 'Unknown', '× {} kg']);
  });

  it('flags option objects, spread props, alerts and error setters', () => {
    const found = scan.scanSource('src/app/x.tsx', [
      "export const X = () => <Tabs.Screen options={{ title: 'Home', tabBarIcon: icon, headerShown: false }} />;",
      "export const Y = () => <Header {...(edit ? { action: 'Edit', onAction: go } : {})} title={t('profile')} />;",
      "export const Z = () => <Header {...(edit ? { action: t('edit') } : {})} style={busy ? { opacity: 0.5 } : {}} />;",
      "function f() { setError('Could not save'); setError(''); Alert.alert('Delete?', t('confirm')); }",
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([
      ['option:title', 'Home'], ['prop:action', 'Edit'], ['call:setError', 'Could not save'], ['call:alert', 'Delete?'],
    ]);
  });

  it('checks plain TypeScript modules for display calls too', () => {
    const found = scan.scanSource('src/features/x/hooks.ts', "export function f(setError: (m: string) => void) { setError('Network down'); }");
    expect(texts(found)).toEqual(['Network down']);
  });
});

// Review finding M3 (27 Oct): literals reached through a same-file const or a display-call object.
// Planted regressions and translation-safe controls. UNRUN.
describe('same-file constants and display objects', () => {
  it('follows a same-file const to the literal it holds, but not keys, conditions or other fields', () => {
    const found = scan.scanSource('src/features/x/X.tsx', [
      "const saveLabel = 'Save';",
      "const greeting = ready ? 'Ready' : t('wait');",
      'const aliased = saveLabel;',
      "const saveKey = 'save';",
      "const isEdit = mode === 'edit';",
      "const choices = [{ value: 'light', label: 'light' }] as const;",
      "const route = 'workout';",
      'export const X = () => <>',
      '<AppButton label={saveLabel} />',
      '<AppText>{greeting}</AppText>',
      '<AppText>{aliased}</AppText>',
      '<AppText>{t(saveKey)}</AppText>',
      "<AppText>{isEdit ? t('edit') : t('add')}{isEdit}</AppText>",
      '{choices.map((choice) => <Choice key={choice.value} label={t(choice.label)} />)}',
      '<AppText>{choices}</AppText>',
      '<AppButton label={t(saveKey)} onPress={() => router.push(route)} />',
      '</>;',
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([['prop:label', 'Save'], ['jsx-expression', 'Ready'], ['jsx-expression', 'Save']]);
    expect(found.map((finding) => finding.line)).toEqual([9, 10, 11]);
  });

  it('respects lexical shadowing: only the nearest binding counts, and only a const is followed', () => {
    const found = scan.scanSource('src/features/x/Shadow.tsx', [
      "const title = 'Module title';",
      'export function Param({ title }: { title: string }) { return <Header title={title} />; }',
      "export function Inner() { const title = t('inner'); return <Header title={title} />; }",
      "export function Mutable() { let title = t('x'); return <Header title={title} />; }",
      "export function Hoisted() { if (ready) { var title = t('v'); } return <Header title={title} />; }",
      'export function Loop(names: string[]) { for (const title of names) return <Header title={title} />; return null; }',
      'export function Mapped(names: string[]) { return names.map((title) => <Header key={title} title={title} />); }',
      'export function Caught() { try { go(); } catch (title) { return <Header title={title} />; } return null; }',
      "export function Block() { const title = t('outer'); { const title = 'Block title'; return <Header title={title} />; } }",
      'export function Outer() { return <Header title={title} />; }',
      'export function Early() { return <Header title={late} />; }',
      "const late = 'Late title';",
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([['prop:title', 'Block title'], ['prop:title', 'Module title'], ['prop:title', 'Late title']]);
    expect(found.map((finding) => finding.line)).toEqual([9, 10, 11]);
  });

  it('does not follow imports: no cross-file resolution', () => {
    const found = scan.scanSource('src/features/x/Imported.tsx', [
      "import { title } from './copy';",
      'export const X = () => <Header title={title} />;',
    ].join('\n'));
    expect(found).toEqual([]);
  });

  it('stops safely on cyclic and self-referencing consts', () => {
    const found = scan.scanSource('src/features/x/Cycle.tsx', [
      'const loopA = loopB;',
      'const loopB = loopA;',
      'const selfish = selfish;',
      "const tail = tailAlias || 'Cycle tail';",
      'const tailAlias = tail;',
      'export const C = () => <AppText>{loopA}{selfish}{tail}{tailAlias}</AppText>;',
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([['jsx-expression', 'Cycle tail'], ['jsx-expression', 'Cycle tail']]);
  });

  it('reads display-call arrays and objects only at user-facing fields', () => {
    const found = scan.scanSource('src/features/x/calls.tsx', [
      "const keepButtons = [{ text: 'Keep', style: 'cancel' }];",
      "const title = 'Settings';",
      'export function f(navigation: Navigation) {',
      "  Alert.alert(t('deleteTitle'), t('deleteBody'), [{ text: 'Delete', style: 'destructive', onPress: () => remove('Draft') }, { text: t('cancel'), style: 'cancel' }]);",
      "  Alert.alert(t('discardTitle'), undefined, keepButtons);",
      "  navigation.setOptions({ title: 'Home', headerShown: false });",
      '  navigation.setOptions({ title });',
      "  navigation.setOptions({ title: t('home'), headerShown: false, animation: 'fade' });",
      "  Alert.alert(t('saved'), t('savedBody'), [{ text: t('ok'), style: 'default' }]);",
      "  router.push({ pathname: '/settings', params: { title: 'Not shown' } });",
      '}',
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([
      ['call:alert:text', 'Delete'], ['call:alert:text', 'Keep'], ['call:setOptions:title', 'Home'], ['call:setOptions:title', 'Settings'],
    ]);
    expect(found.map((finding) => finding.line)).toEqual([4, 5, 6, 7]);
  });

  it('follows a const option object to its user-facing fields only', () => {
    const found = scan.scanSource('src/app/(member)/_layout.tsx', [
      "const tabOptions = { title: 'Today', headerShown: false, tabBarTestID: 'today-tab' } as const;",
      "const rowStyle = { fontWeight: 'bold', fontFamily: 'GoogleSansFlex_700Bold' };",
      "const translated = { title: t('train') };",
      'export default function Layout() { return <Tabs>',
      '<Tabs.Screen name="today" options={tabOptions} />',
      '<Tabs.Screen name="train" options={translated} />',
      '<View style={rowStyle} />',
      '</Tabs>; }',
    ].join('\n'));
    expect(kindsAndTexts(found)).toEqual([['option:title', 'Today']]);
    expect(found.map((finding) => finding.line)).toEqual([5]);
  });
});

describe('the app source tree', () => {
  it('has no user-facing literal beyond the shrink-only baseline', () => {
    const result = scan.checkTree(scan.appRoot, scan.readBaseline());
    expect(result.unexpected).toEqual([]);
    expect(result.stale).toEqual([]);
    expect(result.findings).toHaveLength(scan.readBaseline().length);
  });

  it('baselines only other lanes’ screens, each with an owning goal', () => {
    const baseline = scan.readBaseline();
    expect(baseline.length).toBeLessThanOrEqual(13);
    for (const entry of baseline) {
      expect(entry.owner).toMatch(/^(SC-1|SC-4|SC-6|G\d+\.app)$/);
      expect(entry.file).not.toMatch(/^src\/(features\/(today|progress)|lib\/i18n)\//);
    }
  });

  it('covers every directory that holds a screen, including route groups', () => {
    const files = scan.listSourceFiles(scan.appRoot);
    const directories = [...new Set(files.map(directoryOf))];
    for (const directory of [
      'src/app', 'src/app/(member)', 'src/app/auth', 'src/app/gym/[gymId]', 'src/app/gym/[gymId]/(tabs)', 'src/app/programme',
      'src/app/workout', 'src/data', 'src/features/auth', 'src/features/food', 'src/features/gym', 'src/features/progress',
      'src/features/settings', 'src/features/today', 'src/features/training', 'src/ui',
    ]) expect(directories).toContain(directory);
    expect(screenDirectories()).toEqual(expect.arrayContaining(['src/app/gym/[gymId]/(tabs)', 'src/features/training', 'src/data']));
    expect(files.filter((file) => file.includes('__tests__'))).toEqual([]);
  });

  it('fails on a planted literal in every screen directory (scratch copy only)', () => {
    const planted = Object.fromEntries(screenDirectories().map((directory) => [
      `${directory}/PlantedLiteral.tsx`, 'export const Planted = () => <AppText>Planted literal</AppText>;\n',
    ]));
    expect(Object.keys(planted).length).toBeGreaterThanOrEqual(12);
    const root = scan.writeScratchTree(planted);
    try {
      const result = scan.checkTree(root, scan.readBaseline());
      expect(result.unexpected.map((finding) => finding.file).sort()).toEqual(Object.keys(planted).sort());
      expect([...new Set(texts(result.unexpected))]).toEqual(['Planted literal']);
    } finally {
      scan.removeTree(root);
    }
  });

  it('passes a real screen as it is and fails it with one planted literal', () => {
    const file = 'src/features/today/TodayScreen.tsx';
    const source = scan.readSource(scan.appRoot, file);
    const anchor = '<AppText tone="error">{error}</AppText>';
    const plantedSource = source.replace(anchor, `${anchor}<AppText>Planted literal</AppText>`);
    expect(plantedSource).not.toEqual(source);
    const clean = scan.writeScratchTree({ [file]: source });
    const dirty = scan.writeScratchTree({ [file]: plantedSource });
    try {
      expect(scan.checkTree(clean, []).unexpected).toEqual([]);
      expect(kindsAndTexts(scan.checkTree(dirty, []).unexpected)).toEqual([['jsx-text', 'Planted literal']]);
    } finally {
      scan.removeTree(clean);
      scan.removeTree(dirty);
    }
  });

  // M3 on a real screen: a planted const, alert button and screen title fail; a planted module const
  // that the screen's own useState `error` shadows does not. UNRUN.
  it('fails a real screen on a planted const, alert button or screen title, but not on a shadowed module const', () => {
    const file = 'src/features/today/TodayScreen.tsx';
    const source = scan.readSource(scan.appRoot, file);
    const screenStart = 'export function TodayScreen() {';
    const errorLine = '<AppText tone="error">{error}</AppText>';
    const catchLine = "catch (e) { setError(e instanceof Error ? e.message : t('loadFailed')); }";
    for (const anchor of [screenStart, errorLine, catchLine]) expect(source.split(anchor)).toHaveLength(2);
    const planted = source
      .replace(screenStart, `const error = 'Shadowed module error';\nconst plantedTitle = 'Planted const';\n${screenStart}`)
      .replace(errorLine, `${errorLine}<AppText>{plantedTitle}</AppText>`)
      .replace(catchLine, [
        "catch (e) { setError(e instanceof Error ? e.message : t('loadFailed'));",
        "Alert.alert(t('loadFailed'), undefined, [{ text: 'Planted button' }]);",
        "navigation.setOptions({ title: 'Planted title' }); }",
      ].join(' '));
    const dirty = scan.writeScratchTree({ [file]: planted });
    try {
      expect(kindsAndTexts(scan.checkTree(dirty, []).unexpected)).toEqual([
        ['call:alert:text', 'Planted button'], ['call:setOptions:title', 'Planted title'], ['jsx-expression', 'Planted const'],
      ]);
    } finally {
      scan.removeTree(dirty);
    }
  });

  it('only removes scratch trees it created', () => {
    expect(() => scan.removeTree(scan.appRoot)).toThrow('Refusing to remove');
  });
});

// Review finding M4 (27 Oct): the baseline may only lose entries of the pinned original 13. UNRUN.
describe('the shrink-only baseline', () => {
  it('holds only entries from the pinned original 13, for known owners, outside migrated screens', () => {
    expect(ORIGINAL_BASELINE).toHaveLength(13);
    expect(scan.baselineProblems(scan.readBaseline(), BASELINE_POLICY)).toEqual([]);
  });

  it('accepts the original and any shrink of it', () => {
    expect(problemsFor(ORIGINAL_BASELINE)).toEqual([]);
    expect(problemsFor(ORIGINAL_BASELINE.filter((entry) => entry.owner !== 'SC-4'))).toEqual([]);
    expect(problemsFor(without(ORIGINAL_BASELINE, ORIGINAL_BASELINE.findIndex((entry) => entry.text === '× {} kg')))).toEqual([]);
    expect(problemsFor([])).toEqual([]);
  });

  it('rejects a new entry swapped in for a removed one, even at the same count', () => {
    const removed = ORIGINAL_BASELINE.filter((entry) => entry.file !== 'src/features/food/FoodScreen.tsx');
    const substituted = [
      ...removed,
      { file: 'src/features/gym/GymPlansScreen.tsx', kind: 'jsx-text', text: 'Plans', owner: 'G17.app' },
      { file: 'src/features/training/PlatesScreen.tsx', kind: 'jsx-text', text: 'Plates', owner: 'SC-1' },
      { file: 'src/features/food/FoodScreen.tsx', kind: 'jsx-text', text: 'kcal', owner: 'SC-4' },
    ];
    expect(substituted).toHaveLength(ORIGINAL_BASELINE.length);
    expect(problemsFor(substituted)).toEqual([
      expect.stringMatching(/GymPlansScreen\.tsx jsx-text "Plans".*not in the original baseline/),
      expect.stringMatching(/PlatesScreen\.tsx jsx-text "Plates".*migrated to the catalog/),
      expect.stringMatching(/PlatesScreen\.tsx jsx-text "Plates".*not in the original baseline/),
      expect.stringMatching(/FoodScreen\.tsx jsx-text "kcal".*not in the original baseline/),
    ]);
  });

  it('rejects a kind swap, in the baseline and when matching findings', () => {
    const swapped = ORIGINAL_BASELINE.map((entry) => (entry.text === 'English' ? { ...entry, kind: 'jsx-text' } : entry));
    expect(problemsFor(swapped)).toEqual([expect.stringMatching(/ProfileScreen\.tsx jsx-text "English".*not in the original baseline/)]);
    const finding: Finding = { file: 'src/features/food/FoodScreen.tsx', line: 1, column: 1, kind: 'jsx-text', text: '{} kcal' };
    const entry: BaselineEntry = { file: finding.file, kind: 'jsx-expression', text: '{} kcal', owner: 'SC-4' };
    expect(scan.compareWithBaseline([finding], [entry])).toEqual({ unexpected: [finding], stale: [entry] });
  });

  it('rejects duplicate growth, including a duplicate swapped in for a removed entry', () => {
    const hindi = originalWithText('हिन्दी');
    expect(problemsFor([...ORIGINAL_BASELINE, hindi])).toEqual([expect.stringMatching(/ProfileScreen\.tsx prop:label "हिन्दी".*not in the original baseline/)]);
    const sameCount = [...without(ORIGINAL_BASELINE, ORIGINAL_BASELINE.findIndex((entry) => entry.text === 'English')), hindi];
    expect(sameCount).toHaveLength(ORIGINAL_BASELINE.length);
    expect(problemsFor(sameCount)).toEqual([expect.stringMatching(/"हिन्दी".*not in the original baseline/)]);
    expect(problemsFor([...ORIGINAL_BASELINE, originalWithText('× {} kg')])).toEqual([expect.stringMatching(/"× \{\} kg".*not in the original baseline/)]);
    const finding: Finding = { file: 'src/features/food/FoodScreen.tsx', line: 1, column: 1, kind: 'jsx-text', text: 'g' };
    const food = ORIGINAL_BASELINE.filter((entry) => entry.file === finding.file);
    expect(scan.compareWithBaseline([finding, { ...finding, column: 9 }], food).unexpected).toEqual([{ ...finding, column: 9 }]);
  });

  it('rejects an unknown owner, G14.app as owner and a changed owner', () => {
    const plans = originalWithText('· v');
    expect(problemsFor([{ ...plans, owner: 'G14.app' }])).toEqual([
      expect.stringMatching(/G14\.app may not own a baseline entry/), expect.stringMatching(/not in the original baseline/),
    ]);
    expect(problemsFor([{ ...plans, owner: 'SC-9' }])).toEqual([
      expect.stringMatching(/unknown owner SC-9/), expect.stringMatching(/not in the original baseline/),
    ]);
    expect(problemsFor([{ ...plans, owner: 'SC-1' }])).toEqual([expect.stringMatching(/\(SC-1\): not in the original baseline/)]);
  });

  it('rejects an entry in any screen G14.app migrated, whoever owns it', () => {
    const migrated = [
      'src/features/training/PlatesScreen.tsx', 'src/features/training/EditSetScreen.tsx', 'src/features/training/ProgrammeScreen.tsx',
      'src/features/training/HistoryScreen.tsx', 'src/features/training/ScheduleScreen.tsx', 'src/features/today/TodayScreen.tsx',
      'src/features/progress/ProgressScreen.tsx', 'src/features/progress/NewGoalScreen.tsx', 'src/lib/i18n/format.ts',
    ];
    const problems = problemsFor(migrated.map((file) => ({ file, kind: 'jsx-text', text: 'Planted', owner: 'SC-1' })));
    const migratedProblems = problems.filter((problem) => problem.includes('migrated to the catalog'));
    expect(migratedProblems).toHaveLength(migrated.length);
    migrated.forEach((file, index) => expect(migratedProblems[index]).toContain(`Baseline entry ${index + 1} ${file} `));
  });

  it('rejects a malformed entry or entries list', () => {
    const sample: BaselineEntry = { file: 'src/features/food/FoodScreen.tsx', kind: 'jsx-text', text: 'g', owner: 'SC-4' };
    expect(scan.baselineProblems({ entries: [sample] }, BASELINE_POLICY)).toEqual([expect.stringMatching(/not an array/)]);
    const cases: readonly [unknown, readonly RegExp[]][] = [
      [null, [/is not an object/]],
      [{ ...sample, line: 3 }, [/exactly the fields file, kind, text, owner/]],
      [{ file: sample.file, kind: sample.kind, text: sample.text }, [/exactly the fields/, /non-empty text in owner/]],
      [{ ...sample, text: '' }, [/non-empty text in text/]],
      [{ ...sample, kind: 'jsx' }, [/unknown kind jsx$/]],
      [{ ...sample, file: 'app/FoodScreen.tsx' }, [/path under src\//]],
      [{ ...sample, text: ' g ' }, [/normalised and contain a letter/]],
      [{ ...sample, text: '—' }, [/normalised and contain a letter/]],
    ];
    for (const [entry, expected] of cases) {
      expect(problemsFor([entry])).toEqual(expected.map((pattern) => expect.stringMatching(pattern)));
    }
  });
});
