import { SvgXml } from 'react-native-svg';
import type { ColorValue } from 'react-native';
import { useTheme } from '@/theme';
import { momentumAssets } from './momentum-assets';

export function MomentumAsset({ name, size, tint }: { name: keyof typeof momentumAssets; size?: number; tint?: ColorValue }) {
  const { theme } = useTheme(); const variant = `${name}Light`;
  const key = theme.scheme === 'light' && variant in momentumAssets ? variant as keyof typeof momentumAssets : name;
  const xml = tint ? momentumAssets[key].replace(/fill="#[^"]+"/g, 'fill="currentColor"') : momentumAssets[key];
  return <SvgXml xml={xml} color={tint ?? theme.colors.onSurface} width={size ?? theme.dimensions.icon} height={size ?? theme.dimensions.icon} />;
}
