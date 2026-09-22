/**
 * E-10 · Session Recovery, mounted once at the root.
 *
 * On launch it reads the local draft **and** `GET /workout-sessions/active` and
 * reconciles them with the table in docs/03 §5.3. Nothing is decided silently:
 * when the two disagree, the loser is offered as a discard rather than deleted.
 */
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { store } from '../../lib/db';
import { useSessionStore } from './store/sessionStore';
import { startDraft } from './store/reducers';
import type { SessionDraft } from './store/types';
import { draftFromServer } from './useSession';
import { RecoveryPrompt } from './components/RecoveryPrompt';
import type { WorkoutSession } from '@volt/api-types';

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
      try {
        const active = await api.get<WorkoutSession | null>('/workout-sessions/active');
        if (active) server = startDraft(draftFromServer(active));
      } catch { /* offline: the local draft is all we have, which is the point */ }

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
