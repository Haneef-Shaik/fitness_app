/**
 * The app shell's tab model — docs/wireframes/00 §4 and decision D2.
 *
 * Five slots: four sections and, in the middle, the context action (B-03).
 * Pure, so which tab is lit and where the bar hides are tested without a
 * navigator.
 */
export type TabKey = 'home' | 'train' | 'action' | 'nutrition' | 'progress';

export interface Tab {
  key: TabKey;
  label: string;
  /** Where the tab goes. The action opens the quick-action sheet. */
  href: '/home' | '/train' | '/quick' | '/nutrition' | '/progress';
  /** Ionicons outline name, and the filled one for the active tab (00 §4). */
  icon: string;
  iconActive: string;
}

export const TABS: readonly Tab[] = [
  { key: 'home', label: 'Home', href: '/home', icon: 'home-outline', iconActive: 'home' },
  { key: 'train', label: 'Train', href: '/train', icon: 'barbell-outline', iconActive: 'barbell' },
  { key: 'action', label: 'Quick actions', href: '/quick', icon: 'add', iconActive: 'add' },
  { key: 'nutrition', label: 'Nutrition', href: '/nutrition', icon: 'nutrition-outline', iconActive: 'nutrition' },
  { key: 'progress', label: 'Progress', href: '/progress', icon: 'trending-up-outline', iconActive: 'trending-up' },
];

/**
 * Screens with no tab bar: signed-out and first-run screens (nothing to
 * navigate to yet), and full-screen tasks (00 §4, 03 §4.1) — the logger, the
 * AI capture and review flow, the start picker, search and the action sheet.
 */
const HIDDEN: readonly RegExp[] = [
  /^\/$/, /^\/welcome/, /^\/login/, /^\/register/, /^\/onboarding/,
  // A-05 and A-06 open from an emailed link, often signed out.
  /^\/forgot-password/, /^\/reset-password/, /^\/verify-email/,
  /^\/session\//, /^\/nutrition\/(describe|photo|analysis)(\/|$)/,
  /^\/train\/start$/, /^\/quick$/, /^\/search$/,
];

export function showsTabBar(pathname: string): boolean {
  return !HIDDEN.some((re) => re.test(pathname));
}

/** The section a screen belongs to. Anything outside the three is Home's. */
export function activeTab(pathname: string): Exclude<TabKey, 'action'> {
  if (pathname === '/train' || pathname.startsWith('/train/')) return 'train';
  if (pathname === '/nutrition' || pathname.startsWith('/nutrition/')) return 'nutrition';
  if (pathname === '/progress' || pathname.startsWith('/progress/')) return 'progress';
  return 'home';
}
