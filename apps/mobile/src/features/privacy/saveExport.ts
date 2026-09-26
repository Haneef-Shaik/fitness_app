/**
 * K-07's "Download my data": the export, as a file the person actually gets.
 *
 * This build has no `expo-sharing`, and a new native module for one button is
 * a development-build decision (DR4), not a screen's. What is installed can
 * still do the job on every platform:
 *
 *   **iOS** — React Native's own share sheet accepts a file URL, which is Save
 *   to Files, AirDrop and Mail.
 *   **Android** — `Share` only carries text there, and a large export as an
 *   intent extra overflows the transaction and crashes. The Storage Access
 *   Framework (part of `expo-file-system`) lets the person pick a folder —
 *   Downloads, usually — and the file is written into it.
 *   **Web** — a download.
 *
 * The file is always written to the app's documents first, so a dismissed
 * sheet or a cancelled picker still leaves a copy the screen can name — and
 * removed from there once it has been handed over.
 *
 * `expo-file-system` is required lazily, as `prefs.ts` does and for G7's
 * reason: a static import puts a native module in the graph of every screen
 * that mentions this, and web has none.
 */
import { Platform, Share } from 'react-native';

type FileSystem = typeof import('expo-file-system/legacy');

export type SaveOutcome =
  /** iOS: the share sheet took it. */
  | { kind: 'shared'; fileName: string }
  /** Android: written into the folder the person chose. */
  | { kind: 'saved'; fileName: string }
  /** Sheet dismissed or no folder chosen: only the copy inside the app exists. */
  | { kind: 'kept'; fileName: string; path: string }
  /** Web. */
  | { kind: 'downloaded'; fileName: string };

export interface SaveDeps {
  os: string;
  fs: () => FileSystem;
  share: (content: { url?: string; message?: string; title?: string }) => Promise<{ action: string }>;
  download: (fileName: string, json: string) => void;
  now: () => Date;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** `fitlog-export-2026-09-26.json` — the device's own date, for a file name only. */
export function exportFileName(now: Date = new Date()): string {
  return `fitlog-export-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

function browserDownload(fileName: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  // In the document and revoked a moment later: some browsers drop a download
  // from a detached link, or one whose URL is revoked in the same tick.
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function defaults(): SaveDeps {
  return {
    os: Platform.OS,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    fs: () => require('expo-file-system/legacy') as FileSystem,
    share: (content) => Share.share(content as never),
    download: browserDownload,
    now: () => new Date(),
  };
}

export async function saveExport(data: unknown, deps: SaveDeps = defaults()): Promise<SaveOutcome> {
  const fileName = exportFileName(deps.now());
  const json = JSON.stringify(data, null, 2);

  if (deps.os === 'web') {
    deps.download(fileName, json);
    return { kind: 'downloaded', fileName };
  }

  const fs = deps.fs();
  const path = `${fs.documentDirectory ?? ''}${fileName}`;
  // Not caught: a copy that was never written must not be reported as saved.
  await fs.writeAsStringAsync(path, json, { encoding: fs.EncodingType.UTF8 });

  // Once the file is somewhere the person chose, the copy inside the app is
  // one more place their data lives that they were not told about. It stays
  // only when it is the only copy.
  const handedOver = async <T extends SaveOutcome>(outcome: T): Promise<T> => {
    // Logged, not thrown: the person has their file, and telling them the
    // download failed would be the wrong sentence.
    await fs.deleteAsync(path, { idempotent: true })
      .catch((e: unknown) => console.warn('[privacy] could not remove the in-app export copy', e));
    return outcome;
  };

  if (deps.os === 'ios') {
    const result = await deps.share({ url: path, title: fileName });
    return result.action === Share.sharedAction
      ? handedOver({ kind: 'shared', fileName })
      : { kind: 'kept', fileName, path };
  }

  const saf = fs.StorageAccessFramework;
  const permission = await saf.requestDirectoryPermissionsAsync();
  if (!permission.granted) return { kind: 'kept', fileName, path };

  // The picker adds the extension from the MIME type.
  const target = await saf.createFileAsync(
    permission.directoryUri, fileName.replace(/\.json$/, ''), 'application/json',
  );
  await fs.writeAsStringAsync(target, json, { encoding: fs.EncodingType.UTF8 });
  return handedOver({ kind: 'saved', fileName });
}

/**
 * Every export copy still inside the app, gone. Run when the account is
 * deleted: a full copy of what was just erased must not outlive it here.
 */
export async function removeExportCopies(
  deps: Pick<SaveDeps, 'os' | 'fs'> = defaults(),
): Promise<number> {
  if (deps.os === 'web') return 0;
  const fs = deps.fs();
  const dir = fs.documentDirectory;
  if (!dir) return 0;
  const copies = (await fs.readDirectoryAsync(dir)).filter((n) => /^fitlog-export-.*\.json$/.test(n));
  for (const name of copies) await fs.deleteAsync(`${dir}${name}`, { idempotent: true });
  return copies.length;
}
