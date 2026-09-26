/** C-02 · Programs List. */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import type { Program } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { useCreateProgram, usePrograms } from '@/lib/query/hooks';
import { space } from '@/theme';

function summary(p: Program): string {
  const days = p.days?.length ?? 0;
  const exercises = (p.days ?? []).reduce((n, d) => n + (d.exercises?.length ?? 0), 0);
  return `${days} ${days === 1 ? 'day' : 'days'} · ${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}`;
}

export default function ProgramsList() {
  const programs = usePrograms();
  const create = useCreateProgram();
  const [busy, setBusy] = useState(false);

  const newProgram = async () => {
    setBusy(true);
    try {
      const p = await create.mutateAsync({ name: 'New program' });
      router.push(`/train/programs/${p.id}`);
    } finally { setBusy(false); }
  };

  return (
    <ScreenScaffold title="Programs" action={{ label: '+ New', onPress: newProgram }}>
      <DataBoundary
        query={programs}
        empty={{
          title: 'No programs yet',
          body: 'A program is a set of days you repeat — push, pull, legs. Start from one of ours, or tap + New to build your own.',
          action: { label: 'Browse starter programs', onPress: () => router.push('/train/programs/templates') },
        }}
      >
        {(rows) => (
          <View style={{ gap: space.md }}>
            {rows.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => router.push(`/train/programs/${p.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${p.name}, ${summary(p)}`}
              >
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>{p.name}</Text>
                    {p.status === 'archived' ? <Pill>archived</Pill> : null}
                    <Text variant="body" tone="ink3">›</Text>
                  </View>
                  <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>{summary(p)}</Text>
                  {(p.days?.length ?? 0) === 0 ? (
                    <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>No days yet</Text>
                  ) : null}
                </Card>
              </Pressable>
            ))}
            <Button title="New program" kind="ghost" onPress={newProgram} loading={busy} />
            <Button
              title="Start from a starter program"
              kind="ghost"
              testID="programs-templates"
              onPress={() => router.push('/train/programs/templates')}
            />
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
