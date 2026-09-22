/**
 * E-08 · Finish Summary, and E-11 · PR Celebration.
 *
 * The numbers are computed from the draft (../summary.ts) so the screen is
 * instant, then reconciled with the server's `/finish` response. Both sides come
 * from the same formula definitions, so they agree by construction rather than
 * by timing.
 *
 * **E-11 waits for E-08.** Interrupting someone mid-set to congratulate them is
 * the worst thing this flow could do, so records appear here, after the summary,
 * and never during the workout.
 */
import React from 'react';
import { View } from 'react-native';
import type { PersonalRecord } from '@volt/api-types';
import { Button, Card, Pill, Stat, StatRow, Text } from '@/ui';
import { font, space } from '@/theme';
import { formatRest } from '../restTimer';
import type { SessionSummary } from '../summary';

export interface FinishSummaryProps {
  summary: SessionSummary;
  /** From the server's finish response — computed inside the finish transaction. */
  records?: readonly PersonalRecord[];
  pending?: number;
  onDone: () => void;
}

const kg = (n: number) => `${Math.round(n).toLocaleString()} kg`;

export function FinishSummary({ summary, records = [], pending = 0, onDone }: FinishSummaryProps) {
  return (
    <View style={{ gap: space.lg }} testID="finish-summary">
      <StatRow>
        <Stat value={formatRest(summary.durationSeconds)} label="Duration" />
        <Stat value={String(summary.setCount)} label="Sets" />
        <Stat value={kg(summary.totalVolumeKg)} label="Volume" />
      </StatRow>

      {records.length > 0 ? (
        /* E-11 — after the summary, never mid-set. */
        <Card hero testID="pr-celebration">
          <Pill kind="accent">
            {records.length === 1 ? 'New personal record' : `${records.length} personal records`}
          </Pill>
          <View style={{ marginTop: space.md, gap: 6 }}>
            {records.map((r) => (
              <View
                key={`${r.exercise_id}-${r.record_type}`}
                style={{ flexDirection: 'row', justifyContent: 'space-between' }}
              >
                <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>
                  {r.exercise_name ?? 'Exercise'}
                </Text>
                <Text variant="body" style={{ fontFamily: font.dataSemi }}>
                  {r.record_type.replace('_', ' ')} {Math.round(r.value * 10) / 10} {r.unit}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View>
        <Text variant="label" style={{ marginBottom: space.sm }}>What you did</Text>
        {summary.exercises.map((e) => (
          <Card key={e.clientId} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>{e.name ?? 'Exercise'}</Text>
              <Text variant="body" style={{ fontFamily: font.dataSemi }}>{kg(e.volumeKg)}</Text>
            </View>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {e.setCount} {e.setCount === 1 ? 'set' : 'sets'}
              {e.bestE1rmKg ? ` · best e1RM ${kg(e.bestE1rmKg)}` : ''}
            </Text>
          </Card>
        ))}
      </View>

      {pending > 0 ? (
        <Text variant="caption" tone="ink3" testID="finish-pending">
          {pending} {pending === 1 ? 'write is' : 'writes are'} still syncing. Everything is saved on
          this device and will upload on its own.
        </Text>
      ) : null}

      <Button title="Done" onPress={onDone} />
    </View>
  );
}
