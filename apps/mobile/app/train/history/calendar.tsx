/**
 * F-07 · Calendar view.
 *
 * The same history, arranged by month instead of as a stream — for "did I train
 * last Tuesday?", which a reverse-chronological list answers badly.
 *
 * Days come from `local_date`, never from `started_at`. That is I7 and AC-03:
 * the day a session belongs to is the day the *user* was living, and bucketing
 * a calendar by UTC instants puts a late-evening session on the wrong square
 * for everyone east of Greenwich.
 */
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { Card, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { flattenHistory, useWorkoutHistory } from '@/lib/query/hooks';
import { radius, space, useTheme } from '@/theme';

export default function HistoryCalendar() {
  const { c } = useTheme();
  const query = useWorkoutHistory({ limit: 100 });
  const rows = useMemo(() => flattenHistory(query.data?.pages), [query.data]);

  const byMonth = useMemo(() => {
    const out = new Map<string, Map<string, string>>();  // month -> day -> session id
    for (const row of rows) {
      const month = row.local_date.slice(0, 7);
      if (!out.has(month)) out.set(month, new Map());
      out.get(month)!.set(row.local_date, row.id);
    }
    return [...out.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [rows]);

  const boundaryQuery = {
    data: rows,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => { void query.refetch(); },
  };

  return (
    <ScreenScaffold title="Calendar" scroll={false}>
      <DataBoundary
        query={boundaryQuery}
        empty={{ title: 'No workouts yet', body: 'Finished sessions fill the calendar.' }}
      >
        {() => (
          <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
            {byMonth.map(([month, days]) => (
              <View key={month} testID={`month-${month}`}>
                <Text variant="label" style={{ marginBottom: space.sm }}>{month}</Text>
                <Card>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {daysOf(month).map((day) => {
                      const sessionId = days.get(day);
                      return (
                        <Pressable
                          key={day}
                          disabled={!sessionId}
                          onPress={() => sessionId && router.push(`/train/history/${sessionId}`)}
                          accessibilityRole={sessionId ? 'button' : undefined}
                          accessibilityLabel={
                            sessionId ? `${day}, trained` : `${day}, rest day`
                          }
                          style={{
                            width: 34, height: 34, borderRadius: radius.btn,
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: sessionId ? c.accent : c.line2,
                            backgroundColor: sessionId ? c.accent : 'transparent',
                          }}
                        >
                          <Text
                            variant="caption"
                            style={{ color: sessionId ? c.accentInk : c.ink3 }}
                          >
                            {Number(day.slice(8, 10))}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Card>
              </View>
            ))}
          </ScrollView>
        )}
      </DataBoundary>
    </ScreenScaffold>
  );
}

/** Every calendar day of `YYYY-MM`, as ISO dates. */
function daysOf(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const count = new Date(Date.UTC(y ?? 1970, m ?? 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) =>
    `${month}-${String(i + 1).padStart(2, '0')}`);
}
