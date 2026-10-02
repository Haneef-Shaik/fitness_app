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
import type { PersonalRecord } from '@fitlog/api-types';
import { Button, Card, Pill, Stat, StatRow, Text } from '@/ui';
import { font, space } from '@/theme';
import { formatRest } from '../restTimer';
import { exerciseSummaryLabel, spokenDuration } from '../a11y';
import type { SessionSummary } from '../summary';

export interface FinishSummaryProps {
  summary: SessionSummary;
  /** From the server's finish response — computed inside the finish transaction. */
  records?: readonly PersonalRecord[];
  pending?: number;
  onDone: () => void;
}

const kg = (n: number) => `${Math.round(n).toLocaleString()} kg`;
/** Loads and e1RMs to one decimal, the same in the records and the list. */
const kgTenth = (n: number) => `${Math.round(n * 10) / 10} kg`;

/** The record types in words — "estimated_1rm" read as "estimated 1rm". */
const RECORD_LABEL: Record<string, string> = {
  max_load: 'Heaviest',
  max_reps: 'Most reps',
  volume: 'Best session',
  estimated_1rm: 'Estimated 1RM',
};

function recordText(r: PersonalRecord): string {
  const label = RECORD_LABEL[r.record_type] ?? r.record_type.replace(/_/g, ' ');
  if (r.unit === 'reps') return `${label} ${Math.round(r.value)} reps`;
  return `${label} ${r.record_type === 'volume' ? kg(r.value) : kgTenth(r.value)}`;
}

export function FinishSummary({ summary, records = [], pending = 0, onDone }: FinishSummaryProps) {
  return (
    <View style={{ gap: space.lg }} testID="finish-summary">
      <StatRow>
        <Stat
          value={formatRest(summary.durationSeconds)}
          spoken={spokenDuration(summary.durationSeconds)}
          label="Duration"
        />
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
                  {recordText(r)}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <View>
        <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>
          What you did
        </Text>
        {summary.exercises.map((e) => (
          <Card
            key={e.clientId}
            style={{ marginBottom: 8 }}
            accessible
            accessibilityLabel={exerciseSummaryLabel(e.name, e.volumeKg, e.setCount, e.bestE1rmKg)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" numberOfLines={1} style={{ flex: 1 }}>{e.name ?? 'Exercise'}</Text>
              <Text variant="body" style={{ fontFamily: font.dataSemi }}>{kg(e.volumeKg)}</Text>
            </View>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              {e.setCount} {e.setCount === 1 ? 'set' : 'sets'}
              {e.bestE1rmKg ? ` · best e1RM ${kgTenth(e.bestE1rmKg)}` : ''}
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
