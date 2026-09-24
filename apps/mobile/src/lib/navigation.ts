/**
 * Land on a route with nothing behind it.
 *
 * Used at every crossing of the auth boundary and on tab switches. A plain
 * `replace` swaps only the top screen: after sign-in the welcome screen stayed
 * underneath the dashboard, so Back showed "Create account" to a signed-in
 * user (found on a phone in G10).
 */
import { router, type Href } from 'expo-router';
import { Platform } from 'react-native';

export function resetTo(href: Href) {
  if (!router.canDismiss()) {
    router.replace(href);
    return;
  }
  router.dismissAll();
  // On web the pop-to-top reaches the router's state a tick later, and a
  // replace in the same tick was applied to the screen being popped and lost:
  // "Create account" landed on the welcome screen. Native applies it at once
  // (verified on the phone), so it keeps the same-tick path and no flash.
  if (Platform.OS === 'web') setTimeout(() => router.replace(href), 0);
  else router.replace(href);
}
