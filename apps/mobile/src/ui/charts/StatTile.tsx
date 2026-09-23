/**
 * A headline number (G-04's PR board). No colour job — the number IS the point,
 * and a coloured KPI tile spends a hue on decoration.
 */
import { View } from 'react-native';
import { Card, Text } from '../index';
import { deltaTone, formatDelta } from './delta';
import { space, useTheme } from '../../theme';

export function StatTile({
  label, value, unit, delta, deltaUnit = '', testID,
}: {
  label: string;
  value: string;
  unit?: string;
  /** Optional change since last time. Never red (I11). */
  delta?: number;
  deltaUnit?: string;
  testID?: string;
}) {
  const { c } = useTheme();
  const tone = delta === undefined ? null : deltaTone(delta);

  return (
    <Card style={{ flex: 1, minWidth: 140 }} testID={testID}>
      <Text variant="label" tone="ink3" numberOfLines={1}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
        <Text variant="stat">{value}</Text>
        {unit ? <Text variant="caption" tone="ink3">{unit}</Text> : null}
      </View>
      {tone ? (
        <Text variant="caption" style={{ color: tone === 'good' ? c.goodInk : c.ink2, marginTop: 2 }}>
          {formatDelta(delta!, deltaUnit)}
        </Text>
      ) : null}
    </Card>
  );
}
