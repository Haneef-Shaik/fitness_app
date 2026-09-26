/**
 * Check-ins as milestones (G10, the owner's review): when the next one is
 * due, what has changed since the first, and the last few.
 *
 * A change is shown as a signed number with its unit — never coloured red for
 * going up (I11): a heavier week on a muscle-gain goal is the point.
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { Checkins } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { friendlyDate, shortDate } from '@/features/dashboard/date';
import { MEASUREMENTS } from '@/features/onboarding/answers';
import { font, space } from '@/theme';

const LABEL: Record<string, string> = {
  body_weight: 'Weight', ...Object.fromEntries(MEASUREMENTS.map((m) => [m.key, m.label])),
};
const unit = (key: string) => (key === 'body_weight' ? 'kg' : key.endsWith('_pct') ? '%' : 'cm');
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(Math.round(n * 10) / 10)}`;

export function CheckinCard({ data }: { data: Checkins }) {
  const latest = data.checkins[0];
  const changes = latest && data.baseline && latest.local_date !== data.baseline.local_date
    ? Object.entries(latest.since_baseline ?? {})
    : [];

  return (
    <Card testID="checkins">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text variant="label" style={{ flex: 1 }}>Check-ins</Text>
        {data.overdue ? <Pill kind="accent">Due</Pill> : null}
      </View>

      <Text variant="body" style={{ marginTop: space.sm }} testID="checkin-next">
        {data.checkins.length === 0
          ? 'No check-in yet — record your starting point.'
          : data.overdue || data.next_due === data.today
            ? 'Your check-in is due.'
            : `Next check-in: ${friendlyDate(data.next_due)}`}
      </Text>
      <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>
        Every {data.interval_days === 7 ? 'week' : `${data.interval_days} days`}: weight plus any measurements.
      </Text>

      {changes.length ? (
        <View style={{ marginTop: space.base, gap: 4 }} testID="checkin-changes">
          <Text variant="caption" tone="ink3">Since your first check-in ({shortDate(data.baseline!.local_date, data.today)})</Text>
          {changes.map(([key, delta]) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body">{LABEL[key] ?? key}</Text>
              <Text variant="body" style={{ fontFamily: font.dataSemi }}>{signed(delta)} {unit(key)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {data.checkins.length > 0 ? (
        <View style={{ marginTop: space.base, gap: 4 }}>
          <Text variant="caption" tone="ink3">Recent</Text>
          {data.checkins.slice(0, 4).map((c) => (
            <View key={c.local_date} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="caption" tone="ink2">{shortDate(c.local_date, data.today)}</Text>
              <Text variant="caption" tone="ink2">
                {c.values.body_weight != null ? `${c.values.body_weight} kg` : ''}
                {Object.keys(c.values).filter((k) => k !== 'body_weight').length
                  ? ` · ${Object.keys(c.values).filter((k) => k !== 'body_weight').length} measurements` : ''}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Button
        title={data.checkins.length === 0 ? 'Record my starting point' : 'Check in now'}
        kind={data.overdue || data.checkins.length === 0 ? 'primary' : 'ghost'}
        size="sm"
        style={{ marginTop: space.base }}
        testID="go-checkin"
        onPress={() => router.push('/progress/checkin')}
      />
    </Card>
  );
}
