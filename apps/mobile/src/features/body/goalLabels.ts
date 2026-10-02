/**
 * The words for a goal's type and status. The wire carries slugs; screens
 * never print one — an unknown value is humanised, never shown raw.
 */
const TYPE_LABELS: Record<string, string> = {
  fat_loss: 'Fat loss',
  muscle_gain: 'Muscle gain',
  maintenance: 'Maintenance',
  strength: 'Strength',
  custom: 'Custom goal',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Reached',
  achieved: 'Reached',
  archived: 'Archived',
  missed: 'Missed',
};

function humanise(slug: string): string {
  const spaced = slug.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function goalTypeLabel(slug: string): string {
  return TYPE_LABELS[slug] ?? humanise(slug);
}

export function goalStatusLabel(slug: string): string {
  return STATUS_LABELS[slug] ?? humanise(slug);
}
