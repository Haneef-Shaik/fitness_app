import { SvgXml } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { useTheme } from '@/theme';
import { momentumAssetRoles, momentumAssets } from './momentum-assets';

/**
 * A bundled Momentum asset. Every asset paints its shape in `currentColor`, and this component supplies
 * the colour: the caller's `tint` when given, otherwise the asset's semantic role (momentumAssetRoles)
 * from the current theme. The XML is passed through unchanged; nothing is rewritten at render.
 */
export function MomentumAsset({ name, size, tint }: { name: keyof typeof momentumAssets; size?: number; tint?: ColorValue }) {
  const { theme } = useTheme();
  const side = size ?? theme.dimensions.icon;
  return <SvgXml xml={momentumAssets[name]} color={tint ?? theme.colors[momentumAssetRoles[name]]} width={side} height={side} />;
}
