/**
 * Land on a route with nothing behind it.
 *
 * Used at every crossing of the auth boundary and on tab switches. A plain
 * `replace` swaps only the top screen: after sign-in the welcome screen stayed
 * underneath the dashboard, so Back showed "Create account" to a signed-in
 * user (found on a phone in G10).
 */
import { router, type Href } from 'expo-router';

export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
