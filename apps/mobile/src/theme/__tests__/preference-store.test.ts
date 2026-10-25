import { createPreferenceStore, preferenceStorageKey } from '../preference-store';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function storage(value: string | null = null) {
  return { getItem: jest.fn(async () => value), setItem: jest.fn(async () => {}) };
}

describe('appearance persistence', () => {
  it('starts with system, hydrates a saved preference and notifies subscribers', async () => {
    const adapter = storage('dark');
    const store = createPreferenceStore(adapter);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);
    expect(store.getSnapshot().preference).toBe('system');
    await store.hydrate();
    expect(adapter.getItem).toHaveBeenCalledWith(preferenceStorageKey);
    expect(store.getSnapshot()).toEqual({ preference: 'dark', hydrated: true, error: null });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it.each(['garbage', 'null', '{"mode":"dark"}', ''])('ignores invalid saved data: %s', async (value) => {
    const store = createPreferenceStore(storage(value));
    await store.hydrate();
    expect(store.getSnapshot().preference).toBe('system');
    expect(store.getSnapshot().hydrated).toBe(true);
  });

  it('does not overwrite a user selection with a delayed storage read', async () => {
    const read = deferred<string | null>();
    const adapter = { ...storage(), getItem: jest.fn(() => read.promise) };
    const store = createPreferenceStore(adapter);
    const hydration = store.hydrate();
    await store.setPreference('light');
    read.resolve('dark');
    await hydration;
    expect(store.getSnapshot().preference).toBe('light');
  });

  it('serializes rapid writes so the last selection is the one restored', async () => {
    const firstWrite = deferred<void>();
    const adapter = storage();
    adapter.setItem.mockImplementationOnce(() => firstWrite.promise);
    const store = createPreferenceStore(adapter);
    await store.hydrate();
    const first = store.setPreference('dark');
    const second = store.setPreference('light');
    await Promise.resolve();
    expect(store.getSnapshot().preference).toBe('light');
    firstWrite.resolve();
    await Promise.all([first, second]);
    expect(adapter.setItem.mock.calls).toEqual([
      [preferenceStorageKey, 'dark'], [preferenceStorageKey, 'light'],
    ]);
  });

  it('recovers from storage failure without losing the in-memory selection', async () => {
    const adapter = storage();
    adapter.getItem.mockRejectedValueOnce(new Error('unavailable'));
    const store = createPreferenceStore(adapter);
    await store.hydrate();
    expect(store.getSnapshot().error).toBe('read');
    adapter.setItem.mockRejectedValueOnce(new Error('full'));
    await store.setPreference('dark');
    expect(store.getSnapshot()).toEqual({ preference: 'dark', hydrated: true, error: 'write' });
    await store.setPreference('light');
    expect(store.getSnapshot().error).toBeNull();
  });

  it('hydrates once, even when more than one consumer starts it', async () => {
    const adapter = storage('light');
    const store = createPreferenceStore(adapter);
    await Promise.all([store.hydrate(), store.hydrate()]);
    expect(adapter.getItem).toHaveBeenCalledTimes(1);
  });
});
