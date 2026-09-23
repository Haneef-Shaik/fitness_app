/**
 * The dashboard layout preference (B-02).
 *
 * The interesting case is **the release after this one**: somebody saves a
 * layout, a new card ships, and their saved layout has never heard of it. If
 * the stored value were trusted wholesale that card would silently never
 * appear, and nobody would report it as a bug because nothing looks broken.
 */
import {
  DASHBOARD_SECTIONS, DEFAULT_LAYOUT, mergeLayout,
} from '../layout';

describe('mergeLayout', () => {
  it('shows everything by default', () => {
    expect(DEFAULT_LAYOUT.every((s) => s.visible)).toBe(true);
    expect(DEFAULT_LAYOUT).toHaveLength(DASHBOARD_SECTIONS.length);
  });

  it('keeps the saved order', () => {
    const saved = [
      { key: 'goals', visible: true },
      { key: 'body', visible: true },
      { key: 'training', visible: true },
      { key: 'nutrition', visible: true },
    ];
    expect(mergeLayout(saved).map((s) => s.key)).toEqual([
      'goals', 'body', 'training', 'nutrition',
    ]);
  });

  it('appends a section the saved layout has never heard of', () => {
    // The release-after-next case. A new card must appear for somebody who
    // saved a layout before it existed.
    const merged = mergeLayout([{ key: 'training', visible: true }]);

    expect(merged[0]!.key).toBe('training');
    expect(merged).toHaveLength(DASHBOARD_SECTIONS.length);
    expect(merged.filter((s) => s.key !== 'training').every((s) => s.visible)).toBe(true);
  });

  it('drops a section that no longer exists', () => {
    const merged = mergeLayout([
      { key: 'training', visible: true },
      { key: 'horoscope', visible: true },
    ]);
    expect(merged.map((s) => s.key)).not.toContain('horoscope');
  });

  it('ignores a duplicate rather than rendering the card twice', () => {
    const merged = mergeLayout([
      { key: 'training', visible: true },
      { key: 'training', visible: false },
    ]);
    expect(merged.filter((s) => s.key === 'training')).toHaveLength(1);
  });

  it('falls back to the default for anything that is not a list', () => {
    // A corrupt preference is a reason to use the default, never a reason for
    // the dashboard to render nothing.
    for (const junk of [null, undefined, 42, 'training', { key: 'training' }]) {
      expect(mergeLayout(junk)).toEqual(DEFAULT_LAYOUT);
    }
  });

  it('treats a missing `visible` as visible', () => {
    expect(mergeLayout([{ key: 'body' }])[0]).toEqual({ key: 'body', visible: true });
  });

  it('honours a hidden section', () => {
    expect(mergeLayout([{ key: 'body', visible: false }])[0]!.visible).toBe(false);
  });
});
