import Svg, { Circle } from 'react-native-svg';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { AppText } from './AppText';

export function ProgressRing({ value, target, label, incomplete = false }: { value: number; target: number | null; label: string; incomplete?: boolean }) {
  const { theme } = useTheme(); const size = theme.dimensions.ring; const stroke = theme.dimensions.ringStroke;
  const radius = (size - stroke) / 2; const circumference = 2 * Math.PI * radius;
  const proportion = target && !incomplete ? Math.max(0, Math.min(1, value / target)) : 0;
  return <View accessibilityLabel={`${label}: ${value}${target ? ` / ${target}` : ''}`} style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.colors.surfaceHighest} strokeWidth={stroke} />
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={theme.colors.dataFuel} strokeWidth={stroke} strokeDasharray={`${circumference * proportion} ${circumference}`} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
    <AppText variant="title">{Math.round(value)}</AppText><AppText variant="caption" tone="muted">{label}</AppText>
  </View>;
}
