/**
 * E-10 · Session Recovery, mounted once at the root.
 *
 * On launch it reads the local draft **and** `GET /workout-sessions/active` and
 * reconciles them with the table in docs/03 §5.3. Nothing is decided silently:
 * when the two disagree, the loser is offered as a discard rather than deleted.
 */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ApiError, api } from '../../lib/api';
import { store } from '../../lib/db';
import { useSessionStore } from './store/sessionStore';
import type { SessionDraft } from './store/types';
import { draftWithSetsFromServer } from './useSession';
import { RecoveryPrompt } from './components/RecoveryPrompt';
import type { WorkoutSession } from '@volt/api-types';

/** True when the server says this session is finished, cancelled or gone. */
async function closedOnServer(sessionId: string): Promise<boolean> {
  try {
    const own = await api.get<WorkoutSession>(`/workout-sessions/${sessionId}`);
    return own.status !== 'in_progress';
  } catch (e) {
    return e instanceof ApiError && e.status === 404;
  }
}

export function RecoveryGate({ enabled }: { enabled: boolean }) {
  const draft = useSessionStore((s) => s.draft);
  const candidate = useSessionStore((s) => s.recoveryCandidate);
  const recover = useSessionStore((s) => s.recover);
  const discard = useSessionStore((s) => s.discard);

  const [asked, setAsked] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || asked) return;
    let cancelled = false;

    (async () => {
      let local: SessionDraft | null = null;
      try {
        const row = await store.loadDraft();
        if (row) local = JSON.parse(row.json) as SessionDraft;
      } catch { /* an unreadable draft is the same as no draft */ }

      let server: SessionDraft | null = null;
      let answered = false;
      try {
        const active = await api.get<WorkoutSession | null>('/workout-sessions/active');
        answered = true;
        // With its sets: a recovered session that shows nothing logged reads
        // as lost work, and the sets are what make the merge safe (I8).
        if (active) server = draftWithSetsFromServer(active);
      } catch { /* offline: the local draft is all we have, which is the point */ }

      // docs/03 §5.3: only a draft of a session still IN PROGRESS is offered.
      // A draft whose session the server has closed is left over, not open —
      // G10's TalkBack session found "You left a workout open · 3 sets" for a
      // workout finished an hour earlier. Asked only when the server answered:
      // offline, the draft is kept and offered as before.
      if (local && answered && server?.sessionId !== local.sessionId
          && await closedOnServer(local.sessionId)) {
        await store.clearDraft().catch(() => {});
        local = null;
      }

      if (cancelled) return;
      setAsked(true);

      if (!local && !server) return;          // normal start
      recover(local, server);
      // Only ask when something was left open locally. Adopting a server session
      // the user is already in the middle of needs no dialog.
      if (local) setVisible(true);
    })();

    return () => { cancelled = true; };
  }, [enabled, asked, recover]);

  if (!visible || !draft) return null;

  return (
    <RecoveryPrompt
      visible
      draft={draft}
      conflicting={candidate}
      onResume={() => { setVisible(false); router.push(`/session/${draft.sessionId}`); }}
      onFinish={() => { setVisible(false); router.push(`/session/${draft.sessionId}`); }}
      onDiscard={() => { setVisible(false); discard(); }}
    />
  );
}
