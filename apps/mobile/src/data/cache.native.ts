import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import type { LocalCache, MemberData } from './types';
import type { Operation } from '@fitlog/domain';

export async function openCache(ownerId: string): Promise<LocalCache> {
  if (!/^[a-f0-9-]{36}$/i.test(ownerId)) throw new Error('Invalid account');
  const name = `fitlog_${ownerId}.db`;
  const keyName = `fitlog.database.${ownerId}`;
  let key = await SecureStore.getItemAsync(keyName);
  if (!key) {
    key = [...Crypto.getRandomBytes(32)].map((b) => b.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(keyName, key, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  const db = await SQLite.openDatabaseAsync(name);
  await db.execAsync(`PRAGMA key = "x'${key}'";`);
  const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
  if (!cipher?.cipher_version) { await db.closeAsync(); throw new Error('Secure local storage requires a FitLog development build.'); }
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; CREATE TABLE IF NOT EXISTS member_cache (id INTEGER PRIMARY KEY CHECK(id=1), value TEXT NOT NULL);');
  return {
    async read() {
      const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM member_cache WHERE id=1');
      return row ? JSON.parse(row.value) as { data: MemberData; operations: Operation[]; drafts: Record<string, unknown> } : null;
    },
    async write(data, operations, drafts) {
      const value = JSON.stringify({ data, operations, drafts });
      await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.runAsync('INSERT INTO member_cache(id,value) VALUES(1,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value', value);
      });
    },
    close: () => db.closeAsync(),
    async clear() { await db.runAsync('DELETE FROM member_cache'); },
  };
}
