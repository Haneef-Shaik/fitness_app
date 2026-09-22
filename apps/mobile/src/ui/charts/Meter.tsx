/**
 * Meter — one ratio against a limit (05 §3.4): adherence (G-06), calories (B-01).
 *
 * `null` is not 0. "No plan yet" and "you adhered to none of your plan" are
 * different statements, and a meter drawn at 0% makes the first read as the
 * second.
 */
import { View } from 'react-native';
import { Text } from '../index';
import { radius, space, useTheme } from '../../theme';

export interface MeterProps {
  /** 0..1, or null when the ratio is undefined. */
  value: number | null;
  label: string;
  /** Shown instead of the track when `value` is null. */
  empty?: string;
  testID?: string;
}

const FILL = { dark: '#3987E5', light: '#2A78D6' } as const;

export function Meter({ value, label, empty = 'Not enough to measure', testID }: MeterProps) {
  const { c, scheme } = useTheme();

  return (
    <View testID={testID}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
        <Text variant="label" style={{ flex: 1 }}>{label}</Text>
        {value !== null ? (
          <Text variant="stat">{Math.round(value * 100)}%</Text>
        ) : null}
      </View>

      {value === null ? (
        <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>{empty}</Text>
      ) : (
        <View
          accessibilityLabel={`${label}, ${Math.round(value * 100)} percent`}
          style={{
            height: 10, borderRadius: radius.pill, backgroundColor: c.sunken,
            marginTop: space.sm, overflow: 'hidden',
          }}
        >
          <View
            testID="meter-fill"
            style={{
              // Clamped: adherence is capped at 1.0 upstream, but a meter that
              // can overrun its track is a rendering bug waiting for the one
              // caller that does not clamp.
              width: `${Math.min(100, Math.max(0, value * 100))}%`,
              height: '100%',
              backgroundColor: FILL[scheme],
              borderRadius: radius.pill,
            }}
          />
        </View>
      )}
    </View>
  );
}
