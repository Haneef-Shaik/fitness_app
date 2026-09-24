/**
 * E-02 · Active Session, hosting E-03 · Set Logger.
 *
 * The screen the whole product is shaped around. One rule governs everything
 * here: **the commit path never awaits the network** (I10). `commitSet` is
 * synchronous — it validates, reduces and publishes before it returns — and the
 * only visible difference between online and offline is the per-set sync dot.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Keyboard, ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import type { Exercise, PersonalRecord } from '@volt/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { useExercises, usePreviousPerformance } from '@/lib/query/hooks';
import { uuid } from '@/lib/uuid';
import { font, radius, space, useTheme } from '@/theme';
import { useSessionStore } from '@/features/workout-session/store/sessionStore';
import { countSets, type DraftSet } from '@/features/workout-session/store/types';
import { SetEntry, type SetEntryValue } from '@/features/workout-session/components/SetEntry';
import { RestTimer } from '@/features/workout-session/components/RestTimer';
import { PreviousPerformanceStrip } from '@/features/workout-session/components/PreviousPerformance';
import { DiscardDialog } from '@/features/workout-session/components/DiscardDialog';
import { FinishSummary } from '@/features/workout-session/components/FinishSummary';
import { ExercisePicker } from '@/features/exercises/ExercisePicker';
import { flushAndReconcile } from '@/features/workout-session/sessionController';
import { summarise, type SessionSummary } from '@/features/workout-session/summary';
import { targetFor } from '@/features/workout-session/restTimer';
import { commitTimings } from '@/features/workout-session/commitTiming';

/**
 * The latency reading shows in development, and in a production bundle built
 * for measuring (`EXPO_PUBLIC_MEASURE=1`, scripts/measure-p95.sh) — the D16
 * number is about the build users run, not the dev bundle's overhead (TODO 2.2).
 */
const SHOW_TIMING = __DEV__ || process.env.EXPO_PUBLIC_MEASURE === '1';
import {
  draftWithSetsFromServer, useCancelSession, useFinishSession, useSession,
} from '@/features/workout-session/useSession';
import { contribution } from '@/features/workout-session/summary';

const EMPTY: SetEntryValue = {
  reps: null, loadKg: null, durationSeconds: null, distanceM: null, setType: 'working',
};

function SyncDot({ state }: { state: DraftSet['syncState'] }) {
  const { c } = useTheme();
  const colour = state === 'synced' ? c.good : state === 'failed' ? c.crit : c.ink3;
  const label = state === 'synced' ? 'Synced'
    : state === 'failed' ? 'Not uploaded' : 'Waiting to sync';
  return (
    <View
      accessibilityLabel={label}
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour }}
    />
  );
}

/**
 * One committed set. Memoised: a commit adds a row, and without this every
 * earlier row re-rendered with it — the logger's cost grew with each set, and
 * tap → paint with it (TODO 2.1). Set objects are shared between drafts until
 * they change, so an unchanged row skips its render.
 */
const SetRow = memo(function SetRow({ set: s, onDelete }: { set: DraftSet; onDelete: (clientId: string) => void }) {
  const { c } = useTheme();
  return (
    <View
      accessibilityLabel={
        `Set ${s.setIndex + 1}${s.setType === 'warmup' ? ', warm-up' : ''}, `
        + `${s.loadKg ?? '—'} kilograms for ${s.reps ?? '—'} reps`
      }
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingVertical: space.sm, borderBottomWidth: 1, borderColor: c.line,
        opacity: s.setType === 'warmup' ? 0.6 : 1,
      }}
    >
      <Text variant="caption" tone="ink3" style={{ width: 22 }}>
        {s.setType === 'warmup' ? 'W' : s.setIndex + 1}
      </Text>
      <Text variant="body" style={{ flex: 1, fontFamily: font.dataSemi }}>
        {s.loadKg ?? '—'} × {s.reps ?? '—'}
      </Text>
      <Text variant="caption" tone="ink3">
        {contribution(s) > 0 ? `${Math.round(contribution(s))} kg` : '—'}
      </Text>
      <SyncDot state={s.syncState} />
      <Pressable
        onPress={() => onDelete(s.clientId)}
        accessibilityRole="button"
        accessibilityLabel={`Delete set ${s.setIndex + 1}`}
        hitSlop={10}
      >
        <Text variant="caption" tone="ink3">✕</Text>
      </Pressable>
    </View>
  );
});

export default function ActiveSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();

  const draft = useSessionStore((s) => s.draft);
  const commitSet = useSessionStore((s) => s.commitSet);
  const deleteSet = useSessionStore((s) => s.deleteSet);
  const prefill = useSessionStore((s) => s.prefill);
  const addExercise = useSessionStore((s) => s.addExercise);
  const adopt = useSessionStore((s) => s.adopt);

  const catalog = useExercises({ limit: 200 });
  const finish = useFinishSession();
  const cancel = useCancelSession();

  const [activeIdx, setActiveIdx] = useState(0);
  const [value, setValue] = useState<SetEntryValue>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [rest, setRest] = useState<{ target: string; total: number } | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [timing, setTiming] = useState<ReturnType<typeof commitTimings.report> | null>(null);
  const [finished, setFinished] = useState<
    { records: PersonalRecord[]; summary: SessionSummary } | null
  >(null);

  const byId = useMemo(() => {
    const m = new Map<string, Exercise>();
    for (const e of catalog.data ?? []) m.set(e.id, e);
    return m;
  }, [catalog.data]);

  const exercise = draft?.exercises[activeIdx];
  const catalogEntry = exercise ? byId.get(exercise.exerciseId) : undefined;

  // Each set lands above the entry, so the Save button walks down the screen
  // one row per set — by set 17 it was below the fold and had to be found
  // again (G10, seen on the phone and in the p95 run). After a set is added
  // the list scrolls to keep the entry in reach. Not on switching exercise.
  const scroller = useRef<ScrollView>(null);
  const seen = useRef({ id: exercise?.clientId, sets: exercise?.sets.length ?? 0 });
  const setCount = exercise?.sets.length ?? 0;
  useEffect(() => {
    const grew = seen.current.id === exercise?.clientId && setCount > seen.current.sets;
    seen.current = { id: exercise?.clientId, sets: setCount };
    if (grew) scroller.current?.scrollToEnd({ animated: true });
  }, [exercise?.clientId, setCount]);

  // AC-04 — fetched as the exercise opens, non-blocking. Entry stays usable
  // whatever this does.
  const previous = usePreviousPerformance(exercise?.exerciseId ?? '');

  // Adopt the server's session when there is no local draft for it — resume from
  // E-01, a deep link, or a reload. Without this a resumed workout shows nothing
  // logged, which reads as lost work.
  const server = useSession(draft?.sessionId === id ? '' : id);
  useEffect(() => {
    if (!server.data) return;
    if (draft?.sessionId === server.data.id) return;
    adopt(draftWithSetsFromServer(server.data));
  }, [server.data, draft?.sessionId, adopt]);

  // Flush on foreground and on mount. Never on the commit path.
  useEffect(() => {
    void flushAndReconcile();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void flushAndReconcile();
    });
    return () => sub.remove();
  }, []);

  // Seed the entry fields from the last set, or the frozen plan target (I1).
  useEffect(() => {
    if (!exercise) return;
    const p = prefill(exercise.clientId);
    setValue({
      reps: p.reps ?? null,
      loadKg: p.loadKg ?? null,
      durationSeconds: p.durationSeconds ?? null,
      distanceM: p.distanceM ?? null,
      setType: 'working',
    });
    setError(null);
  }, [exercise?.clientId, exercise?.sets.length, prefill]);

  if (finished) {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: space.huge }}>
          <Text variant="title" accessibilityRole="header" style={{ marginBottom: space.lg }}>
            Workout finished
          </Text>
          <FinishSummary
            summary={finished.summary}
            records={finished.records}
            onDone={() => router.replace('/home')}
          />
        </ScrollView>
      </ScreenSafeArea>
    );
  }

  if (!draft) {
    return (
      <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page, padding: space.lg }}>
        <Text variant="body">No workout in progress.</Text>
        <Button title="Start one" style={{ marginTop: space.md }} onPress={() => router.replace('/train/start')} />
      </ScreenSafeArea>
    );
  }

  const commit = () => {
    if (!exercise) return;
    // H4.3 — the span from tap to painted row, which is what the < 100 ms budget
    // is actually about. Starting the clock is the first thing the handler does.
    const painted = commitTimings.start();

    // THE commit path. Synchronous: this returns before anything touches disk.
    const result = commitSet(exercise.clientId, {
      clientId: uuid(),
      setType: value.setType,
      reps: value.reps,
      loadKg: value.loadKg,
      durationSeconds: value.durationSeconds,
      distanceM: value.distanceM,
    });

    if (!result.ok) { setError(result.error ?? 'That set could not be saved.'); return; }
    setError(null);
    // The next set starts prefilled, so the keyboard has nothing left to do.
    // Left up, a still-focused field brought it back over "Save set" as the
    // list scrolled (G10, on the phone).
    Keyboard.dismiss();
    painted();
    if (SHOW_TIMING) setTimeout(() => setTiming(commitTimings.report()), 0);

    const restSeconds = Number(exercise.targetSnapshot?.['rest_seconds'] ?? 0);
    if (restSeconds > 0) setRest({ target: targetFor(new Date(), restSeconds), total: restSeconds });

    void flushAndReconcile();
  };

  const doFinish = async () => {
    if (!draft) return;
    // Snapshot the numbers BEFORE finishing: `finish` clears the draft, and
    // summarising afterwards reads whatever is left, which showed 3 sets for a
    // 6-set workout. E-08 is meant to be instant, not merely fast.
    const snapshot = summarise(draft, new Date());
    const result = await finish(id);
    setFinished({ records: (result.records ?? []) as PersonalRecord[], summary: snapshot });
  };

  return (
    <ScreenSafeArea style={{ flex: 1, backgroundColor: c.page }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingHorizontal: space.lg, paddingVertical: space.md,
        borderBottomWidth: 1, borderColor: c.line,
      }}>
        <View style={{ flex: 1 }}>
          <Text variant="title" numberOfLines={1} accessibilityRole="header">
            {exercise?.exerciseName ?? 'Workout'}
          </Text>
          <Text variant="caption" tone="ink3">
            {draft.exercises.length
              ? `${activeIdx + 1} of ${draft.exercises.length} · ${countSets(draft)} sets`
              : 'No exercises yet'}
          </Text>
        </View>
        <Pressable
          onPress={() => setDiscarding(true)}
          accessibilityRole="button"
          accessibilityLabel="Discard workout"
          hitSlop={10}
        >
          <Text variant="caption" tone="crit">Discard</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scroller}
        testID="session-scroll"
        contentContainerStyle={{ padding: space.lg, paddingBottom: space.huge, gap: space.lg }}
      >
        {draft.exercises.length === 0 ? (
          <Card>
            <Text variant="body">Nothing added yet</Text>
            <Text variant="caption" tone="ink3" style={{ marginTop: 4 }}>
              An empty workout is valid — add exercises as you go.
            </Text>
          </Card>
        ) : (
          <>
            {/* Exercise switcher — no trip back to the list to change exercise. */}
            {/* Android makes a horizontal ScrollView a keyboard stop of its own, and
                `focusable={false}` does not change that — so it is named, and padded by
                the focus ring's 2 px + 2 px offset so the ring is not clipped (a11y #17). */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              testID="exercise-switcher"
              accessibilityLabel="Exercises in this workout"
              style={{ margin: -4 }}
              contentContainerStyle={{ padding: 4 }}
            >
              <View style={{ flexDirection: 'row', gap: space.sm }} accessibilityRole="tablist">
                {draft.exercises.map((e, i) => (
                  <Pressable
                    key={e.clientId}
                    onPress={() => setActiveIdx(i)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: i === activeIdx }}
                    accessibilityLabel={`${e.exerciseName ?? 'Exercise'}, ${e.sets.length} sets`}
                    style={{
                      paddingHorizontal: space.md, minHeight: 40, justifyContent: 'center',
                      borderRadius: radius.pill, borderWidth: 1,
                      borderColor: i === activeIdx ? c.accent : c.line2,
                      backgroundColor: i === activeIdx ? c.accent : 'transparent',
                    }}
                  >
                    <Text variant="caption" style={{ color: i === activeIdx ? c.accentInk : c.ink2 }}>
                      {e.exerciseName ?? 'Exercise'} · {e.sets.length}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* ① Previous performance — always on screen, never behind a tap. */}
            <PreviousPerformanceStrip
              data={previous.data}
              isPending={previous.isPending}
              isError={previous.isError}
              onRetry={() => { previous.refetch(); }}
            />

            {rest ? (
              <RestTimer
                targetIso={rest.target}
                totalSeconds={rest.total}
                onDismiss={() => setRest(null)}
                onAdjust={(d) => setRest((r) => (r ? {
                  ...r, target: new Date(Date.parse(r.target) + d * 1000).toISOString(),
                } : r))}
              />
            ) : null}

            {exercise && exercise.sets.length > 0 ? (
              <View accessibilityRole="list" testID="today-sets">
                <Text variant="label" style={{ marginBottom: space.sm }}>Today</Text>
                {exercise.sets.map((s) => (
                  <SetRow key={s.clientId} set={s} onDelete={deleteSet} />
                ))}
                {exercise.sets.some((s) => s.syncState === 'failed') ? (
                  <Text variant="caption" tone="crit" style={{ marginTop: space.sm }} testID="sync-failed">
                    Some sets couldn't be uploaded. They're saved here and listed in the Sync Center.
                  </Text>
                ) : null}
              </View>
            ) : null}

            {exercise ? (
              <SetEntry
                exercise={catalogEntry ?? {
                  tracks_load: true, tracks_reps: true, tracks_duration: false,
                  tracks_distance: false, default_unit: 'kg',
                }}
                value={value}
                onChange={setValue}
                onCommit={commit}
                error={error}
                commitLabel={`Save set ${exercise.sets.filter((s) => s.setType !== 'warmup').length + 1}`}
              />
            ) : null}
          </>
        )}

        <Button
          title="+ Add exercises"
          kind="ghost"
          onPress={() => { setPicked([]); setPicking(true); }}
        />

        <Button title="Finish workout" onPress={doFinish} testID="finish-workout" />

        {SHOW_TIMING && timing ? (
          // H4.3 is a number someone has to write down, so it has to be readable
          // from the device that produced it.
          <Pressable
            onPress={() => setTiming(commitTimings.report())}
            accessibilityRole="button"
            accessibilityLabel="Commit latency"
            testID="commit-latency"
          >
            <Text variant="caption" tone="ink3">
              tap → rendered · p50 {timing.p50} ms · p95 {timing.p95} ms ·
              worst {timing.worst} ms · n={timing.count}
              {timing.count > 0 ? (timing.withinBudget ? ' · within budget' : ' · OVER BUDGET') : ''}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <ExercisePicker
        visible={picking}
        onClose={() => setPicking(false)}
        selected={picked}
        onChange={setPicked}
        alreadyPresent={draft.exercises.map((e) => e.exerciseId)}
        onCommit={(ids) => {
          for (const exerciseId of ids) {
            const cat = byId.get(exerciseId);
            addExercise({
              clientId: uuid(),
              exerciseId,
              exerciseName: cat?.name ?? null,
              tracks: {
                load: cat?.tracks_load ?? true, reps: cat?.tracks_reps ?? true,
                duration: cat?.tracks_duration ?? false, distance: cat?.tracks_distance ?? false,
              },
            });
          }
          setPicking(false);
        }}
      />

      <DiscardDialog
        visible={discarding}
        draft={draft}
        onCancel={() => setDiscarding(false)}
        onConfirm={async () => { setDiscarding(false); await cancel(id); router.replace('/home'); }}
      />
    </ScreenSafeArea>
  );
}
