/**
 * The first-run checklist (B-01, BRD §14): "Let's get your first data in".
 * Replaces four empty cards with three things to do, each with its button,
 * and dissolves as the data arrives.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card, Text } from './index';
import { space, useTheme } from '@/theme';

export interface ChecklistItem {
  key: string;
  label: string;
  hint?: string;
  done: boolean;
  action?: { label: string; onPress: () => void; testID?: string };
  testID?: string;
}

export interface ChecklistProps {
  title: string;
  body?: string;
  items: readonly ChecklistItem[];
  testID?: string;
}

export function Checklist({ title, body, items, testID }: ChecklistProps) {
  const { c } = useTheme();
  const done = items.filter((i) => i.done).length;
  return (
    <Card hero testID={testID} label="Getting started" labelTone="accent" right={
      <Text variant="caption" tone="ink3">{done} of {items.length} done</Text>
    }>
      <Text variant="h2">{title}</Text>
      {body ? <Text variant="body" tone="ink2" style={{ marginTop: space.xs }}>{body}</Text> : null}
      <View style={{ marginTop: space.base, gap: space.sm }}>
        {items.map((item) => (
          <View
            key={item.key}
            testID={item.testID}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: space.md,
              minHeight: 52, paddingVertical: space.xs,
              borderTopWidth: 1, borderTopColor: c.line,
            }}
          >
            <View
              accessible
              accessibilityLabel={`${item.label}, ${item.done ? 'done' : 'not done yet'}`}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
            >
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={item.done ? c.goodInk : c.ink3}
              />
              <View style={{ flex: 1 }}>
                <Text variant="body" weight="semi" tone={item.done ? 'ink3' : 'ink'}>{item.label}</Text>
                {item.hint && !item.done ? <Text variant="caption" tone="ink3">{item.hint}</Text> : null}
              </View>
            </View>
            {item.action && !item.done ? (
              <Button title={item.action.label} kind="secondary" size="sm" onPress={item.action.onPress} testID={item.action.testID} />
            ) : null}
          </View>
        ))}
      </View>
    </Card>
  );
}
