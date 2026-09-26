/**
 * The text field look A-03 and A-04 use, for the account screens that follow
 * them. The border turns critical on an error, and the error's words sit under
 * the field (`Field`), so the colour is never the only signal.
 */
import type { TextStyle } from 'react-native';
import { font, radius, useTheme } from '@/theme';

export function useInputStyle(): (error?: string | null) => TextStyle {
  const { c } = useTheme();
  return (error) => ({
    minHeight: 50,
    borderRadius: radius.btn,
    backgroundColor: c.sunken,
    borderWidth: 1,
    borderColor: error ? c.crit : c.line,
    paddingHorizontal: 14,
    color: c.ink,
    fontFamily: font.ui,
    fontSize: 15.5,
  });
}
