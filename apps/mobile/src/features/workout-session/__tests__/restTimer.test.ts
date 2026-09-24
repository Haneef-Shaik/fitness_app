import { formatRest, readTimer, restAnnouncement, targetFor } from '../restTimer';

const START = new Date('2026-09-22T10:00:00Z');

describe('the rest timer counts to an instant, not down from a number', () => {
  it('computes a target from a duration', () => {
    expect(targetFor(START, 180)).toBe('2026-09-22T10:03:00.000Z');
  });

  it('reports what is left, read fresh from the clock', () => {
    expect(readTimer(targetFor(START, 180), 180, new Date('2026-09-22T10:01:00Z')).remaining).toBe(120);
  });

  it('survives backgrounding: the phone sleeps and the answer is still right', () => {
    // A decrementing counter would be wrong here — it stopped ticking when the
    // app went to the background. A target instant does not care.
    const afterSleep = readTimer(targetFor(START, 180), 180, new Date('2026-09-22T10:02:30Z'));
    expect(afterSleep.remaining).toBe(30);
    expect(afterSleep.elapsed).toBe(false);
  });

  it('is elapsed, not negative, once the target has passed', () => {
    const past = readTimer(targetFor(START, 180), 180, new Date('2026-09-22T10:10:00Z'));
    expect(past.remaining).toBe(0);
    expect(past.elapsed).toBe(true);
    expect(past.progress).toBe(1);
  });

  it('reports progress from 0 to 1', () => {
    expect(readTimer(targetFor(START, 180), 180, START).progress).toBe(0);
    expect(readTimer(targetFor(START, 180), 180, new Date('2026-09-22T10:01:30Z')).progress)
      .toBeCloseTo(0.5, 1);
  });

  it('treats a rest of 0 as "no timer" rather than an instant alarm', () => {
    expect(readTimer(targetFor(START, 0), 0, START)).toEqual({
      remaining: 0, elapsed: true, progress: 1,
    });
  });

  it('degrades on a malformed target instead of showing NaN', () => {
    expect(readTimer('not-an-instant', 180, START).remaining).toBe(0);
  });
});

describe('formatting', () => {
  it('reads as minutes and seconds', () => {
    expect(formatRest(180)).toBe('3:00');
    expect(formatRest(45)).toBe('0:45');
    expect(formatRest(605)).toBe('10:05');
  });

  it('never shows a negative rest', () => {
    expect(formatRest(-5)).toBe('0:00');
  });
});

describe('what a screen reader is told (a11y #5)', () => {
  // The label used to change every second, so the accessibility tree churned
  // once a second: uiautomator could never reach idle, and TalkBack had a node
  // re-describing itself continuously. It now moves in 15-second steps.
  it('rounds up to the next 15 seconds, in words', () => {
    expect(restAnnouncement(180, false)).toBe('3 minutes of rest left');
    expect(restAnnouncement(83, false)).toBe('1 minute 30 seconds of rest left');
    expect(restAnnouncement(45, false)).toBe('45 seconds of rest left');
    expect(restAnnouncement(10, false)).toBe('Less than 15 seconds of rest left');
  });

  it('is the same for every second inside one step', () => {
    const labels = new Set([76, 80, 85, 89, 90].map((s) => restAnnouncement(s, false)));
    expect(labels.size).toBe(1);
  });

  it('says when rest is over', () => {
    expect(restAnnouncement(0, true)).toBe('Rest complete');
  });
});
