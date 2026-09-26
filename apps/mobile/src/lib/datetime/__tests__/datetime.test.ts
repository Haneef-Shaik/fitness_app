import { formatClockTime, formatDayLabel, formatServerDate, hasTimeZoneSupport } from '../index';

describe('I7 — the client displays days, it never decides them', () => {
  it('formats an instant in the profile zone, not the device zone', () => {
    // 16:00 UTC on 22 Sep is 17:00 BST in London (still the 22nd) and 02:00 AEST
    // in Sydney (already the 23rd). Which day this belongs to is the PROFILE's
    // call, not the device's — that is what I7 means.
    const instant = new Date('2026-09-22T16:00:00Z');
    expect(formatDayLabel(instant, 'Australia/Sydney')).toMatch(/\b23\b/);
    expect(formatDayLabel(instant, 'Europe/London')).toMatch(/\b22\b/);
  });

  it('crosses a DST boundary without shifting the label', () => {
    // Europe/London leaves BST on 25 Oct 2026. 01:30 UTC is 01:30 GMT, same day.
    const instant = new Date('2026-10-25T01:30:00Z');
    expect(formatDayLabel(instant, 'Europe/London')).toMatch(/25 Oct/);
  });

  it('degrades to the device zone when the runtime cannot do zones', () => {
    // A Hermes build without Intl timezone data must cost a label, not the screen.
    const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementationOnce(() => {
      throw new RangeError('unsupported time zone');
    });
    expect(() => formatDayLabel(new Date('2026-09-22T12:00:00Z'), 'Australia/Sydney')).not.toThrow();
    spy.mockRestore();
  });

  it('degrades to an ISO date when it cannot format at all', () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new RangeError('no Intl');
    });
    expect(formatDayLabel(new Date('2026-09-22T12:00:00Z'), 'Europe/London')).toBe('2026-09-22');
    spy.mockRestore();
  });

  it('reports whether this runtime supports zones at all', () => {
    expect(typeof hasTimeZoneSupport()).toBe('boolean');
  });
});

describe("formatting the SERVER's local_date", () => {
  it('never shifts the date, whatever the device zone', () => {
    // The server already decided this is the 22nd. Re-deriving it is the bug.
    expect(formatServerDate('2026-09-22')).toMatch(/22 Sep/);
    expect(formatServerDate('2026-01-01')).toMatch(/1 Jan/);
    expect(formatServerDate('2026-12-31')).toMatch(/31 Dec/);
  });

  it('passes anything unparseable straight through', () => {
    expect(formatServerDate('not-a-date')).toBe('not-a-date');
    expect(formatServerDate('')).toBe('');
  });
});

describe('formatClockTime — a time of day in the profile zone', () => {
  // A 07:05 weigh-in in India used to read "01:35": the ISO string's UTC time,
  // sliced out (found on the store-screenshot account).
  const instant = new Date('2026-09-26T01:35:00Z');

  it('shows the wall clock of the profile zone, not UTC', () => {
    expect(formatClockTime(instant, 'Asia/Kolkata')).toBe('07:05');
    expect(formatClockTime(instant, 'UTC')).toBe('01:35');
  });

  it('degrades to a time rather than throwing on a zone it cannot use', () => {
    expect(formatClockTime(instant, 'Not/AZone')).toMatch(/^\d{2}:\d{2}$/);
    expect(formatClockTime(instant)).toMatch(/^\d{2}:\d{2}$/);
  });
});
