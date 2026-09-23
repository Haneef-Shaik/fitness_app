/**
 * The categories a logger should OFFER.
 *
 * Hidden ones are filtered out here, once, rather than in each picker — H-16's
 * "hide" only means stop offering it, and a screen that forgot the filter would
 * quietly put a category back on the menu.
 *
 * The fallback is the four defaults: the list is a network read, and a picker
 * with nothing in it is worse than a picker showing what every account starts
 * with.
 */
import { useMemo } from 'react';
import { useMealCategories } from '@/lib/query/hooks';
import { MEAL_TYPES, mealTypeLabel } from './format';

export interface CategoryOption {
  value: string;
  label: string;
}

export function useCategoryOptions(): {
  options: CategoryOption[];
  categories: { slug: string; name: string }[] | undefined;
} {
  const query = useMealCategories();

  return useMemo(() => {
    const rows = query.data;
    if (!rows || rows.length === 0) {
      return {
        options: MEAL_TYPES.map((t) => ({ value: t, label: mealTypeLabel(t) })),
        categories: undefined,
      };
    }
    return {
      options: rows
        .filter((c) => !c.hidden)
        .map((c) => ({ value: c.slug, label: c.name })),
      categories: rows.map((c) => ({ slug: c.slug, name: c.name })),
    };
  }, [query.data]);
}
