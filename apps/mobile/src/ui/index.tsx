/**
 * FitLog UI primitives — Text, Card, Button, Pill, Meter, Stat.
 *
 * The visual rules live in docs/19-UIUX-GYMS-COACH-OS.md: graphite tonal
 * layering, a lime action colour and Hanken Grotesk used as one legible family.
 */
import React from 'react';
import {
  AccessibilityInfo, ActivityIndicator, Pressable, Text as RNText, View,
  type PressableProps, type TextProps, type ViewProps, type TextStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, font, type, space, radius, target } from '@/theme';
import { FocusRing, useFocusRing } from './focusRing';
import { textColor, type TextTone } from './textTone';

/* ---------------- Text ---------------- */
export type TextVariant =
  | 'record' | 'hero' | 'entry' | 'display' | 'stat'
  | 'h1' | 'h2' | 'title' | 'body' | 'caption' | 'label';

export type TextWeight = 'regular' | 'medium' | 'semi' | 'bold';

const NUMERIC: readonly TextVariant[] = ['record', 'hero', 'entry', 'display', 'stat'];
const HEADLINE: readonly TextVariant[] = ['h1', 'h2'];
const WEIGHTS: Record<TextWeight, string> = {
  regular: font.ui, medium: font.uiMedium, semi: font.uiSemi, bold: font.uiBold,
};

function familyFor(variant: TextVariant, weight?: TextWeight): string {
  if (NUMERIC.includes(variant)) return font.data;
  if (HEADLINE.includes(variant)) return font.display;
  if (variant === 'title') return font.displaySemi;
  if (variant === 'label') return font.uiSemi;
  return WEIGHTS[weight ?? 'regular'];
}

export function Text({
  variant = 'body', tone = 'ink', weight, style, ...rest
}: TextProps & { variant?: TextVariant; tone?: TextTone; weight?: TextWeight }) {
  const { c } = useTheme();
  const base: TextStyle = {
    color: textColor(c, tone),
    fontSize: type[variant],
    fontFamily: familyFor(variant, weight),
  };
  if (NUMERIC.includes(variant)) { base.letterSpacing = -0.5; base.lineHeight = Math.round(type[variant] * 1.08); }
  if (HEADLINE.includes(variant)) base.letterSpacing = -0.3;
  if (variant === 'label') {
    base.letterSpacing = 0.35;
    base.color = tone === 'ink' ? c.ink3 : textColor(c, tone);
  }
  return <RNText {...rest} style={[base, style]} />;
}

/* ---------------- Card ---------------- */
export interface CardProps extends ViewProps {
  /** An uppercase eyebrow inside the card — "TODAY'S WORKOUT". */
  label?: string;
  labelTone?: TextTone;
  /** Whatever sits opposite the label: a date, a pill, an icon button. */
  right?: React.ReactNode;
  hero?: boolean;
  accent?: boolean;
  /** A panel inside a card: the next tone up, no shadow. */
  nested?: boolean;
  pad?: 'none' | 'sm' | 'md' | 'lg';
}

const PAD = { none: 0, sm: space.md, md: space.base, lg: space.lg } as const;

export function Card({
  label, labelTone, right, hero, accent, nested, pad, style, children, ...rest
}: CardProps) {
  const { c } = useTheme();
  const padding = PAD[pad ?? (hero ? 'lg' : 'md')];
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: nested ? c.surface2 : c.surface,
          borderWidth: 1,
          borderColor: accent ? withAlpha(c.accent, 0.68) : c.line,
          borderRadius: nested ? radius.row : hero ? radius.lg : radius.card,
          padding,
          overflow: 'hidden',
        },
        hero && { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
        style,
      ]}
    >
      {label || right ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: label ? space.sm : 0 }}>
          {label ? (
            <Text variant="label" tone={labelTone} accessibilityRole="header" style={{ flex: 1 }} numberOfLines={1}>
              {label}
            </Text>
          ) : <View style={{ flex: 1 }} />}
          {right}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** A panel inside a card — the next tone up. */
export function Well({ style, children, ...rest }: ViewProps) {
  const { c } = useTheme();
  return (
    <View {...rest} style={[{ backgroundColor: c.surface2, borderWidth: 1, borderColor: c.line, borderRadius: radius.row, padding: space.md }, style]}>
      {children}
    </View>
  );
}

/* ---------------- Button ---------------- */
export type ButtonKind = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const HEIGHT: Record<ButtonSize, number> = { sm: target.min, md: 52, lg: target.logger };
const LABEL_SIZE: Record<ButtonSize, number> = { sm: 14.5, md: 16, lg: 17 };
const ICON_SIZE: Record<ButtonSize, number> = { sm: 18, md: 20, lg: 22 };

export interface ButtonProps extends PressableProps {
  title: string;
  kind?: ButtonKind;
  size?: ButtonSize;
  /** An Ionicons name drawn before the label. */
  icon?: string;
  loading?: boolean;
}

export function Button({
  title, kind = 'primary', size = 'md', icon, loading, disabled, style, ...rest
}: ButtonProps) {
  const { c } = useTheme();
  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);
  const own = React.useRef<View | null>(null);
  const focused = useFocusRing(own);
  const isPrimary = kind === 'primary';
  const bg = isPrimary ? c.accent : kind === 'secondary' ? c.surface2 : 'transparent';
  const fg = isPrimary ? c.accentInk : kind === 'danger' ? c.critInk : kind === 'secondary' ? c.ink : c.ink2;
  const iconColor = isPrimary ? c.accentInk : kind === 'danger' ? c.critInk : c.accent;
  const border = kind === 'secondary' ? c.line2 : kind === 'ghost' ? c.line : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      // The child text already names this for a screen reader; stating it
      // explicitly means the name survives a loading spinner replacing the label.
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      {...rest}
      ref={own}
      style={({ pressed }) => [
        {
          minHeight: HEIGHT[size],
          paddingHorizontal: size === 'sm' ? 14 : space.lg,
          borderRadius: radius.btn,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: space.sm,
          backgroundColor: bg,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: border,
          opacity: disabled ? 0.45 : 1,
          // press feedback is scale + opacity only — never a layout shift
          transform: [{ scale: pressed && !reduceMotion ? 0.98 : 1 }],
        },
        isPrimary && {
          shadowColor: c.accent, shadowOpacity: 0.3, shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 }, elevation: 3,
        },
        typeof style === 'function' ? style({ pressed } as never) : style,
      ]}
    >
      {focused ? <FocusRing radius={radius.btn} /> : null}
      {loading ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Ionicons name={icon as never} size={ICON_SIZE[size]} color={iconColor} /> : null}
          <RNText style={{ color: fg, fontFamily: font.uiSemi, fontSize: LABEL_SIZE[size] }}>
            {title}
          </RNText>
        </>
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
      {/* Hidden from the reader: the field inside carries the same name as its
          hint (ui/TextInput), and reading both says it twice (a11y #1). */}
      <Text
        variant="caption"
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={{ color: c.ink3, fontFamily: font.uiSemi, marginBottom: 6 }}
      >
        {label}
      </Text>
      {children}
      {error ? <Text variant="caption" tone="crit" style={{ marginTop: 5 }}>{error}</Text> : null}
      {!error && helper ? <Text variant="caption" tone="ink3" style={{ marginTop: 5 }}>{helper}</Text> : null}
    </View>
  );
}

/* ---------------- Pill / Meter / Stat ---------------- */
export type PillKind = 'mute' | 'accent' | 'good' | 'warn' | 'serious';

export function Pill({ children, kind = 'mute', icon }: { children: React.ReactNode; kind?: PillKind; icon?: string }) {
  const { c } = useTheme();
  const map = {
    mute: { bg: c.surface2, fg: c.ink2, bd: c.line },
    accent: { bg: c.accentWash, fg: c.accent, bd: withAlpha(c.accent, 0.4) },
    good: { bg: withAlpha(c.good, 0.14), fg: c.goodInk, bd: withAlpha(c.good, 0.35) },
    warn: { bg: withAlpha(c.warn, 0.14), fg: c.warnInk, bd: withAlpha(c.warn, 0.35) },
    serious: { bg: withAlpha(c.serious, 0.14), fg: c.seriousInk, bd: withAlpha(c.serious, 0.35) },
  }[kind];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: map.bg, borderColor: map.bd, borderWidth: 1, borderRadius: radius.tag, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      {icon ? <Ionicons name={icon as never} size={12} color={map.fg} /> : null}
      <RNText style={{ color: map.fg, fontSize: 11, fontFamily: font.uiSemi, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {children}
      </RNText>
    </View>
  );
}

export function Meter({ value, max = 1, over, height = 8 }: { value: number; max?: number; over?: boolean; height?: number }) {
  const { c } = useTheme();
  const pct = Math.max(0, Math.min(1, max === 0 ? 0 : value / max));
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: c.surface2, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height: '100%', borderRadius: radius.pill, backgroundColor: over ? c.serious : c.accent }} />
    </View>
  );
}

/**
 * A figure over its name. One screen-reader stop, name first: TalkBack read
 * "15:50" and then "Duration" as two (G10). `spoken` is for a figure that
 * reads badly aloud — a clock time says "fifteen fifty", not a duration.
 */
export function Stat({ value, label, spoken }: { value: string; label: string; spoken?: string }) {
  const { c } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}, ${spoken ?? value}`}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: c.surface }}
    >
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
