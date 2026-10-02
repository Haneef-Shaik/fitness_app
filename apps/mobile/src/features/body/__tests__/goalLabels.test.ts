/**
 * Goal types and statuses are enum slugs on the wire. The dashboard printed
 * them with `replace('_', ' ')` — "fat loss", "active" — which is a database
 * leaking through. These are the words a person sees.
 */
import { goalStatusLabel, goalTypeLabel } from '../goalLabels';

describe('goalTypeLabel', () => {
  it.each([
    ['fat_loss', 'Fat loss'],
    ['muscle_gain', 'Muscle gain'],
    ['maintenance', 'Maintenance'],
    ['strength', 'Strength'],
    ['custom', 'Custom goal'],
  ])('%s → %s', (slug, label) => {
    expect(goalTypeLabel(slug)).toBe(label);
  });

  it('humanises a type it has never heard of rather than printing the slug', () => {
    expect(goalTypeLabel('body_recomposition')).toBe('Body recomposition');
  });
});

describe('goalStatusLabel', () => {
  it.each([
    ['active', 'Active'],
    ['paused', 'Paused'],
    ['completed', 'Reached'],
    ['achieved', 'Reached'],
    ['archived', 'Archived'],
  ])('%s → %s', (slug, label) => {
    expect(goalStatusLabel(slug)).toBe(label);
  });

  it('humanises an unknown status', () => {
    expect(goalStatusLabel('on_hold')).toBe('On hold');
  });
});
