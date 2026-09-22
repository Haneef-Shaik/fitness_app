/**
 * The list every long surface uses (H2.1).
 *
 * **This is a seam, deliberately.** Screens never import a list implementation
 * directly, so swapping one is a change to this file rather than to nine screens.
 *
 * It is `FlatList` today, not `@shopify/flash-list`, and that is a considered
 * choice rather than an oversight. FlashList crashed the web build with
 * "Invalid hook call … more than one copy of React" the moment a screen rendered
 * one — reproduced, then isolated by swapping this file alone. It may well be
 * fine on a device, but there is no device to check on until **G4** (DR4), and
 * shipping a list nobody has run is exactly the kind of claim this project does
 * not make. At 29 catalog rows FlatList is not the bottleneck; when G4 can verify
 * on hardware, FlashList goes back behind this same interface.
 *
 * `keyExtractor` is required, not optional: a list keyed by index reorders
 * incorrectly the moment rows move, which is exactly what C-05 does.
 */
import React from 'react';
import { FlatList, View, type ListRenderItem } from 'react-native';
import { space } from '../theme';

export interface VirtualListProps<T> {
  data: readonly T[];
  renderItem: ListRenderItem<T>;
  keyExtractor: (item: T, index: number) => string;
  /** Kept in the interface: the recycling implementation needs it. */
  estimatedItemSize?: number;
  header?: React.ReactElement | null;
  footer?: React.ReactElement | null;
  onRefresh?: () => void;
  refreshing?: boolean;
  testID?: string;
}

export function VirtualList<T>({
  data, renderItem, keyExtractor, estimatedItemSize, header, footer,
  onRefresh, refreshing = false, testID,
}: VirtualListProps<T>) {
  return (
    <FlatList
      testID={testID}
      data={data as T[]}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={header ?? undefined}
      ListFooterComponent={footer ?? <View style={{ height: space.huge }} />}
      onRefresh={onRefresh}
      refreshing={onRefresh ? refreshing : undefined}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={estimatedItemSize ? Math.ceil(700 / estimatedItemSize) : 12}
      windowSize={11}
    />
  );
}
