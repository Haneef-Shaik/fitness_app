/**
 * E-02 · Active Session, hosting E-03 · Set Logger.
 *
 * The screen the whole product is shaped around. One rule governs everything
 * here: **the commit path never awaits the network** (I10). `commitSet` is
 * synchronous — it validates, reduces and publishes before it returns — and the
 * only visible difference between online and offline is the per-set sync dot.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Keyboard, ScrollView, View } from 'react-native';
import { Pressable } from '@/ui/Pressable';
import { ScreenSafeArea } from '@/ui/ScreenSafeArea';
import type { Exercise, PersonalRecord } from '@fitlog/api-types';
import { Button, Card, Pill, Text } from '@/ui';
import { useExercises, usePreviousPerformance, useProfile } from '@/lib/query/hooks';
import { PlateCalculatorSheet } from '@/features/workout-session/components/PlateCalculatorSheet';
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
import { flushAndReconcile, unsentFor } from '@/features/workout-session/sessionController';
import { AdvancedSetSheet } from '@/features/workout-session/components/AdvancedSetSheet';
import { NotesSheet } from '@/features/workout-session/components/NotesSheet';
import { ExerciseMenuSheet } from '@/features/workout-session/components/ExerciseMenuSheet';
import { cleanNote, EMPTY_ADVANCED, type AdvancedValue } from '@/features/workout-session/advanced';
import { healthBridge } from '@/features/health/bridge';
import { saveFinishedWorkout } from '@/features/health/sync';
import { summarise, type SessionSummary } from '@/features/workout-session/summary';
import { savedAnnouncement, setRowLabel, syncWords } from '@/features/workout-session/a11y';
import { targetFor } from '@/features/workout-session/restTimer';
import { groupLetter, groupWithNext, membersOf, roundStep } from '@/features/workout-session/supersets';
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
import { count } from '@/features/nutrition/format';

const EMPTY: SetEntryValue = {
  reps: null, loadKg: null, durationSeconds: null, distanceM: null, setType: 'working',
  rpe: null, rir: null, note: null,
};

/** A set's short badge: its number, or what kind of set it is. */
function badge(s: DraftSet): string {
  if (s.setType === 'warmup') return 'W';
  if (s.setType === 'drop') return 'D';
  if (s.setType === 'failure') return 'F';
  return String(s.setIndex + 1);
}

/** Which sheet is open: E-06 for the next set or a committed one, or E-07. */
type Open =
  | { sheet: 'advanced-next' }
  | { sheet: 'advanced-edit'; setClientId: string; setNumber: number }
  | { sheet: 'session-notes' }
  | { sheet: 'exercise-notes' }
  | { sheet: 'plates' }
  | { sheet: 'exercise-menu' }
  | null;

function SyncDot({ state }: { state: DraftSet['syncState'] }) {
  const { c } = useTheme();
  const colour = state === 'synced' ? c.good : state === 'failed' ? c.crit : c.ink3;
  return (
    <View
      accessibilityLabel={syncWords(state)}
      style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colour }}
    />
  );
}

/**
 * One committed set. Memoised: a commit adds a row, and without this every
 * earlier row re-rendered with it — the logger's cost grew with each set, and
 * tap → paint with it (TODO 2.1). Set objects are shared between drafts until
 * they change, so an unchanged row skips its render.
 *
 * The figures are ONE screen-reader stop and Delete is another. The row used to
 * carry a label without being a group, so TalkBack read the label and then
 * every child again — "Set 1, 80 kilograms for 8 reps", "1", "80 × 8",
 * "640 kg", "Synced", "Delete set 1": six swipes a set (G10 TalkBack session).
 */
const SetRow = memo(function SetRow({ set: s, onDelete, onEdit, countWarmups }: {
  set: DraftSet; onDelete: (clientId: string) => void; onEdit: (s: DraftSet) => void;
  countWarmups: boolean;
}) {
  const { c } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row', alignItems: 'center', gap: space.md,
        paddingVertical: space.sm, borderBottomWidth: 1, borderColor: c.line,
        opacity: s.setType === 'warmup' && !countWarmups ? 0.6 : 1,
      }}
    >
      <Pressable
        onPress={() => onEdit(s)}
        accessibilityRole="button"
        accessibilityLabel={setRowLabel(s)}
        accessibilityHint="Opens the set to change its type, effort or note"
        testID={`set-row-${s.setIndex}`}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}
      >
        <Text variant="caption" tone="ink3" style={{ width: 22 }}>
          {badge(s)}
        </Text>
        <Text variant="body" style={{ flex: 1, fontFamily: font.dataSemi }}>
          {s.loadKg ?? '—'} × {s.reps ?? '—'}
          {s.rpe != null ? <Text variant="caption" tone="ink3">{`  @${s.rpe}`}</Text> : null}
          {s.note ? <Text variant="caption" tone="ink3">{'  ✎'}</Text> : null}
        </Text>
        <Text variant="caption" tone="ink3">
          {contribution(s, { includeWarmups: countWarmups }) > 0
            ? `${Math.round(contribution(s, { includeWarmups: countWarmups }))} kg`
            : '—'}
        </Text>
        <SyncDot state={s.syncState} />
      </Pressable>
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
  const editSet = useSessionStore((s) => s.editSet);
  const setNotes = useSessionStore((s) => s.setNotes);
  const patchExercise = useSessionStore((s) => s.patchExercise);
  const removeExercise = useSessionStore((s) => s.removeExercise);
  const reorderExercises = useSessionStore((s) => s.reorderExercises);
  const swapExercise = useSessionStore((s) => s.swapExercise);
  const prefill = useSessionStore((s) => s.prefill);
  const addExercise = useSessionStore((s) => s.addExercise);
  const adopt = useSessionStore((s) => s.adopt);

  const catalog = useExercises({ limit: 200 });
  // K-04. Absent while loading or offline — the logger then behaves as it always
  // did, which is the defaults.
  const prefs = useProfile().data;
  const countWarmups = prefs?.warmups_in_volume ?? false;
  const finish = useFinishSession();
  const cancel = useCancelSession();

  const [activeIdx, setActiveIdx] = useState(0);
  const [value, setValue] = useState<SetEntryValue>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [rest, setRest] = useState<{ target: string; total: number } | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  // The picker either adds (the default) or swaps the exercise being replaced.
  const [swapping, setSwapping] = useState<string | null>(null);
  const [open, setOpen] = useState<Open>(null);
  const [editing, setEditing] = useState<AdvancedValue>(EMPTY_ADVANCED);
  // Stable (and above the early returns: it is a hook), because every SetRow receives it: a new function each render
  // defeated SetRow's memo and re-rendered the whole list on every commit
  // (p95 164.6 ms on the phone, against D16's 100 ms).
  const openEdit = useCallback((s: DraftSet) => {
    setEditing({ setType: s.setType, rpe: s.rpe, rir: s.rir, note: s.note ?? null });
    setOpen({ sheet: 'advanced-edit', setClientId: s.clientId, setNumber: s.setIndex + 1 });
  }, []);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
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
  //
  // Only an OPEN session is adopted. Finishing clears the draft while this
  // screen stays up for the summary, so the fetch below ran and adopted the
  // just-completed workout back as open: the active-session bar said "Workout
  // in progress … Resume" for a finished workout (G10, TalkBack session).
  const server = useSession(finished || draft?.sessionId === id ? '' : id);
  useEffect(() => {
    if (!server.data || server.data.status !== 'in_progress') return;
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
      // Effort and notes belong to one set; they never carry over to the next.
      rpe: null, rir: null, note: null,
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
      rpe: value.rpe ?? null,
      rir: value.rir ?? null,
      note: cleanNote(value.note ?? null),
    });

    if (!result.ok) { setError(result.error ?? 'That set could not be saved.'); return; }
    setError(null);
    // The next set starts prefilled, so the keyboard has nothing left to do.
    // Left up, a still-focused field brought it back over "Save set" as the
    // list scrolled (G10, on the phone).
    Keyboard.dismiss();
    painted();
    // Said out loud: the row appears and the button renumbers, and TalkBack
    // reads neither — saving a set was silent (G10 TalkBack session). After
    // `painted()`, so it is not inside the measured tap → paint span.
    AccessibilityInfo.announceForAccessibility(savedAnnouncement(exercise.sets.length + 1, value));
    if (SHOW_TIMING) setTimeout(() => setTiming(commitTimings.report()), 0);

    // E-13: inside a superset, the next set is the partner's, and the rest
    // waits for the end of the round.
    const step = roundStep(draft, activeIdx);
    if (step.next !== activeIdx) setActiveIdx(step.next);

    // The plan's rest first; K-04's default when the plan gives none.
    const restSeconds = Number(exercise.targetSnapshot?.['rest_seconds'] ?? 0)
      || (prefs?.default_rest_seconds ?? 0);
    if (step.restNow && restSeconds > 0) {
      setRest({ target: targetFor(new Date(), restSeconds), total: restSeconds });
    }

    void flushAndReconcile();
  };

  const doFinish = async () => {
    if (!draft || finishing) return;
    setFinishing(true);
    setFinishError(null);
    try {
      // The server refuses sets for a finished workout, so every queued change
      // has to land first — otherwise the last sets are lost to "That workout
      // is finished". Offline, finishing waits; the workout stays open and safe.
      const waiting = await unsentFor(draft.sessionId);
      if (waiting > 0) {
        setFinishError(
          `${count(waiting, 'change')} still waiting to upload. Finish once you're back online — `
          + 'everything is saved on this phone.',
        );
        return;
      }
      // Snapshot the numbers BEFORE finishing: `finish` clears the draft, and
      // summarising afterwards reads whatever is left, which showed 3 sets for a
      // 6-set workout. E-08 is meant to be instant, not merely fast.
      const snapshot = summarise(draft, new Date(), { includeWarmups: countWarmups });
      const result = await finish(id);
      // K-09 — a copy in the health store, if asked for; never blocks finishing.
      void saveFinishedWorkout(healthBridge(), {
        id, title: draft.exercises[0]?.exerciseName ? `FitLog · ${draft.exercises[0].exerciseName}` : 'FitLog workout',
        start: draft.startedAt, end: new Date().toISOString(),
      });
      setFinished({ records: (result.records ?? []) as PersonalRecord[], summary: snapshot });
    } catch (e) {
      setFinishError(e instanceof Error && e.message ? e.message : "The workout couldn't be finished. Try again.");
    } finally {
      setFinishing(false);
    }
  };


  const closeAdvanced = () => {
    if (open?.sheet === 'advanced-edit') {
      const s = exercise?.sets.find((x) => x.clientId === open.setClientId);
      const note = cleanNote(editing.note);
      if (s && (s.setType !== editing.setType || s.rpe !== editing.rpe
        || s.rir !== editing.rir || (s.note ?? null) !== note)) {
        editSet(s.clientId, { setType: editing.setType, rpe: editing.rpe, rir: editing.rir, note });
      }
    }
    setOpen(null);
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
              ? `${activeIdx + 1} of ${draft.exercises.length} · ${count(countSets(draft), 'set')}`
              : 'No exercises yet'}
          </Text>
        </View>
        <Pressable
          onPress={() => setOpen({ sheet: 'session-notes' })}
          accessibilityRole="button"
          accessibilityLabel={draft.notes ? 'Workout notes, has a note' : 'Workout notes'}
          hitSlop={10}
          testID="session-notes"
        >
          <Text variant="caption" tone={draft.notes ? 'accent' : 'ink2'}>Notes</Text>
        </Pressable>
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
                    accessibilityLabel={`${e.exerciseName ?? 'Exercise'}, ${count(e.sets.length, 'set')}`}
                    style={{
                      paddingHorizontal: space.md, minHeight: 40, justifyContent: 'center',
                      borderRadius: radius.pill, borderWidth: 1,
                      borderColor: i === activeIdx ? c.accent : c.line2,
                      backgroundColor: i === activeIdx ? c.accent : 'transparent',
                    }}
                  >
                    <Text variant="caption" style={{ color: i === activeIdx ? c.accentInk : c.ink2 }}>
                      {groupLetter(draft, i) ? `${groupLetter(draft, i)} · ` : ''}{e.exerciseName ?? 'Exercise'} · {e.sets.length}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {exercise ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                {exercise.skipped ? <Pill>Skipped</Pill> : null}
                {groupLetter(draft, activeIdx) ? (
                  <Pill kind="accent">
                    {`Superset ${groupLetter(draft, activeIdx)} · ${membersOf(draft, activeIdx).indexOf(activeIdx) + 1} of ${membersOf(draft, activeIdx).length}`}
                  </Pill>
                ) : null}
                <View style={{ flex: 1 }} />
                <Pressable
                  onPress={() => setOpen({ sheet: 'exercise-menu' })}
                  accessibilityRole="button"
                  accessibilityLabel={`Options for ${exercise.exerciseName ?? 'this exercise'}`}
                  hitSlop={10}
                  testID="exercise-options"
                >
                  <Text variant="caption" tone="ink2">Options ⋯</Text>
                </Pressable>
              </View>
            ) : null}

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
                <Text variant="label" accessibilityRole="header" style={{ marginBottom: space.sm }}>Today</Text>
                {exercise.sets.map((s) => (
                  <SetRow
                    key={s.clientId} set={s} onDelete={deleteSet} onEdit={openEdit}
                    countWarmups={countWarmups}
                  />
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
                onMore={() => setOpen({ sheet: 'advanced-next' })}
                onPlates={() => setOpen({ sheet: 'plates' })}
                showRpe={prefs?.show_rpe ?? false}
                showRir={prefs?.show_rir ?? false}
                loadStep={prefs?.load_step_kg ?? 2.5}
                error={error}
                commitLabel={`Save set ${exercise.sets.filter((s) => s.setType !== 'warmup').length + 1}`}
              />
            ) : null}

            {exercise ? (
              <Pressable
                onPress={() => setOpen({ sheet: 'exercise-notes' })}
                accessibilityRole="button"
                accessibilityLabel={exercise.notes
                  ? `Notes for ${exercise.exerciseName ?? 'this exercise'}: ${exercise.notes}`
                  : `Add a note for ${exercise.exerciseName ?? 'this exercise'}`}
                testID="exercise-notes"
              >
                <Text variant="caption" tone="ink3" numberOfLines={2}>
                  {exercise.notes ? `✎ ${exercise.notes}` : '✎ Add a note for this exercise'}
                </Text>
              </Pressable>
            ) : null}
          </>
        )}

        <Button
          title="+ Add exercises"
          kind="ghost"
          onPress={() => { setPicked([]); setPicking(true); }}
        />

        {finishError ? (
          <Text variant="caption" tone="crit" testID="finish-error">{finishError}</Text>
        ) : null}
        <Button title="Finish workout" onPress={doFinish} loading={finishing} testID="finish-workout" />

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
        onClose={() => { setPicking(false); setSwapping(null); }}
        max={swapping ? 1 : undefined}
        selected={picked}
        onChange={setPicked}
        alreadyPresent={draft.exercises.map((e) => e.exerciseId)}
        onCommit={(ids) => {
          const toNew = (exerciseId: string) => {
            const cat = byId.get(exerciseId);
            return {
              clientId: uuid(),
              exerciseId,
              exerciseName: cat?.name ?? null,
              tracks: {
                load: cat?.tracks_load ?? true, reps: cat?.tracks_reps ?? true,
                duration: cat?.tracks_duration ?? false, distance: cat?.tracks_distance ?? false,
              },
            };
          };
          if (swapping && ids[0]) {
            swapExercise(swapping, toNew(ids[0]));
          } else {
            for (const exerciseId of ids) addExercise(toNew(exerciseId));
          }
          setSwapping(null);
          setPicking(false);
        }}
      />

      <AdvancedSetSheet
        visible={open?.sheet === 'advanced-next' || open?.sheet === 'advanced-edit'}
        title={open?.sheet === 'advanced-edit'
          ? `Set ${open.setNumber} · ${exercise?.exerciseName ?? 'Exercise'}`
          : `Next set · ${exercise?.exerciseName ?? 'Exercise'}`}
        value={open?.sheet === 'advanced-edit' ? editing : {
          setType: value.setType, rpe: value.rpe ?? null, rir: value.rir ?? null, note: value.note ?? null,
        }}
        onChange={(next) => {
          if (open?.sheet === 'advanced-edit') setEditing(next);
          else setValue((v) => ({ ...v, ...next }));
        }}
        onDone={closeAdvanced}
        onDelete={open?.sheet === 'advanced-edit'
          ? () => { deleteSet(open.setClientId); setOpen(null); }
          : undefined}
      />

      <PlateCalculatorSheet
        visible={open?.sheet === 'plates'}
        loadKg={value.loadKg}
        imperial={prefs?.preferred_unit_system === 'imperial'}
        barKg={prefs?.bar_weight_kg}
        platesKg={prefs?.plate_inventory_kg}
        onUse={(loadKg) => { setValue((v) => ({ ...v, loadKg })); setOpen(null); }}
        onClose={() => setOpen(null)}
      />

      {exercise ? (
        <ExerciseMenuSheet
          visible={open?.sheet === 'exercise-menu'}
          name={exercise.exerciseName ?? 'Exercise'}
          setCount={exercise.sets.length}
          skipped={exercise.skipped}
          canMoveEarlier={activeIdx > 0}
          canMoveLater={activeIdx < draft.exercises.length - 1}
          onMove={(d) => {
            const ids = draft.exercises.map((e) => e.clientId);
            const j = activeIdx + d;
            [ids[activeIdx], ids[j]] = [ids[j]!, ids[activeIdx]!];
            reorderExercises(ids);
            setActiveIdx(j);
          }}
          onToggleSkip={() => { patchExercise(exercise.clientId, { skipped: !exercise.skipped }); setOpen(null); }}
          inSuperset={exercise.supersetGroup != null}
          canSupersetWithNext={activeIdx < draft.exercises.length - 1}
          onSuperset={() => {
            if (exercise.supersetGroup != null) {
              patchExercise(exercise.clientId, { supersetGroup: null });
            } else {
              const group = groupWithNext(draft, activeIdx);
              const partner = draft.exercises[activeIdx + 1];
              if (group !== null && partner) {
                patchExercise(exercise.clientId, { supersetGroup: group });
                if (partner.supersetGroup !== group) patchExercise(partner.clientId, { supersetGroup: group });
              }
            }
            setOpen(null);
          }}
          onSwap={() => { setOpen(null); setSwapping(exercise.clientId); setPicked([]); setPicking(true); }}
          onRemove={() => {
            removeExercise(exercise.clientId);
            setActiveIdx((i) => Math.max(0, Math.min(i, draft.exercises.length - 2)));
            setOpen(null);
          }}
          onNotes={() => setOpen({ sheet: 'exercise-notes' })}
          onHistory={() => { setOpen(null); router.push(`/train/exercises/${exercise.exerciseId}`); }}
          onClose={() => setOpen(null)}
        />
      ) : null}

      <NotesSheet
        visible={open?.sheet === 'session-notes' || open?.sheet === 'exercise-notes'}
        title={open?.sheet === 'exercise-notes'
          ? `Notes · ${exercise?.exerciseName ?? 'Exercise'}`
          : 'Workout notes'}
        initial={open?.sheet === 'exercise-notes' ? exercise?.notes ?? null : draft.notes}
        showTags={open?.sheet !== 'exercise-notes'}
        onDone={(note) => {
          if (open?.sheet === 'exercise-notes' && exercise) {
            if (note !== exercise.notes) patchExercise(exercise.clientId, { notes: note });
          } else if (note !== draft.notes) {
            setNotes(note);
          }
          setOpen(null);
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
