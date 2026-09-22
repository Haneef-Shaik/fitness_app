/**
 * Week dot strip — a handful of discrete states in a row (G-06, B-01).
 *
 * States are shapes as well as colours: a filled dot, a ring, a hollow slot.
 * Colour alone would put the whole signal on hue, which is the thing the
 * palette work exists to avoid.
 */
import { View } from 'react-native';
import { Text } from '../index';
import { space, useTheme } from '../../theme';

export type DotState = 'done' | 'planned' | 'none';

export interface Dot {
  key: string;
  label: string;
  state: DotState;
}

export function DotStrip({ dots, testID }: { dots: readonly Dot[]; testID?: string }) {
  const { c } = useTheme();
  return (
    <View testID={testID} style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
      {dots.map((d) => (
        <View key={d.key} style={{ alignItems: 'center', gap: 3 }}>
          <View
            testID={`dot-${d.key}`}
            accessibilityLabel={`${d.label}: ${
              d.state === 'done' ? 'completed' : d.state === 'planned' ? 'planned, not done' : 'nothing planned'
            }`}
            style={{
              width: 14, height: 14, borderRadius: 7,
              backgroundColor: d.state === 'done' ? c.good : 'transparent',
              borderWidth: d.state === 'done' ? 0 : 1.5,
              // A missed plan is NOT red — it is an outline. I11 applies to any
              // "you did less than intended" signal, not only to trend deltas.
              borderColor: d.state === 'planned' ? c.ink3 : c.line2,
              borderStyle: d.state === 'none' ? 'dashed' : 'solid',
            }}
          />
          <Text variant="caption" tone="ink3" style={{ fontSize: 9 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}
