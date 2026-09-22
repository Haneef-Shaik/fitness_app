/**
 * The list every long surface uses (H2.1).
 *
 * FlashList rather than FlatList because the catalog is 29 seeded exercises today
 * and unbounded once users add their own — recycling matters at 300 rows, not 29,
 * and retrofitting it later means retrofitting every screen.
 *
 * `keyExtractor` is required, not optional: a list keyed by index reorders
 * incorrectly the moment rows move, which is exactly what C-05 does.
 */
import React from 'react';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { View } from 'react-native';
import { space } from '../theme';

export interface VirtualListProps<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  /** FlashList needs an estimate to size its recycling pool. */
  estimatedItemSize?: number;
  header?: React.ReactElement | null;
  footer?: React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}

export function VirtualList<T>({
  data, renderItem, keyExtractor, estimatedItemSize = 72, header, footer,
  onRefresh, refreshing = false, testID,
}: VirtualListProps<T>) {
  return (
    <FlashList
      testID={testID}
      data={data as T[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={estimatedItemSize}
      ListHeaderComponent={header ?? undefined}
      ListFooterComponent={
        footer ?? <View style={{ height: space.huge }} />
      }
      onRefresh={onRefresh}
      refreshing={onRefresh ? refreshing : undefined}
      keyboardShouldPersistTaps="handled"
    />
  );
}
