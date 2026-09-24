/**
 * The starter-program library — C-01's "Browse starter programs", C-04's
 * "Start from a template" (G10).
 *
 * Well-known programs, ranked by the server for this user (experience, days,
 * equipment, goal) with the reasons in words. Filters narrow the list; tapping
 * a program shows its days, exercises, schedule and progression; "Use this
 * program" copies it into the user's own programs and opens the copy.
 */
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Button, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { FilterChips } from '@/ui/FilterChips';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { ApiError } from '@/lib/api';
import { useProgramTemplates, useStartTemplate } from '@/lib/query/hooks';
import { ProgramCard } from '@/features/programs/ProgramCard';
import { space } from '@/theme';

const LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const DAYS = [2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `${n} days` }));
const KIT = [
  { value: 'full_gym', label: 'Gym' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'bodyweight', label: 'No equipment' },
];

export default function StarterPrograms() {
  const templates = useProgramTemplates();
  const start = useStartTemplate();
  const [level, setLevel] = useState<string[]>([]);
  const [days, setDays] = useState<string[]>([]);
  const [kit, setKit] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const use = async (key: string) => {
    setError(null);
    try {
      const program = await start.mutateAsync(key);
      router.replace(`/train/programs/${program.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not add that program. Try again.');
    }
  };

  const rows = (templates.data ?? []).filter((t) =>
    (!level.length || level.includes(t.level))
    && (!days.length || days.includes(String(t.days_per_week)))
    && (!kit.length || kit.includes(t.equipment)));
  const filtering = level.length + days.length + kit.length > 0;

  return (
    <ScreenScaffold title="Starter programs" subtitle="Well-known programs, best match first">
      {/* Full-bleed: the chip rows scroll to the screen edge instead of being clipped at the gutter. */}
      <View style={{ marginHorizontal: -space.lg, marginTop: -space.sm, marginBottom: space.sm }}>
        <FilterChips options={LEVELS} selected={level} onChange={setLevel} multi={false} allLabel="Any level" testID="filter-level" />
        <FilterChips options={DAYS} selected={days} onChange={setDays} multi={false} allLabel="Any days" testID="filter-days" />
        <FilterChips options={KIT} selected={kit} onChange={setKit} multi={false} allLabel="Any equipment" testID="filter-kit" />
      </View>
      <DataBoundary
        query={{ ...templates, data: templates.data ? rows : undefined, refetch: () => { void templates.refetch(); } }}
        empty={{ title: 'No starter programs', body: 'Build your own from Programs.' }}
        filtered={{
          isActive: filtering, onClear: () => { setLevel([]); setDays([]); setKit([]); },
          describe: 'those filters', title: 'No program matches those filters',
        }}
      >
        {(list) => (
          <View style={{ gap: space.base }}>
            {error ? <Text variant="caption" tone="crit" testID="templates-error">{error}</Text> : null}
            {list.map((t) => (
              <View key={t.key} style={{ gap: space.sm }}>
                <ProgramCard t={t} on={open === t.key} onPress={() => setOpen(open === t.key ? null : t.key)} />
                {open === t.key ? (
                  <Button
                    title="Use this program"
                    loading={start.isPending}
                    testID={`use-${t.key}`}
                    onPress={() => { void use(t.key); }}
                  />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}
