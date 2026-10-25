// QA-1 F-1: a deep link may only finish a PKCE sign-in this device started. Implicit-flow tokens are never accepted.
export const AUTH_CALLBACK_PATH = '/auth/callback';

type AuthResult = { error: Error | null };
export type CallbackAuth = {
  getSession(): Promise<AuthResult & { data: { session: unknown } }>;
  exchangeCodeForSession(code: string): Promise<AuthResult>;
};

// The query must be exactly one non-empty `code`; anything else (tokens, duplicates, extras) is refused.
const CODE_QUERY = /^code=([^&]+)$/;
// One queue per auth client, so two callbacks can never pass the signed-out check together.
const queues = new WeakMap<CallbackAuth, Promise<boolean>>();

function decode(value: string) { try { return decodeURIComponent(value); } catch { return ''; } }

// Compares the raw string with the callback URL the app generated, so no URL parser can normalise a different origin or path into a match.
function callbackCode(url: string | null | undefined, expectedCallbackUrl: string): string | null {
  const prefix = `${expectedCallbackUrl}?`;
  if (!url || !expectedCallbackUrl || /[?#]/.test(expectedCallbackUrl) || url.includes('#') || !url.startsWith(prefix)) return null;
  const match = CODE_QUERY.exec(url.slice(prefix.length));
  return (match?.[1] ? decode(match[1]) : '') || null;
}

async function exchangeWhenSignedOut(auth: CallbackAuth, code: string) {
  try {
    const current = await auth.getSession();
    if (current.error || current.data.session) return false;
    const { error } = await auth.exchangeCodeForSession(code);
    return !error;
  } catch { return false; }
}

export function createAuthCallbackHandler(auth: CallbackAuth, expectedCallbackUrl: string) {
  return (url: string | null | undefined): Promise<boolean> => {
    const code = callbackCode(url, expectedCallbackUrl);
    if (!code) return Promise.resolve(false);
    const next = (queues.get(auth) ?? Promise.resolve(false)).then(() => exchangeWhenSignedOut(auth, code));
    queues.set(auth, next);
    return next;
  };
}
