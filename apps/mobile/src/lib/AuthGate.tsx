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
import { router } from 'expo-router';
import { useSession } from './session';

export function AuthGate() {
  const { status } = useSession();

  useEffect(() => {
    // `loading` is the cold-start state and must not redirect — the stored
    // token has not been tried yet, and bouncing to /welcome here would sign
    // out every returning user on launch.
    if (status === 'signed-out') router.replace('/welcome');
  }, [status]);

  return null;
}
