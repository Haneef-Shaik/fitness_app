/**
 * 00 §4 ④ · the active-session bar (G10).
 *
 * While a workout is open it sits on every tab: what it is, how long it has
 * run, how many sets, and one tap back into the logger. It cannot be
 * dismissed — losing track of an open session is the failure it exists to
 * prevent. Until now only Train's and Home's own cards offered "Resume".
 *
 * It sits directly above the tab bar rather than under the top bar as the
 * wireframe draws it: there the status-bar inset already belongs to the
 * offline banner (L-02), and a second row fighting over it is how screens got
 * double-padded before. Above the tab bar it is also where a thumb already is.
 *
 * The phone's own draft comes first — it works offline and is what the logger
 * shows. The server's open session is the fallback, for a workout this phone
 * has not adopted yet (another device, or before recovery has asked).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSessionStore } from '@/features/workout-session/store/sessionStore';
import { useActiveSession } from '@/features/workout-session/useSession';
import { count } from '@/features/nutrition/format';
import { Pressable } from '../Pressable';
import { Text } from '../index';
import { font, space, useTheme } from '../../theme';

export interface OpenSession {
  id: string;
  startedAt: string;
  exercises: readonly { name: string | null; sets: number; skipped: boolean }[];
}

const pad = (n: number) => String(n).padStart(2, '0');

function clock(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function titleOf(names: readonly string[]): string {
  if (names.length === 0) return 'Workout';
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names[0]} + ${names.length - 1} more`;
}

export function sessionBarSummary(session: OpenSession, nowMs: number) {
  const done = session.exercises.filter((e) => !e.skipped);
  const title = titleOf(done.map((e) => e.name).filter((n): n is string => Boolean(n)));
  const seconds = Math.max(0, Math.floor((nowMs - Date.parse(session.startedAt)) / 1000));
  const sets = count(done.reduce((n, e) => n + e.sets, 0), 'set');
  const minutes = count(Math.floor(seconds / 60), 'minute');
  return {
    title,
    elapsed: clock(seconds),
    sets,
    // Minutes, not seconds: a label that changed every second would be handed
    // to a screen reader again and again (a11y finding #5).
    label: `Workout in progress: ${title}, ${minutes}, ${sets}. Resume`,
  };
}

/** The open workout, from this phone's draft first, else from the server. */
function useOpenSession(): OpenSession | null {
  const draft = useSessionStore((s) => s.draft);
  const server = useActiveSession().data;
  if (draft) {
    return {
      id: draft.sessionId,
      startedAt: draft.startedAt,
      exercises: draft.exercises.map((e) => ({ name: e.exerciseName, sets: e.sets.length, skipped: e.skipped })),
    };
  }
  if (server && server.status === 'in_progress') {
    return {
      id: server.id,
      startedAt: server.started_at,
      exercises: (server.exercises ?? []).map((e) => ({
        name: e.exercise_name ?? null, sets: e.sets?.length ?? 0, skipped: e.skipped,
      })),
    };
  }
  return null;
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}

export function ActiveSessionBar() {
  const { c } = useTheme();
  const session = useOpenSession();
  const now = useNow(session !== null);
  if (!session) return null;
  const s = sessionBarSummary(session, now);

  return (
    <Pressable
      testID="active-session-bar"
      accessibilityRole="button"
      accessibilityLabel={s.label}
      onPress={() => router.push(`/session/${session.id}`)}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.sm, minHeight: 52,
        backgroundColor: c.accentWash, borderTopWidth: 1, borderTopColor: c.accent,
      }}
    >
      <Ionicons name="flash" size={18} color={c.accent} />
      {/* The button's label speaks for its children, in minutes; the ticking seconds are for the eye. */}
      <View style={{ flex: 1 }}>
        <Text variant="body" numberOfLines={1} style={{ fontFamily: font.uiSemi }}>{s.title}</Text>
        <Text variant="caption" tone="ink2" numberOfLines={1}>
          <Text variant="caption" tone="ink2" style={{ fontFamily: font.dataSemi }}>{s.elapsed}</Text> · {s.sets}
        </Text>
      </View>
      <Text variant="body" tone="accent" style={{ fontFamily: font.uiSemi }}>Resume</Text>
      <Ionicons name="chevron-forward" size={18} color={c.accent} />
    </Pressable>
  );
}
