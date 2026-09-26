/**
 * K-07's "Download my data" — the export becomes a file the person can reach.
 *
 * This build has no `expo-sharing`, so each platform uses what it does have:
 * iOS hands the file to React Native's share sheet, Android asks for a folder
 * through the Storage Access Framework, web downloads. Whatever happens after,
 * the file is written to the app's documents first, so a cancelled sheet still
 * leaves a copy the screen can name.
 */
import { exportFileName, removeExportCopies, saveExport, type SaveDeps } from '../saveExport';

const DOCS = 'file:///data/user/0/com.fitlog.app/files/';

function fakeFs(granted = true) {
  const writes: Record<string, string> = {};
  return {
    writes,
    fs: {
      documentDirectory: DOCS,
      EncodingType: { UTF8: 'utf8' },
      writeAsStringAsync: jest.fn(async (path: string, body: string) => { writes[path] = body; }),
      deleteAsync: jest.fn(async (path: string) => { delete writes[path]; }),
      readDirectoryAsync: jest.fn(async () => Object.keys(writes)
        .filter((p) => p.startsWith(DOCS)).map((p) => p.slice(DOCS.length))),
      StorageAccessFramework: {
        requestDirectoryPermissionsAsync: jest.fn(async () => (
          granted ? { granted: true, directoryUri: 'content://downloads' } : { granted: false }
        )),
        createFileAsync: jest.fn(async (dir: string, name: string) => `${dir}/${name}.json`),
      },
    },
  };
}

function deps(over: Partial<SaveDeps> = {}, granted = true) {
  const f = fakeFs(granted);
  const d: SaveDeps = {
    os: 'ios',
    fs: () => f.fs as never,
    share: jest.fn(async () => ({ action: 'sharedAction' })),
    download: jest.fn(),
    now: () => new Date(2026, 8, 26, 21, 30),
    ...over,
  };
  return { d, writes: f.writes, fs: f.fs };
}

const ARCHIVE = { format: 'fitlog.export.v1', sessions: [{ notes: 'Leg day' }] };

it('names the file by the local date it was taken', () => {
  expect(exportFileName(new Date(2026, 8, 26, 23, 59))).toBe('fitlog-export-2026-09-26.json');
});

describe('on iOS', () => {
  it('writes the archive, then offers it to the share sheet as a file', async () => {
    const { d, fs } = deps();
    const out = await saveExport(ARCHIVE, d);

    const path = `${DOCS}fitlog-export-2026-09-26.json`;
    const [writtenTo, body] = fs.writeAsStringAsync.mock.calls[0]!;
    expect(writtenTo).toBe(path);
    expect(JSON.parse(body)).toEqual(ARCHIVE);
    expect(d.share).toHaveBeenCalledWith({ url: path, title: 'fitlog-export-2026-09-26.json' });
    expect(out).toEqual({ kind: 'shared', fileName: 'fitlog-export-2026-09-26.json' });
  });

  it('says the copy is kept when the sheet is dismissed', async () => {
    const { d } = deps({ share: jest.fn(async () => ({ action: 'dismissedAction' })) });
    const out = await saveExport(ARCHIVE, d);
    expect(out).toEqual({
      kind: 'kept', fileName: 'fitlog-export-2026-09-26.json',
      path: `${DOCS}fitlog-export-2026-09-26.json`,
    });
  });
});

describe('on Android', () => {
  it('writes into the folder the person picks', async () => {
    const { d, writes, fs } = deps({ os: 'android' });
    const out = await saveExport(ARCHIVE, d);

    expect(fs.StorageAccessFramework.createFileAsync)
      .toHaveBeenCalledWith('content://downloads', 'fitlog-export-2026-09-26', 'application/json');
    expect(JSON.parse(writes['content://downloads/fitlog-export-2026-09-26.json']!)).toEqual(ARCHIVE);
    expect(d.share).not.toHaveBeenCalled();
    expect(out).toEqual({ kind: 'saved', fileName: 'fitlog-export-2026-09-26.json' });
  });

  it('keeps the copy in the app when no folder is chosen', async () => {
    const { d, writes } = deps({ os: 'android' }, false);
    const out = await saveExport(ARCHIVE, d);
    expect(out.kind).toBe('kept');
    expect(writes[`${DOCS}fitlog-export-2026-09-26.json`]).toBeDefined();
  });
});

describe('on web', () => {
  it('downloads without touching a file system it does not have', async () => {
    const fs = jest.fn();
    const { d } = deps({ os: 'web', fs });
    const out = await saveExport(ARCHIVE, d);
    expect(fs).not.toHaveBeenCalled();
    expect(d.download).toHaveBeenCalledWith('fitlog-export-2026-09-26.json', expect.any(String));
    expect(out).toEqual({ kind: 'downloaded', fileName: 'fitlog-export-2026-09-26.json' });
  });
});

describe('no copy outlives its purpose', () => {
  // A full copy of someone's data sitting in the app after they sent it
  // somewhere — or after they deleted the account it came from — is one more
  // place it lives that they were not told about.
  it('removes the in-app copy once the share sheet took it', async () => {
    const { d, writes } = deps();
    await saveExport(ARCHIVE, d);
    expect(writes[`${DOCS}fitlog-export-2026-09-26.json`]).toBeUndefined();
  });

  it('removes the in-app copy once it is in the chosen folder', async () => {
    const { d, writes } = deps({ os: 'android' });
    await saveExport(ARCHIVE, d);
    expect(writes[`${DOCS}fitlog-export-2026-09-26.json`]).toBeUndefined();
    expect(writes['content://downloads/fitlog-export-2026-09-26.json']).toBeDefined();
  });

  it('keeps it when it is the only copy', async () => {
    const { d, writes } = deps({ share: jest.fn(async () => ({ action: 'dismissedAction' })) });
    await saveExport(ARCHIVE, d);
    expect(writes[`${DOCS}fitlog-export-2026-09-26.json`]).toBeDefined();
  });

  it('sweeps every export copy, and nothing else, when asked', async () => {
    const { d, writes } = deps();
    writes[`${DOCS}fitlog-export-2026-01-01.json`] = '{}';
    writes[`${DOCS}fitlog-export-2026-09-26.json`] = '{}';
    writes[`${DOCS}fitlog-prefs.json`] = '{}';

    expect(await removeExportCopies(d)).toBe(2);
    expect(Object.keys(writes)).toEqual([`${DOCS}fitlog-prefs.json`]);
  });

  it('has nothing to sweep on web', async () => {
    const fs = jest.fn();
    expect(await removeExportCopies({ ...deps().d, os: 'web', fs })).toBe(0);
    expect(fs).not.toHaveBeenCalled();
  });
});

it('fails loudly when the file cannot be written, rather than claiming success', async () => {
  const { d, fs } = deps();
  fs.writeAsStringAsync.mockRejectedValueOnce(new Error('disk full'));
  await expect(saveExport(ARCHIVE, d)).rejects.toThrow('disk full');
  expect(d.share).not.toHaveBeenCalled();
});
