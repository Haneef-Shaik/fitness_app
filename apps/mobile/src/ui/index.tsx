/**
 * Volt UI primitives. Ported from docs/design/volt.css.
 *
 * The depth recipe matters: a card is a tinted gradient + a 1px inner top highlight
 * + a real shadow. Flat fills read as a wireframe, which is what the first design pass
 * got wrong (see docs/design/README.md).
 */
import React from 'react';
import {
  ActivityIndicator, Pressable, StyleSheet, Text as RNText, View,
  type PressableProps, type TextProps, type ViewProps, type TextStyle, type ViewStyle,
} from 'react-native';
import { useTheme, font, type, space, radius, target } from '@/theme';

/* ---------------- Text ---------------- */
type Variant =
  | 'record' | 'hero' | 'entry' | 'display' | 'stat'
  | 'h1' | 'h2' | 'title' | 'body' | 'caption' | 'label';

const NUMERIC: Variant[] = ['record', 'hero', 'entry', 'display', 'stat'];

export function Text({
  variant = 'body', tone = 'ink', style, ...rest
}: TextProps & { variant?: Variant; tone?: 'ink' | 'ink2' | 'ink3' | 'accent' | 'good' | 'crit' | 'accentInk' }) {
  const { c } = useTheme();
  const numeric = NUMERIC.includes(variant);
  const base: TextStyle = {
    color: c[tone],
    fontSize: type[variant],
    fontFamily: numeric ? font.data : variant === 'label' ? font.uiSemi : font.ui,
  };
  if (numeric) { base.letterSpacing = -0.4; base.lineHeight = type[variant] * 0.96; }
  if (variant === 'label') {
    base.letterSpacing = 1.5; base.textTransform = 'uppercase'; base.color = c.ink3;
    if (tone !== 'ink') base.color = c[tone];
  }
  if (variant === 'title' || variant === 'h1' || variant === 'h2') base.fontFamily = font.uiSemi;
  return <RNText {...rest} style={[base, style]} />;
}

/* ---------------- Card ---------------- */
export function Card({
  hero, accent, style, children, ...rest
}: ViewProps & { hero?: boolean; accent?: boolean }) {
  const { c, scheme } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: accent ? withAlpha(c.accent, 0.42) : c.line,
          borderRadius: hero ? radius.lg : radius.card,
          padding: hero ? 18 : space.base,
          overflow: 'hidden',
        },
        scheme === 'dark'
          ? { shadowColor: '#000', shadowOpacity: hero ? 0.6 : 0.4, shadowRadius: hero ? 16 : 3,
              shadowOffset: { width: 0, height: hero ? 8 : 1 }, elevation: hero ? 6 : 2 }
          : { shadowColor: '#0B0C0D', shadowOpacity: hero ? 0.12 : 0.06, shadowRadius: hero ? 14 : 3,
              shadowOffset: { width: 0, height: hero ? 6 : 1 }, elevation: hero ? 4 : 1 },
        style,
      ]}
    >
      {/* the 1px inner top highlight — the thing that makes an edge catch light */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { borderTopWidth: 1, borderTopColor: c.sheen, borderRadius: hero ? radius.lg : radius.card }]} />
      {accent ? <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: c.accentWash }]} /> : null}
      <View>{children}</View>
    </View>
  );
}

export function Well({ style, children, ...rest }: ViewProps) {
  const { c } = useTheme();
  return (
    <View {...rest} style={[{ backgroundColor: c.sunken, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 14 }, style]}>
      {children}
    </View>
  );
}

/* ---------------- Button ---------------- */
export function Button({
  title, kind = 'primary', size = 'md', loading, disabled, style, ...rest
}: PressableProps & {
  title: string;
  kind?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  loading?: boolean;
}) {
  const { c } = useTheme();
  const h = size === 'md' ? target.logger - 2 : 46;
  const isPrimary = kind === 'primary';
  const bg = isPrimary ? c.accent : kind === 'ghost' ? c.surface : 'transparent';
  const fg = isPrimary ? c.accentInk : kind === 'danger' ? c.crit : c.ink2;

  return (
    <Pressable
      accessibilityRole="button"
      // The child text already names this for a screen reader; stating it
      // explicitly means the name survives a loading spinner replacing the label.
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      {...rest}
      style={({ pressed }) => [
        {
          minHeight: h,
          borderRadius: radius.btn,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          backgroundColor: bg,
          borderWidth: kind === 'primary' ? 0 : 1,
          borderColor: kind === 'danger' ? 'transparent' : c.line,
          opacity: disabled ? 0.45 : 1,
          // press feedback is scale + opacity only — never a layout shift
          transform: [{ scale: pressed ? 0.975 : 1 }],
        },
        isPrimary && {
          shadowColor: c.accent, shadowOpacity: 0.55, shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 }, elevation: 6,
        },
        typeof style === 'function' ? style({ pressed } as never) : style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <RNText style={{ color: fg, fontFamily: font.uiSemi, fontSize: size === 'md' ? 16 : 14.5 }}>
          {title}
        </RNText>
      )}
    </Pressable>
  );
}

/* ---------------- Field ---------------- */
export function Field({
  label, error, helper, children,
}: { label: string; error?: string | null; helper?: string; children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: 14 }}>
      <Text variant="caption" style={{ color: c.ink3, fontFamily: font.uiSemi, marginBottom: 6 }}>
        {label}
      </Text>
      {children}
      {error ? <Text variant="caption" tone="crit" style={{ marginTop: 5 }}>{error}</Text> : null}
      {!error && helper ? <Text variant="caption" tone="ink3" style={{ marginTop: 5 }}>{helper}</Text> : null}
    </View>
  );
}

/* ---------------- Pill / Meter / Row ---------------- */
export function Pill({ children, kind = 'mute' }: { children: React.ReactNode; kind?: 'mute' | 'accent' | 'good' }) {
  const { c } = useTheme();
  const map = {
    mute: { bg: c.sunken, fg: c.ink3, bd: c.line },
    accent: { bg: c.accentWash, fg: c.accent, bd: withAlpha(c.accent, 0.45) },
    good: { bg: withAlpha(c.good, 0.16), fg: c.good, bd: withAlpha(c.good, 0.4) },
  }[kind];
  return (
    <View style={{ backgroundColor: map.bg, borderColor: map.bd, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <RNText style={{ color: map.fg, fontSize: 11, fontFamily: font.uiSemi, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {children}
      </RNText>
    </View>
  );
}

export function Meter({ value, max = 1, over }: { value: number; max?: number; over?: boolean }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: c.sunken, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 4, backgroundColor: over ? c.serious : c.accent }} />
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: c.surface }}>
      <Text variant="stat">{value}</Text>
      <Text variant="label" style={{ marginTop: 5 }}>{label}</Text>
    </View>
  );
}

export function StatRow({ children }: { children: React.ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 1, backgroundColor: c.line, borderRadius: radius.card, borderWidth: 1, borderColor: c.line, overflow: 'hidden' }}>
      {children}
    </View>
  );
}

export function Screen({ children, style, ...rest }: ViewProps) {
  const { c } = useTheme();
  return <View {...rest} style={[{ flex: 1, backgroundColor: c.page }, style]}>{children}</View>;
}

/* ---------------- utils ---------------- */
export function withAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgba')) return color;
  const h = color.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
