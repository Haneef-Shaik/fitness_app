/**
 * Starter programs — C-01's "Browse starter programs" and C-04's "Start from a
 * template".
 *
 * A template is a plan nobody owns. Choosing one copies it into the user's own
 * programs and opens the copy, which is theirs to rename, reorder and edit —
 * nothing they change can reach the template.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import type { ProgramTemplate } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ApiError } from '@/lib/api';
import { useProgramTemplates, useStartTemplate } from '@/lib/query/hooks';
import { count } from '@/features/nutrition/format';
import { space } from '@/theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function StarterPrograms() {
  const templates = useProgramTemplates();
  const start = useStartTemplate();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const use = async (key: string) => {
    setError(null);
    setPending(key);
    try {
      const program = await start.mutateAsync(key);
      router.replace(`/train/programs/${program.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add that program. Try again.');
    } finally {
      setPending(null);
    }
  };

  return (
    <ScreenScaffold title="Starter programs" subtitle="Add one, then make it yours">
      <DataBoundary
        query={templates}
        empty={{ title: 'No starter programs', body: 'Build your own from Programs.' }}
      >
        {(rows) => (
          <View style={{ gap: space.base }}>
            {error ? <Text variant="caption" tone="crit" testID="templates-error">{error}</Text> : null}
            {rows.map((t) => (
              <TemplateCard key={t.key} template={t} busy={pending === t.key} disabled={pending !== null}
                onUse={() => use(t.key)} />
            ))}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

function TemplateCard({ template: t, busy, disabled, onUse }: {
  template: ProgramTemplate; busy: boolean; disabled: boolean; onUse: () => void;
}) {
  return (
    <Card testID={`template-${t.key}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
        <Text variant="title" style={{ flex: 1 }}>{t.name}</Text>
        <Pill>{t.level}</Pill>
      </View>
      <Text variant="caption" tone="ink3" style={{ marginTop: 2 }}>
        {count(t.days_per_week, 'day')} a week
      </Text>
      <Text variant="body" tone="ink2" style={{ marginTop: space.sm }}>{t.summary}</Text>
      <View style={{ marginTop: space.md, gap: space.xs }}>
        {t.days.map((d) => (
          <View key={d.name} style={{ flexDirection: 'row', gap: space.sm }}>
            <Text variant="caption" tone="ink3" style={{ width: 32 }}>
              {d.scheduled_weekday == null ? '—' : WEEKDAYS[d.scheduled_weekday]}
            </Text>
            <Text variant="caption" style={{ flex: 1 }} numberOfLines={1}>
              {d.name} · {count(d.exercises.length, 'exercise')}
            </Text>
          </View>
        ))}
      </View>
      <Button
        title="Use this program"
        style={{ marginTop: space.base }}
        loading={busy}
        disabled={disabled && !busy}
        testID={`use-${t.key}`}
        onPress={onUse}
      />
    </Card>
  );
}
