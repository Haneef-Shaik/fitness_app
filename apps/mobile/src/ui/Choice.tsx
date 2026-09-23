/**
 * A single-select chip row where one option is ALWAYS chosen.
 *
 * `FilterChips` is deliberately not this: it renders an "All" chip that clears
 * the selection, which is right for a filter and wrong for a setting. "No
 * activity level" is not a state a target calculator can be in.
 */
import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Text } from './index';
import { radius, space, useTheme } from '../theme';

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

export function Choice<T extends string>({
  options, value, onChange, testID, scroll = true,
}: {
  options: readonly ChoiceOption<T>[];
  value: T;
  onChange: (next: T) => void;
  testID?: string;
  scroll?: boolean;
}) {
  const { c } = useTheme();

  const row = (
    <View style={{ flexDirection: 'row', gap: space.sm }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, checked: active }}
            accessibilityLabel={o.label}
            testID={`${testID ?? 'choice'}-${o.value}`}
            style={{
              paddingHorizontal: space.md, minHeight: 38, justifyContent: 'center',
              borderRadius: radius.pill, borderWidth: 1,
              borderColor: active ? c.accent : c.line2,
              backgroundColor: active ? c.accent : 'transparent',
            }}
          >
            <Text variant="caption" style={{ color: active ? c.accentInk : c.ink2 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scroll) return <View testID={testID}>{row}</View>;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} testID={testID}>
      {row}
    </ScrollView>
  );
}
