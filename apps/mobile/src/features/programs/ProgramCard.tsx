/**
 * One starter program, as a selectable card (A-09 and the library, G10):
 * name, level or "Best match", days and length, what it is based on, why it
 * was ranked where it is — and, once selected, its days, exercises, schedule
 * and how the load progresses.
 */
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { ProgramTemplate } from '@volt/api-types';
import { Pill, Text } from '@/ui';
import { Pressable } from '@/ui/Pressable';
import { count } from '@/features/nutrition/format';
import { prescription } from './prescription';
import { font, radius, space, useTheme } from '@/theme';

export function ProgramCard({ t, on, onPress }: { t: ProgramTemplate; on: boolean; onPress: () => void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${t.name}, ${t.level}, ${count(t.days_per_week, 'day')} a week${t.recommended ? ', recommended' : ''}`}
      testID={`program-${t.key}`}
      style={{
        padding: space.base, borderRadius: radius.card, borderWidth: 1.5, gap: space.sm,
        borderColor: on ? c.accent : c.line, backgroundColor: on ? c.accentWash : c.surface,
        opacity: t.fits ? 1 : 0.7,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text variant="title" style={{ flex: 1 }}>{t.name}</Text>
        {t.recommended ? <Pill kind="accent">Best match</Pill> : <Pill>{t.level}</Pill>}
      </View>
      <Text variant="caption" tone="ink3">
        {count(t.days_per_week, 'day')} a week · ~{t.session_minutes} min{t.based_on ? ` · based on ${t.based_on}` : ''}
      </Text>
      <Text variant="body" tone="ink2">{t.summary}</Text>
      {t.reasons.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: space.md, rowGap: 4 }}>
          {t.reasons.map((r) => (
            <View key={r} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name={t.fits ? 'checkmark' : 'alert-circle-outline'} size={14} color={t.fits ? c.goodInk : c.warnInk} />
              <Text variant="caption" tone={t.fits ? 'good' : 'warn'}>{r}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {on ? (
        <View style={{ marginTop: space.xs, gap: space.md }} testID={`program-detail-${t.key}`}>
          {t.days.map((d) => (
            <View key={d.name} style={{ gap: 4, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: c.line }}>
              <Text variant="caption" style={{ fontFamily: font.uiSemi }}>{d.name}</Text>
              {d.exercises.map((e) => (
                <View key={e.name} style={{ flexDirection: 'row', gap: space.sm }}>
                  <Text variant="caption" tone="ink2" style={{ flex: 1 }}>{e.name}</Text>
                  <Text variant="caption" tone="ink2" style={{ fontFamily: font.dataSemi }}>{prescription(e)}</Text>
                </View>
              ))}
              {d.notes ? <Text variant="caption" tone="ink3">{d.notes}</Text> : null}
            </View>
          ))}
          <View style={{ gap: 4, padding: space.md, borderRadius: radius.btn, backgroundColor: c.sunken }}>
            <Text variant="caption" tone="ink2"><Text variant="caption" style={{ fontFamily: font.uiSemi }}>Schedule · </Text>{t.schedule}</Text>
            <Text variant="caption" tone="ink2"><Text variant="caption" style={{ fontFamily: font.uiSemi }}>Progression · </Text>{t.progression}</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}
