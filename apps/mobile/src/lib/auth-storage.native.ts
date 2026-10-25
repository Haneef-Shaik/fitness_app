import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

// Large auth sessions are split into small keychain entries; metadata is committed last.
export const authStorage = {
  async getItem(key: string) {
    const metadata = await SecureStore.getItemAsync(key);
    if (!metadata) return null;
    const { prefix, count } = JSON.parse(metadata) as { prefix: string; count: number };
    if (!Number.isInteger(count) || count < 1 || count > 128 || !/^[a-f0-9-]+$/.test(prefix)) return null;
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${prefix}.${i}`)));
    return parts.some((p) => p === null) ? null : parts.join('');
  },
  async setItem(key: string, value: string) {
    const old = await SecureStore.getItemAsync(key);
    const prefix = Crypto.randomUUID(); const count = Math.max(1, Math.ceil(value.length / 1500));
    if (count > 128) throw new Error('Session is too large');
    for (let i = 0; i < count; i++) await SecureStore.setItemAsync(`${key}.${prefix}.${i}`, value.slice(i * 1500, (i + 1) * 1500));
    await SecureStore.setItemAsync(key, JSON.stringify({ prefix, count }));
    if (old) {
      const prior = JSON.parse(old) as { prefix: string; count: number };
      await Promise.all(Array.from({ length: prior.count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${prior.prefix}.${i}`)));
    }
  },
  async removeItem(key: string) {
    const old = await SecureStore.getItemAsync(key); await SecureStore.deleteItemAsync(key);
    if (old) { const prior = JSON.parse(old) as { prefix: string; count: number }; await Promise.all(Array.from({ length: prior.count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${prior.prefix}.${i}`))); }
  },
};
