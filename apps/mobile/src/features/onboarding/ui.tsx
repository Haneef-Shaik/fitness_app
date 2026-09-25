/**
 * The pieces every onboarding step is built from (A-07): a frame with the
 * step counter, back and skip; option cards for single choices; and a number
 * field that states its unit.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import { TextInput } from '@/ui/TextInput';
import { font, radius, space, useTheme } from '@/theme';

export function StepFrame({
  step, of, title, subtitle, onBack, onSkip, onContinue, continueLabel = 'Continue',
  canContinue = true, busy = false, notices = [], children,
}: {
  step: number; of: number; title: string; subtitle?: string;
  onBack?: () => void; onSkip?: () => void; onContinue: () => void;
  continueLabel?: string; canContinue?: boolean; busy?: boolean;
  notices?: string[]; children: React.ReactNode;
}) {
  const { c } = useTheme();
  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, paddingTop: space.sm, minHeight: 48 }}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" hitSlop={12}
            style={{ width: 40, height: 40, justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={26} color={c.ink2} />
          </Pressable>
        ) : <View style={{ width: 40 }} />}
        <View
          style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          accessibilityLabel={`Step ${step} of ${of}`}
          accessible
        >
          {Array.from({ length: of }, (_, i) => (
            <View key={i} style={{
              width: i + 1 === step ? 18 : 6, height: 6, borderRadius: 3,
              backgroundColor: i + 1 <= step ? c.accent : c.line2,
            }} />
          ))}
        </View>
        {onSkip ? (
          <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip this step" hitSlop={12}
            style={{ width: 40, alignItems: 'flex-end' }}>
            <Text variant="caption" tone="ink3">Skip</Text>
          </Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.huge, gap: space.lg }}
        keyboardShouldPersistTaps="handled">
        <View style={{ gap: space.xs }}>
          <Text variant="h1" accessibilityRole="header">{title}</Text>
          {subtitle ? <Text variant="body" tone="ink2">{subtitle}</Text> : null}
        </View>
        {children}
        {notices.map((n) => (
          <Text key={n} variant="caption" tone="warn" testID="onboarding-notice">{n}</Text>
        ))}
      </ScrollView>

      <View style={{ padding: space.lg, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: c.line }}>
        <Button title={continueLabel} onPress={onContinue} disabled={!canContinue} loading={busy}
          testID="onboarding-continue" />
      </View>
    </ScreenSafeArea>
  );
}

export interface Option<T> { value: T; title: string; detail?: string }

/** One choice from a short list, as tappable cards. A radio group to a screen reader. */
export function Options<T extends string | number>({ options, value, onChange, testID }: {
  options: readonly Option<T>[]; value: T | null; onChange: (v: T) => void; testID?: string;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ gap: space.sm }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.detail ? `${o.title}, ${o.detail}` : o.title}
            testID={testID ? `${testID}-${o.value}` : undefined}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: space.md,
              padding: space.base, borderRadius: radius.card, borderWidth: 1.5,
              borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentWash : c.surface,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontFamily: font.uiSemi }}>{o.title}</Text>
              {o.detail ? <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>{o.detail}</Text> : null}
            </View>
            <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={22} color={on ? c.accent : c.ink3} />
          </Pressable>
        );
      })}
    </View>
  );
}

/** A labelled number with its unit written beside it. */
export function NumberField({ label, value, onChange, unit, testID, placeholder, flex, hint }: {
  label: string; value: string; onChange: (v: string) => void; unit?: string;
  testID?: string; placeholder?: string; flex?: number;
  /** A reference value ("Last: 84 kg"), shown beside the label rather than inside the field. */
  hint?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6, flex }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: space.xs }}>
        {/* The field below says this itself, as its hint (ui/TextInput, a11y #24). */}
        <Text variant="caption" tone="ink3" accessibilityElementsHidden importantForAccessibility="no">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="ink3" numberOfLines={1} testID={testID ? `${testID}-hint` : undefined}>{hint}</Text>
        ) : null}
      </View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', minHeight: 52, borderRadius: radius.btn,
        borderWidth: 1, borderColor: c.line2, backgroundColor: c.sunken, paddingHorizontal: space.md,
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={c.ink3}
          accessibilityLabel={unit ? `${label}, in ${unit}` : label}
          testID={testID}
          style={{ flex: 1, color: c.ink, fontSize: 18, fontFamily: font.data }}
        />
        {unit ? <Text variant="body" tone="ink3" accessibilityElementsHidden importantForAccessibility="no">{unit}</Text> : null}
      </View>
    </View>
  );
}

/** A short text field (the name). */
export function TextField({ label, value, onChange, testID, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; testID?: string; placeholder?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Text variant="caption" tone="ink3" accessibilityElementsHidden importantForAccessibility="no">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.ink3}
        accessibilityLabel={label}
        testID={testID}
        autoCapitalize="words"
        style={{
          minHeight: 52, borderRadius: radius.btn, borderWidth: 1, borderColor: c.line2,
          backgroundColor: c.sunken, paddingHorizontal: space.md, color: c.ink, fontSize: 16,
        }}
      />
    </View>
  );
}

/** A caption above a group of controls. */
export function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <Text variant="caption" tone="ink3">{label}</Text>
      {children}
    </View>
  );
}

/** A row of small single-select chips (days a week, session length, check-in interval). */
export function Chips<T extends string | number>({ options, value, onChange, testID, fill = false }: {
  /** `a11y` is what a screen reader says when the visible label is terse ("60" → "60 minutes"). */
  options: readonly { value: T; label: string; a11y?: string }[]; value: T | null; onChange: (v: T) => void; testID?: string;
  /** Share the row equally — for a short run of numbers, which otherwise leave a ragged gap on the right. */
  fill?: boolean;
}) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.a11y ?? o.label}
            testID={testID ? `${testID}-${o.value}` : undefined}
            style={{
              minHeight: 44, minWidth: 52, paddingHorizontal: space.base, borderRadius: radius.pill,
              flexGrow: fill ? 1 : 0, flexBasis: fill ? 0 : 'auto',
              alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
              borderColor: on ? c.accent : c.line2, backgroundColor: on ? c.accentWash : c.surface,
            }}
          >
            <Text variant="body" tone={on ? 'accent' : 'ink2'} style={{ fontFamily: font.uiSemi }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
