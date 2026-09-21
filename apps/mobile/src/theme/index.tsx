import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { palette, type Colors, type Scheme } from './tokens';

export * from './tokens';

const ThemeCtx = createContext<{ c: Colors; scheme: Scheme }>({
  c: palette.dark,
  scheme: 'dark',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Dark is primary: an unset system preference resolves to dark, not light.
  const system = useColorScheme();
  const scheme: Scheme = system === 'light' ? 'light' : 'dark';
  const value = useMemo(() => ({ c: palette[scheme], scheme }), [scheme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
