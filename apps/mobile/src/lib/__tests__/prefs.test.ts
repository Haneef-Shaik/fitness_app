/**
 * Preferences persist to a file in the app's documents directory.
 *
 * Added with the SDK 54 upgrade: the package root of `expo-file-system` became
 * the new File API, and the calls prefs.ts makes THROW when imported from it.
 * prefs.ts swallows every error by design (a missing file means "use the
 * default"), so importing from the wrong entry point would not crash anything —
 * every preference would silently stop persisting. This fails instead.
 */
const mockFiles = new Map<string, string>();

jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(async (path: string) => ({ exists: mockFiles.has(path) })),
  readAsStringAsync: jest.fn(async (path: string) => mockFiles.get(path) ?? ''),
  writeAsStringAsync: jest.fn(async (path: string, body: string) => { mockFiles.set(path, body); }),
}));

import { getPref, setPref } from '../prefs';

beforeEach(() => mockFiles.clear());

it('round-trips a preference through the documents directory', async () => {
  await setPref('reminders', { workout: true });

  expect([...mockFiles.keys()]).toEqual(['file:///docs/fitlog-prefs.json']);
  await expect(getPref('reminders', {})).resolves.toEqual({ workout: true });
});

it('keeps the other keys when one is written', async () => {
  await setPref('a', 1);
  await setPref('b', 2);

  await expect(getPref('a', 0)).resolves.toBe(1);
  await expect(getPref('b', 0)).resolves.toBe(2);
});

it('falls back to the default when nothing is stored, or the file is corrupt', async () => {
  await expect(getPref('missing', 'fallback')).resolves.toBe('fallback');

  mockFiles.set('file:///docs/fitlog-prefs.json', '{not json');
  await expect(getPref('missing', 'fallback')).resolves.toBe('fallback');
});
