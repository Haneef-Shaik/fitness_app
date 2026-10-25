import type { LocalCache, MemberData } from './types';
import type { Operation } from '@fitlog/domain';

function request<T>(req: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => { req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); });
}
function complete(tx: IDBTransaction) {
  return new Promise<void>((resolve, reject) => { tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error ?? new Error('Storage transaction aborted')); });
}

export async function openCache(ownerId: string): Promise<LocalCache> {
  const req = indexedDB.open(`fitlog-member-v1-${ownerId}`, 1);
  req.onupgradeneeded = () => { req.result.createObjectStore('data'); req.result.createObjectStore('keys'); };
  const db = await request(req);
  const get = async <T,>(store: string, key: string) => request<T | undefined>(db.transaction(store).objectStore(store).get(key));
  let key = await get<CryptoKey>('keys', 'encryption');
  if (!key) {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    const tx = db.transaction('keys', 'readwrite'); const done = complete(tx); tx.objectStore('keys').put(key, 'encryption'); await done;
  }
  const encryptionKey = key;
  return {
    async read() {
      const saved = await get<{ iv: Uint8Array<ArrayBuffer>; bytes: ArrayBuffer }>('data', 'cache');
      if (!saved) return null;
      const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: saved.iv }, encryptionKey, saved.bytes);
      return JSON.parse(new TextDecoder().decode(bytes)) as { data: MemberData; operations: Operation[]; drafts: Record<string, unknown> };
    },
    async write(data, operations, drafts) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, new TextEncoder().encode(JSON.stringify({ data, operations, drafts })));
      const tx = db.transaction('data', 'readwrite'); const done = complete(tx);
      tx.objectStore('data').put({ iv, bytes }, 'cache'); await done;
    },
    async close() { db.close(); },
    async clear() { const tx = db.transaction('data', 'readwrite'); const done = complete(tx); tx.objectStore('data').clear(); await done; },
  };
}
