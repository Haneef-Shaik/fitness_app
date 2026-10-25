import { localDate, timezone } from './models.ts';
import { localDateAt } from './calculations.ts';

/** Resolve a wall clock time in an IANA zone, refusing a nonexistent local date/time. */
export function instantAtLocalTime(date: string, zone: string, hour = 12, minute = 0): string {
  localDate.parse(date); timezone.parse(zone);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Invalid local time');
  const target = Date.parse(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`);
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  let guess = target;
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(formatter.formatToParts(guess).map((v) => [v.type, v.value]));
    const rendered = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`);
    if (rendered === target) return new Date(guess).toISOString();
    guess += target - rendered;
  }
  throw new Error('This local time does not exist. Choose another time.');
}
export function instantForDiaryDate(date: string, zone: string, draftTime: string): string {
  return localDateAt(draftTime, zone) === date ? draftTime : instantAtLocalTime(date, zone);
}
