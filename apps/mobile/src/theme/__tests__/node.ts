/**
 * Node built-ins for the theme tests. The app's tsconfig leaves Node's types out (it targets React
 * Native), so only the calls these tests make are typed here, in one place.
 */
interface NodeFs {
  readFileSync(file: string): Uint8Array;
  readFileSync(file: string, encoding: 'utf8'): string;
  readdirSync(dir: string): string[];
}

interface NodePath {
  join(...parts: string[]): string;
  dirname(file: string): string;
  resolve(...parts: string[]): string;
}

declare const __dirname: string;
const nodeRequire = require as unknown as ((id: string) => unknown) & { resolve(id: string): string };

export const fs = nodeRequire('node:fs') as NodeFs;
export const path = nodeRequire('node:path') as NodePath;
/** Resolves a package entry to its file on disk, the way the app's bundler would. */
export const resolveModule = (id: string): string => nodeRequire.resolve(id);
/** `apps/mobile/`: asset and source paths in these tests are relative to it. */
export const appRoot = path.resolve(__dirname, '../../..');
