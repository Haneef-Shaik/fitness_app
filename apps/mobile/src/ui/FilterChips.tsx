/**
 * The filter row (H2.1). Single- or multi-select.
 *
 * It reports whether anything is active so `DataBoundary` can tell filtered-empty
 * from empty (**I13**) — that is the whole reason this is one component and not a
 * row of Pressables per screen.
 */
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { Text } from './index';
import { radius, space, useTheme } from '../theme';

export interface ChipOption {
  value: string;
  label: string;
}

export interface FilterChipsProps {
  options: readonly ChipOption[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
  /** Rendered first and clears the selection when tapped. */
  allLabel?: string;
  testID?: string;
}

export function FilterChips({
  options, selected, onChange, multi = true, allLabel = 'All', testID,
}: FilterChipsProps) {
  const { c } = useTheme();
  const none = selected.length === 0;

  const toggle = (value: string) => {
    if (!multi) return onChange(selected[0] === value ? [] : [value]);
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const chip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      testID={testID ? `${testID}-${key}` : undefined}
      style={{
        paddingHorizontal: space.md,
        minHeight: 34,
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: active ? c.accent : c.line2,
        backgroundColor: active ? c.accent : 'transparent',
      }}
    >
      <Text variant="caption" style={{ color: active ? c.accentInk : c.ink2 }}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{ gap: space.sm, paddingHorizontal: space.lg, paddingVertical: space.sm }}
    >
      <View style={{ flexDirection: 'row', gap: space.sm }}>
        {chip('__all', allLabel, none, () => onChange([]))}
        {options.map((o) => chip(o.value, o.label, selected.includes(o.value), () => toggle(o.value)))}
      </View>
    </ScrollView>
  );
}

/** True when any filter is narrowing the result — feeds `DataBoundary.filtered`. */
export const anyFilterActive = (...parts: Array<string | readonly string[] | undefined>): boolean =>
  parts.some((p) => (typeof p === 'string' ? p.trim().length > 0 : (p?.length ?? 0) > 0));

/** Human description of the active filters, for the filtered-empty message. */
export function describeFilters(
  query: string,
  chips: readonly string[],
  labelOf: (value: string) => string,
): string {
  const parts = [...chips.map(labelOf)];
  if (query.trim()) parts.unshift(`"${query.trim()}"`);
  return parts.join(' + ');
}
