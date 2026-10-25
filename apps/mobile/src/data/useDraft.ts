import { useEffect, useState } from 'react';
import { useMember } from './MemberProvider';

/** Unsaved forms are drafts only; they never enter diary/analytics totals. */
export function useDraft<T extends object>(key: string, defaults: T, parse?: (raw: unknown) => T) {
  const { store, drafts } = useMember(); const [editing, setEditing] = useState(true);
  const [value, setValue] = useState<T>(() => {
    const raw = drafts[key];
    if (!raw || typeof raw !== 'object') return defaults;
    if (parse) { try { return parse(raw); } catch { return defaults; } }
    return Object.fromEntries(Object.entries(defaults).map(([field, fallback]) => [field, typeof (raw as Record<string, unknown>)[field] === 'string' ? (raw as Record<string, string>)[field] : fallback])) as T;
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    if (!editing) return;
    const timer = setTimeout(() => { void store.saveDraft(key, value).catch(() => setStorageError(true)); }, 300);
    return () => clearTimeout(timer);
  }, [value, key, store, editing]);
  const clear = async () => { setEditing(false); await store.saveDraft(key, null); };
  return { value, setValue, clear, resume: () => setEditing(true), storageError };
}
