/**
 * An icon in a bordered square — the leading glyph of a row, a card header,
 * an empty state. Purely visual: it carries no name of its own, the row does.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { radius, useTheme } from '@/theme';
import { textColor, type TextTone } from './textTone';
import { withAlpha } from './index';

export type IconTileBg = 'surface2' | 'sunken' | 'accent' | 'accentWash' | 'transparent';

export interface IconTileProps {
  icon: string;
  size?: number;
  tone?: TextTone;
  bg?: IconTileBg;
  testID?: string;
}

export function IconTile({ icon, size = 40, tone = 'ink2', bg = 'surface2', testID }: IconTileProps) {
  const { c } = useTheme();
  const fill = bg === 'transparent' ? 'transparent' : c[bg];
  const border = bg === 'accent' ? withAlpha(c.accent, 0.5) : bg === 'accentWash' ? withAlpha(c.accent, 0.3) : c.line;
  return (
    <View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size, height: size, borderRadius: size >= 44 ? radius.btn : radius.row,
        backgroundColor: fill, borderWidth: bg === 'transparent' ? 0 : 1, borderColor: border,
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name={icon as never} size={Math.round(size * 0.5)} color={bg === 'accent' ? c.accentInk : textColor(c, tone)} />
    </View>
  );
}
