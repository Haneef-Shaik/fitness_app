/**
 * How a session reads. Small functions, but two of them are where a timezone
 * bug would reappear after AC-03 closed it.
 */
import {
  daysBetween, formatDuration, formatSessionSummary, formatVolume, relativeDay,
} from '../format';

describe('volume', () => {
  it('rounds and separates thousands', () => {
    expect(formatVolume(8240.4)).toBe('8,240 kg');
  });

  it('shows nothing rather than "0 kg" when there is no volume', () => {
    // A session of bodyweight sets has no load. "0 kg" reads as a failed
    // workout; absence reads as "this metric does not apply".
    expect(formatVolume(0)).toBeNull();
    expect(formatVolume(null)).toBeNull();
    expect(formatVolume(undefined)).toBeNull();
  });
});

describe('duration', () => {
  it('stays in minutes below an hour', () => {
    expect(formatDuration(62 * 60)).toBe('62 min');
  });

  it('stays in minutes for any realistic session length', () => {
    // The wireframes write "62 min", not "1 h 2 min" — which is how anyone
    // describes a workout.
    expect(formatDuration(95 * 60)).toBe('95 min');
    expect(formatDuration(120 * 60)).toBe('120 min');
  });

  it('switches to hours only once the number stops being a workout', () => {
    // Past three hours it is likelier a session someone left open (PRD §7.6)
    // than a long one, and "260 min" reads as a glitch.
    expect(formatDuration(200 * 60)).toBe('3 h 20 min');
    expect(formatDuration(240 * 60)).toBe('4 h');
  });

  it('is absent for a session with no recorded duration', () => {
    expect(formatDuration(null)).toBeNull();
    expect(formatDuration(0)).toBeNull();
  });
});

describe('relative day', () => {
  it('names today and yesterday', () => {
    expect(relativeDay('2026-09-23', '2026-09-23')).toBe('Today');
    expect(relativeDay('2026-09-22', '2026-09-23')).toBe('Yesterday');
  });

  it('counts days inside the week', () => {
    expect(relativeDay('2026-09-18', '2026-09-23')).toBe('5 days ago');
  });

  it('counts calendar days, not 24-hour periods', () => {
    // The whole reason this takes two date STRINGS. Subtracting instants
    // reintroduces exactly the timezone error AC-03 exists to prevent: a
    // session at 23:40 and one at 00:10 are 30 minutes apart and are
    // different days, and the user thinks in days.
    expect(daysBetween('2026-09-21', '2026-09-22')).toBe(1);
    expect(daysBetween('2026-09-21', '2026-09-21')).toBe(0);
  });

  it('survives a month boundary', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1);
  });

  it('survives a DST change, because it never looks at the clock', () => {
    // 2026-11-01 is a 25-hour day in New York. As dates it is still one day.
    expect(daysBetween('2026-11-01', '2026-11-02')).toBe(1);
  });
});

describe('session summary', () => {
  const base = {
    local_date: '2026-09-18',
    total_volume_kg: 8240,
    duration_seconds: 62 * 60,
    set_count: 20,
    exercise_names: ['Barbell Bench Press', 'Overhead Press'],
  };

  it('names a session by its exercises', () => {
    expect(formatSessionSummary(base, '2026-09-23').title)
      .toBe('Barbell Bench Press & Overhead Press');
  });

  it('abbreviates once there are more than two', () => {
    const many = { ...base, exercise_names: ['A', 'B', 'C', 'D'] };
    expect(formatSessionSummary(many, '2026-09-23').title).toBe('A +3 more');
  });

  it('says so when a session held nothing', () => {
    const none = { ...base, exercise_names: [], set_count: 0 };
    expect(formatSessionSummary(none, '2026-09-23').title).toBe('Empty session');
  });

  it('drops metrics that do not apply instead of printing placeholders', () => {
    const bodyweight = { ...base, total_volume_kg: null, duration_seconds: null };
    expect(formatSessionSummary(bodyweight, '2026-09-23').headline).toBe('20 sets');
  });

  it('puts the count, time and volume in one line', () => {
    expect(formatSessionSummary(base, '2026-09-23').headline)
      .toBe('20 sets · 62 min · 8,240 kg');
  });

  it('singularises a single set', () => {
    expect(formatSessionSummary({ ...base, set_count: 1 }, '2026-09-23').headline)
      .toContain('1 set ·');
  });
});
