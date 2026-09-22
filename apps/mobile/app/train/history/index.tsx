/**
 * F-01 · History List.
 *
 * Paged with the cursor convention (H5.1) — the screen never builds a cursor,
 * it asks the hook for the next page.
 *
 * **I13 is the whole point of the empty state here.** "You have no history" and
 * "nothing matches this filter" look identical as an empty array and are
 * completely different messages: one says start training, the other says change
 * the filter. `meta.filtered` and `meta.total_unfiltered` are what tell them
 * apart, which is why the list endpoint counts before it filters.
 */
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import type { HistoryItem } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { DataBoundary } from '@/ui/DataBoundary';
import { ScreenScaffold } from '@/ui/ScreenScaffold';
import { VirtualList } from '@/ui/VirtualList';
import { HistoryFilterSheet, type HistoryFilterValue } from '@/features/history/HistoryFilterSheet';
import { formatSessionSummary } from '@/features/history/format';
import { flattenHistory, useWorkoutHistory } from '@/lib/query/hooks';
import { space, useTheme } from '@/theme';

const EMPTY_FILTER: HistoryFilterValue = {};

export default function HistoryList() {
  const { c } = useTheme();
  const [filter, setFilter] = useState<HistoryFilterValue>(EMPTY_FILTER);
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = useWorkoutHistory(filter);
  const rows = useMemo(() => flattenHistory(query.data?.pages), [query.data]);
  const meta = query.data?.pages[query.data.pages.length - 1]?.meta;

  const isFiltered = Boolean(filter.muscle || filter.from || filter.to || filter.exerciseId);

  // The boundary wants a plain query shape, not an infinite one.
  const boundaryQuery = {
    data: rows,
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    refetch: () => { void query.refetch(); },
  };

  return (
    <ScreenScaffold
      title="History"
      scroll={false}
      action={{ label: isFiltered ? 'Filters •' : 'Filters', onPress: () => setSheetOpen(true) }}
    >
      <DataBoundary
        query={boundaryQuery}
        empty={{
          title: 'No workouts yet',
          body: 'Finished sessions show up here.',
        }}
        filtered={{
          isActive: isFiltered,
          onClear: () => setFilter(EMPTY_FILTER),
          describe: describeFilter(filter),
          title: 'Nothing matches that',
          body:
            meta?.total_unfiltered
              ? `You have ${meta.total_unfiltered} session${meta.total_unfiltered === 1 ? '' : 's'}, just none matching.`
              : undefined,
        }}
      >
        {(items) => (
          <VirtualList
            data={items}
            testID="history-list"
            keyExtractor={(row) => row.id}
            estimatedItemSize={92}
            onRefresh={() => { void query.refetch(); }}
            refreshing={query.isRefetching}
            renderItem={({ item }) => <HistoryRow row={item} />}
            footer={
              query.hasNextPage ? (
                <View style={{ padding: space.lg }}>
                  <Button
                    title={query.isFetchingNextPage ? 'Loading…' : 'Load more'}
                    kind="ghost"
                    onPress={() => { void query.fetchNextPage(); }}
                  />
                </View>
              ) : items.length > 0 ? (
                <Text
                  variant="caption"
                  tone="ink3"
                  style={{ textAlign: 'center', padding: space.lg, color: c.ink3 }}
                >
                  That's everything.
                </Text>
              ) : null
            }
          />
        )}
      </DataBoundary>

      <HistoryFilterSheet
        visible={sheetOpen}
        value={filter}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => { setFilter(next); setSheetOpen(false); }}
      />
    </ScreenScaffold>
  );
}

function describeFilter(f: HistoryFilterValue): string | undefined {
  const parts = [f.muscle, f.from ? `from ${f.from}` : undefined, f.to ? `to ${f.to}` : undefined];
  const live = parts.filter(Boolean);
  return live.length ? live.join(' + ') : undefined;
}

function HistoryRow({ row }: { row: HistoryItem }) {
  const summary = formatSessionSummary(row);
  return (
    <Pressable
      onPress={() => router.push(`/train/history/${row.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${summary.dateLabel}, ${summary.headline}`}
      style={{ paddingHorizontal: space.lg, paddingTop: space.sm }}
    >
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={{ flex: 1 }}>
            <Text variant="body" numberOfLines={1}>{summary.title}</Text>
            <Text variant="caption" tone="ink3" numberOfLines={1}>{summary.headline}</Text>
          </View>
          <Pill>{summary.dateLabel}</Pill>
        </View>
      </Card>
    </Pressable>
  );
}
