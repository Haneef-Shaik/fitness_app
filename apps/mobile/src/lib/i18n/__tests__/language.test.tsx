import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { createLanguageStore, getCurrentLocale, languageStorageKey, resolveLocale, setCurrentLocale, t, useLocale } from '..';
import { LanguageProvider } from '../LanguageProvider';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}),
}));

function memoryStorage(initial: string | null = null) {
  let saved = initial;
  return {
    getItem: jest.fn(async (_key: string) => saved),
    setItem: jest.fn(async (_key: string, value: string) => { saved = value; }),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((ok, fail) => { resolve = ok; reject = fail; });
  return { promise, resolve, reject };
}

const deviceLocale = () => resolveLocale(Intl.DateTimeFormat().resolvedOptions().locale);
/** Calls t() while rendering, as screens do, so the text reflects the language at render time. */
function SaveLabel() { return <Text>{t('save')}</Text>; }

afterEach(() => setCurrentLocale(undefined));

describe('language preference stored on the device', () => {
  it('holds the app until the saved language is read, then renders in it', async () => {
    const read = deferred<string | null>();
    const storage = { getItem: jest.fn(() => read.promise), setItem: jest.fn(async () => {}) };
    render(<LanguageProvider store={createLanguageStore(storage)}><SaveLabel /></LanguageProvider>);
    expect(screen.toJSON()).toBeNull();
    await act(async () => { read.resolve('hi'); await read.promise; });
    expect(screen.getByText(t('save', 'hi'))).toBeTruthy();
    expect(getCurrentLocale()).toBe('hi');
    expect(storage.getItem).toHaveBeenCalledWith(languageStorageKey);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('follows the device language when nothing has been saved', async () => {
    const storage = memoryStorage();
    const store = createLanguageStore(storage);
    await store.hydrate();
    expect(store.getSnapshot()).toEqual({ saved: null, hydrated: true, error: null });
    expect(getCurrentLocale()).toBe(deviceLocale());
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it('ignores a stored value that is not a supported language', async () => {
    const store = createLanguageStore(memoryStorage('fr'));
    await store.hydrate();
    expect(store.getSnapshot()).toEqual({ saved: null, hydrated: true, error: null });
    expect(getCurrentLocale()).toBe(deviceLocale());
  });

  it('saves a language chosen anywhere in the app, such as on profile load', async () => {
    const storage = memoryStorage();
    const store = createLanguageStore(storage);
    const stop = store.start();
    await store.hydrate();
    setCurrentLocale('hi');
    await store.settled();
    expect(storage.setItem).toHaveBeenCalledWith(languageStorageKey, 'hi');
    expect(store.getSnapshot().saved).toBe('hi');
    stop();
    setCurrentLocale('en');
    await store.settled();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it('keeps a choice made while the old value is still being read', async () => {
    const read = deferred<string | null>();
    const storage = { getItem: jest.fn(() => read.promise), setItem: jest.fn(async () => {}) };
    const store = createLanguageStore(storage);
    const hydration = store.hydrate();
    const write = store.setLanguage('hi');
    read.resolve('en');
    await hydration;
    await write;
    expect(getCurrentLocale()).toBe('hi');
    expect(store.getSnapshot()).toEqual({ saved: 'hi', hydrated: true, error: null });
  });

  it('writes choices in order so the last one wins', async () => {
    const storage = memoryStorage();
    const store = createLanguageStore(storage);
    void store.setLanguage('hi');
    await store.setLanguage('en');
    expect(storage.setItem.mock.calls.map(([, value]) => value)).toEqual(['hi', 'en']);
    expect(await storage.getItem(languageStorageKey)).toBe('en');
    expect(getCurrentLocale()).toBe('en');
  });

  it('reports a read failure and falls back to the device language', async () => {
    const store = createLanguageStore({ getItem: jest.fn(async () => { throw new Error('disk'); }), setItem: jest.fn(async () => {}) });
    await store.hydrate();
    expect(store.getSnapshot()).toEqual({ saved: null, hydrated: true, error: 'read' });
    expect(getCurrentLocale()).toBe(deviceLocale());
  });

  it('applies a language even when saving fails, and clears the error on a later save', async () => {
    const setItem = jest.fn<Promise<void>, [string, string]>().mockRejectedValueOnce(new Error('full')).mockResolvedValue(undefined);
    const store = createLanguageStore({ getItem: jest.fn(async () => null), setItem });
    await store.setLanguage('hi');
    expect(getCurrentLocale()).toBe('hi');
    expect(store.getSnapshot().error).toBe('write');
    await store.setLanguage('hi');
    expect(store.getSnapshot()).toEqual({ saved: 'hi', hydrated: false, error: null });
  });

  it('refuses a language the catalog does not have', () => {
    const store = createLanguageStore(memoryStorage());
    expect(() => store.setLanguage('fr' as never)).toThrow('Unsupported language');
    expect(() => setCurrentLocale('fr' as never)).toThrow('Unsupported language');
  });

  it('re-renders components that read the language through useLocale', () => {
    function Probe() { return <Text>{useLocale()}</Text>; }
    setCurrentLocale('en');
    render(<Probe />);
    expect(screen.getByText('en')).toBeTruthy();
    act(() => setCurrentLocale('hi'));
    expect(screen.getByText('hi')).toBeTruthy();
  });

  it('uses the device storage by default', async () => {
    jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce('hi');
    render(<LanguageProvider><SaveLabel /></LanguageProvider>);
    expect(await screen.findByText(t('save', 'hi'))).toBeTruthy();
    expect(AsyncStorage.getItem).toHaveBeenCalledWith(languageStorageKey);
  });
});
