/**
 * The one async surface (docs/03 §6.4).
 *
 * Every screen renders its data through this so that loading, empty,
 * filtered-empty, error and offline are **structurally impossible to forget**.
 *
 * State precedence is fixed and tested:
 *   offline-with-no-cache → error → loading → empty → content
 *
 * The distinction that earns this component its place is **I13: filtered-empty is
 * not empty**. "No exercises match chest + barbell. Clear filters." and "You
 * haven't added any exercises yet" are different sentences with different actions,
 * and showing the second to someone holding a filter is the bug. Passing
 * `filtered.isActive` makes that impossible: the plain empty copy is never
 * reachable while a filter is on, even if the caller supplied no filtered copy.
 */
import React from 'react';
import { View } from 'react-native';
import { Text } from './index';
import { EmptyState, type EmptyAction } from './EmptyState';
import { SkeletonCard } from './Skeleton';
import { space, useTheme } from '../theme';

/** The slice of a TanStack query this component needs — kept narrow so it is trivial to fake. */
export interface BoundaryQuery<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

export interface EmptyCopy {
  title: string;
  body?: string;
  icon?: string;
  action?: EmptyAction;
}

export interface FilteredState {
  /** Whether any filter is currently narrowing the result. */
  isActive: boolean;
  onClear: () => void;
  /** Human description of the active filter, e.g. "chest + barbell". */
  describe?: string;
  title?: string;
  body?: string;
}

export interface DataBoundaryProps<T> {
  query: BoundaryQuery<T>;
  empty: EmptyCopy;
  filtered?: FilteredState;
  skeleton?: React.ReactNode;
  isOffline?: boolean;
  /** Defaults to "an empty array is empty"; pass one for non-list payloads. */
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
}

function defaultIsEmpty(data: unknown): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false; // 0, '' and false are values, not absence
}

function requestIdOf(error: unknown): string | undefined {
  const id = (error as { requestId?: unknown } | null)?.requestId;
  return typeof id === 'string' ? id : undefined;
}

export function DataBoundary<T>({
  query, empty, filtered, skeleton, isOffline = false, isEmpty = defaultIsEmpty as (d: T) => boolean, children,
}: DataBoundaryProps<T>) {
  const { c } = useTheme();
  const hasData = query.data !== undefined && !isEmpty(query.data);

  // 1. Offline with nothing cached — there is nothing to show and retrying will not help.
  if (isOffline && !hasData) {
    return (
      <EmptyState
        icon="cloud-offline-outline"
        title="You're offline"
        body="This will load as soon as you're back on a network."
      />
    );
  }

  // 2. Error beats loading: a retrying query is still an error the user should see.
  if (query.isError) {
    const ref = requestIdOf(query.error);
    return (
      <View>
        <EmptyState
          icon="alert-circle-outline"
          title="Something went wrong"
          body="That didn't load. It's usually temporary."
          action={{ label: 'Try again', onPress: () => { query.refetch(); } }}
        />
        {ref ? (
          <Text variant="caption" tone="ink3" style={{ textAlign: 'center' }}>
            Reference {ref}
          </Text>
        ) : null}
      </View>
    );
  }

  // 3. Loading — a shape, not a spinner (00 §5.1).
  if (query.isPending) return <>{skeleton ?? <SkeletonCard />}</>;

  // 4. Empty — and filtered-empty is a different sentence with a different way out.
  if (!hasData) {
    if (filtered?.isActive) {
      return (
        <EmptyState
          icon="funnel-outline"
          title={filtered.title ?? 'No matches'}
          body={
            filtered.body ??
            (filtered.describe
              ? `Nothing matches ${filtered.describe}.`
              : 'Nothing matches the current filters.')
          }
          action={{ label: 'Clear filters', onPress: filtered.onClear }}
        />
      );
    }
    return <EmptyState icon={empty.icon} title={empty.title} body={empty.body} action={empty.action} />;
  }

  // 5. Content. Stale-while-offline is allowed, but it is labelled.
  return (
    <>
      {isOffline ? (
        <View style={{ paddingVertical: 6, paddingHorizontal: space.md, backgroundColor: c.sunken }}>
          <Text variant="caption" tone="ink3">Offline — showing what's saved on this device.</Text>
        </View>
      ) : null}
      {children(query.data as T)}
    </>
  );
}

export default DataBoundary;
