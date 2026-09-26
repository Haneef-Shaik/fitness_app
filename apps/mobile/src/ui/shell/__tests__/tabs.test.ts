/**
 * The app shell's tab model (docs/wireframes/00 §4, decision D2): five slots —
 * Home, Train, the centre action, Nutrition, Progress.
 *
 * Found in G10 on the phone: there was no tab bar at all. Every section was
 * reached from a wall of buttons at the bottom of the dashboard, and a tab
 * root had nothing to go back to.
 */
import { activeTab, showsTabBar, TABS } from '../tabs';

describe('the five slots', () => {
  it('are Home, Train, the action, Nutrition, Progress — in that order', () => {
    expect(TABS.map((t) => t.key)).toEqual(['home', 'train', 'action', 'nutrition', 'progress']);
  });

  it('each tab root is a real route', () => {
    expect(TABS.filter((t) => t.key !== 'action').map((t) => t.href))
      .toEqual(['/home', '/train', '/nutrition', '/progress']);
  });
});

describe('which tab a screen belongs to', () => {
  it.each([
    ['/home', 'home'],
    ['/home/customize', 'home'],
    ['/notifications', 'home'],
    ['/settings', 'home'],
    ['/train', 'train'],
    ['/train/programs/abc', 'train'],
    ['/train/history/x/edit', 'train'],
    ['/nutrition', 'nutrition'],
    ['/nutrition/food/1', 'nutrition'],
    ['/progress/goals/new', 'progress'],
    ['/sync', 'home'],
  ])('%s → %s', (path, tab) => {
    expect(activeTab(path)).toBe(tab);
  });
});

describe('where the bar is hidden', () => {
  it.each([
    // Signed-out and first-run screens: there is nothing to navigate to.
    '/', '/welcome', '/login', '/register', '/onboarding',
    // A-05 and A-06, opened from an emailed link and often signed out.
    '/forgot-password', '/reset-password', '/verify-email',
    // Full-screen tasks (00 §4, 03 §4.1): leaving one is a deliberate act.
    '/session/abc', '/nutrition/describe', '/nutrition/photo', '/nutrition/analysis/abc',
    '/train/start', '/quick', '/search',
  ])('hidden on %s', (path) => {
    expect(showsTabBar(path)).toBe(false);
  });

  it.each(['/home', '/train', '/train/programs', '/nutrition', '/nutrition/add', '/progress/log', '/settings', '/settings/security'])(
    'shown on %s', (path) => {
      expect(showsTabBar(path)).toBe(true);
    },
  );
});
