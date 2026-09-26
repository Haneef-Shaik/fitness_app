/**
 * Line with emphasis — e1RM / load progression (G-03, G-07), per 05 §3.4.
 *
 * The selected exercise is drawn in the brand accent, a comparison in muted
 * gray. One axis, never two (§3.4's flat prohibition): a second scale invites
 * reading a crossing as a relationship that is an artefact of the scaling.
 *
 * Uses `react-native-svg`, which is in Expo Go's bundled module set for SDK 52
 * (15.8.0) — checked the same way D14 checked expo-sqlite, so it needs no
 * development build and DR4 is unaffected.
 */
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../index';
import { space, useTheme } from '../../theme';
import { lineDomain } from './lineDomain';

export interface LinePoint {
  label: string;
  value: number;
}

export interface LineProps {
  data: readonly LinePoint[];
  height?: number;
  /** Drawn behind, in muted gray — never a second axis. */
  comparison?: readonly LinePoint[];
  format?: (v: number) => string;
  testID?: string;
}

export function Line({ data, height = 150, comparison, format, testID }: LineProps) {
  const { c } = useTheme();
  const show = format ?? ((v: number) => Math.round(v).toLocaleString('en-US'));

  // Fitted to the data, not from zero: a line shows change by position.
  const { min, max } = lineDomain([...data, ...(comparison ?? [])].map((p) => p.value));
  const span = max - min;

  const W = 320;
  const H = height - 28;
  const pad = 6;

  const path = (points: readonly LinePoint[]): string =>
    points
      .map((p, i) => {
        const x = points.length === 1 ? W / 2 : pad + (i / (points.length - 1)) * (W - pad * 2);
        const y = H - pad - ((p.value - min) / span) * (H - pad * 2);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const lastX = data.length === 1 ? W / 2 : W - pad;
  const last = data[data.length - 1];
  const lastY = last ? H - pad - ((last.value - min) / span) * (H - pad * 2) : 0;

  return (
    <View testID={testID}>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Horizontal hairlines only. No vertical grid, no border (§3.5). */}
        {[0, 0.5, 1].map((t) => (
          <Path
            key={t}
            d={`M0,${(H * t).toFixed(1)} L${W},${(H * t).toFixed(1)}`}
            stroke={c.line}
            strokeWidth={1}
          />
        ))}
        {comparison && comparison.length > 0 ? (
          <Path d={path(comparison)} stroke={c.ink3} strokeWidth={2} fill="none" />
        ) : null}
        {data.length > 0 ? (
          <Path
            d={path(data)}
            stroke={c.accent}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {/* Only the last point is marked at rest — selective, per §3.5. */}
        {last ? <Circle cx={lastX} cy={lastY} r={4} fill={c.accent} /> : null}
      </Svg>

      <View style={{ flexDirection: 'row', marginTop: space.sm }}>
        <Text variant="caption" tone="ink3" style={{ flex: 1 }}>
          {data[0]?.label ?? ''}
        </Text>
        {last ? (
          <Text variant="caption" tone="ink2">{`${last.label} · ${show(last.value)}`}</Text>
        ) : null}
      </View>
    </View>
  );
}
