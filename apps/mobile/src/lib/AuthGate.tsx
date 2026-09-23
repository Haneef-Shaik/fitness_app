/**
 * Losing the session takes you to the login screen, wherever you were standing.
 *
 * `app/index.tsx` redirects by session status, but it only renders at `/`. Once
 * a user has navigated anywhere else, a status change is invisible to it — so
 * signing out from the dashboard left the dashboard on screen with an empty
 * avatar, and the next query 401'd into a generic error.
 *
 * This watches the status instead of the route, which is also the honest answer
 * to a refresh that fails mid-workout: the login screen, not a screen that no
 * longer works.
 */
import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { resetTo } from './navigation';
import { useSession } from './session';

/**
 * Screens that are *meant* to be seen without a session.
 *
 * Without this list the gate fights the user. Restoring a session is async, so
 * a cold start goes `loading` → `signed-out` — and if someone taps "I already
 * have one" before that settles, the transition fires while they are already on
 * `/login` and throws them back to `/welcome`. On a fast device the restore
 * wins the race and nothing looks wrong; on a slower one the button appears
 * dead. Found on an emulator, which lost the race every time.
 */
const PUBLIC_ROUTES = ['/welcome', '/login', '/register'];

export function AuthGate() {
  const { status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // `loading` is the cold-start state and must not redirect — the stored
    // token has not been tried yet, and bouncing to /welcome here would sign
    // out every returning user on launch.
    if (status !== 'signed-out') return;
    if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return;
    }
    resetTo('/welcome');
  }, [status, pathname]);

  return null;
}
