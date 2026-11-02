import {
  CM_PER_INCH, KG_PER_LB, formatCount, formatDate, formatDateTime, formatLength, formatMeasure, formatMoney,
  formatNumber, formatTime, formatWeight, labelWithUnit, pluralCategory, setCurrentLocale, unitLabel, weekdayName, withUnit,
} from '..';

const locales = ['en', 'hi'] as const;

afterEach(() => setCurrentLocale(undefined));

describe('numbers in en-IN and hi-IN', () => {
  it.each(locales)('%s groups digits the Indian way and keeps Latin digits', (locale) => {
    expect(formatNumber(0, {}, locale)).toBe('0');
    expect(formatNumber(999, {}, locale)).toBe('999');
    expect(formatNumber(1000, {}, locale)).toBe('1,000');
    expect(formatNumber(12345, {}, locale)).toBe('12,345');
    expect(formatNumber(100000, {}, locale)).toBe('1,00,000');
    expect(formatNumber(1234567, {}, locale)).toBe('12,34,567');
    expect(formatNumber(10000000, {}, locale)).toBe('1,00,00,000');
    expect(formatNumber(-1234.5, {}, locale)).toBe('-1,234.5');
  });

  it('rounds for display only, half away from zero on the decimal value', () => {
    expect(formatNumber(1.005, { maximumFractionDigits: 2 }, 'en')).toBe('1.01');
    expect(formatNumber(82.5, {}, 'en')).toBe('82.5');
    expect(formatNumber(82.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, 'en')).toBe('82.50');
    expect(formatNumber(2.5, { maximumFractionDigits: 0 }, 'en')).toBe('3');
    expect(formatNumber(-2.5, { maximumFractionDigits: 0 }, 'en')).toBe('-3');
    expect(formatNumber(-0.001, {}, 'en')).toBe('0');
  });

  it('agrees with the CLDR grouping the platform ships', () => {
    for (const value of [1000, 100000, 1234567.25]) {
      expect(formatNumber(value, {}, 'en')).toBe(new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value));
      expect(formatNumber(value, {}, 'hi')).toBe(new Intl.NumberFormat('hi-IN', { maximumFractionDigits: 2 }).format(value));
    }
  });

  it('refuses values it cannot show honestly', () => {
    expect(() => formatNumber(Number.NaN, {}, 'en')).toThrow(RangeError);
    expect(() => formatNumber(Number.POSITIVE_INFINITY, {}, 'en')).toThrow(RangeError);
    expect(() => formatNumber(1, { maximumFractionDigits: 7 }, 'en')).toThrow(RangeError);
    expect(() => formatNumber(1, { minimumFractionDigits: 3, maximumFractionDigits: 2 }, 'en')).toThrow(RangeError);
  });

  it('uses the current language when none is passed', () => {
    setCurrentLocale('hi');
    expect(formatMeasure(82.5, 'kg')).toBe('82.5 किग्रा');
    setCurrentLocale('en');
    expect(formatMeasure(82.5, 'kg')).toBe('82.5 kg');
  });
});

describe('money in integer paise', () => {
  it.each(locales)('%s shows ₹1,00,000 with Indian grouping', (locale) => {
    expect(formatMoney(10_000_000, {}, locale)).toBe('₹1,00,000.00');
    expect(formatMoney(10_000_000, { wholeUnits: true }, locale)).toBe('₹1,00,000');
    expect(formatMoney(10_000_050, { wholeUnits: true }, locale)).toBe('₹1,00,000.50');
    expect(formatMoney(29, {}, locale)).toBe('₹0.29');
    expect(formatMoney(0, {}, locale)).toBe('₹0.00');
    expect(formatMoney(123_456_789, {}, locale)).toBe('₹12,34,567.89');
    expect(formatMoney(-50_000, {}, locale)).toBe('-₹500.00');
  });

  it('agrees with CLDR currency formatting for INR', () => {
    expect(formatMoney(10_000_000, {}, 'en')).toBe(new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(100000));
    expect(formatMoney(10_000_000, {}, 'hi')).toBe(new Intl.NumberFormat('hi-IN', { style: 'currency', currency: 'INR' }).format(100000));
  });

  it('rejects fractional or unsafe amounts instead of rounding money', () => {
    expect(() => formatMoney(1.5, {}, 'en')).toThrow(RangeError);
    expect(() => formatMoney(Number.MAX_SAFE_INTEGER + 1, {}, 'en')).toThrow(RangeError);
  });
});

describe('calendar dates', () => {
  it('formats a local date in English', () => {
    expect(formatDate('2026-10-27', 'numeric', 'en')).toBe('27/10/2026');
    expect(formatDate('2026-01-05', 'numeric', 'en')).toBe('05/01/2026');
    expect(formatDate('2026-10-27', 'medium', 'en')).toBe('27 Oct 2026');
    expect(formatDate('2026-10-27', 'long', 'en')).toBe('27 October 2026');
    expect(formatDate('2026-10-27', 'full', 'en')).toBe('Tuesday, 27 October 2026');
    expect(formatDate('2026-10-27', 'dayMonth', 'en')).toBe('27 Oct');
    expect(formatDate('2026-10-27', 'weekdayDayMonth', 'en')).toBe('Tuesday, 27 October');
    expect(formatDate('2026-10-27', undefined, 'en')).toBe('27 Oct 2026');
  });

  it('formats the same dates in Hindi', () => {
    expect(formatDate('2026-10-27', 'numeric', 'hi')).toBe('27/10/2026');
    expect(formatDate('2026-10-27', 'medium', 'hi')).toBe('27 अक्तू॰ 2026');
    expect(formatDate('2026-10-27', 'long', 'hi')).toBe('27 अक्तूबर 2026');
    expect(formatDate('2026-10-27', 'full', 'hi')).toBe('मंगलवार, 27 अक्तूबर 2026');
    expect(formatDate('2026-03-01', 'medium', 'hi')).toBe('1 मार्च 2026');
  });

  it('names weekdays in both languages', () => {
    expect(weekdayName('2026-10-25', 'long', 'en')).toBe('Sunday');
    expect(weekdayName('2026-10-25', 'short', 'hi')).toBe('रवि');
    expect(weekdayName('2026-10-26', 'narrow', 'en')).toBe('M');
    expect(weekdayName('2026-10-26', 'narrow', 'hi')).toBe('सो');
  });

  it('handles leap days and refuses dates that do not exist', () => {
    expect(formatDate('2028-02-29', 'medium', 'en')).toBe('29 Feb 2028');
    expect(() => formatDate('2026-02-29', 'medium', 'en')).toThrow(RangeError);
    expect(() => formatDate('27/10/2026', 'medium', 'en')).toThrow(RangeError);
  });
});

describe('times in the record time zone', () => {
  it('shows a 12-hour wall clock in the given IANA zone', () => {
    expect(formatTime('2026-10-27T13:35:00Z', 'Asia/Kolkata', 'en')).toBe('7:05 pm');
    expect(formatTime('2026-10-27T13:35:00Z', 'Asia/Kolkata', 'hi')).toBe('7:05 pm');
    expect(formatTime('2026-10-26T18:30:00Z', 'Asia/Kolkata', 'en')).toBe('12:00 am');
    expect(formatTime('2026-10-27T06:30:00Z', 'Asia/Kolkata', 'en')).toBe('12:00 pm');
  });

  it('places an instant on the local date of its zone', () => {
    expect(formatDateTime('2026-10-27T19:00:00Z', 'Asia/Kolkata', 'en')).toBe('28 Oct 2026, 12:30 am');
    expect(formatDateTime('2026-10-27T19:00:00Z', 'UTC', 'en')).toBe('27 Oct 2026, 7:00 pm');
    expect(formatDateTime('2026-10-27T19:00:00Z', 'Asia/Kolkata', 'hi')).toBe('28 अक्तू॰ 2026, 12:30 am');
  });

  it('rejects an invalid instant', () => {
    expect(() => formatTime('not a time', 'Asia/Kolkata', 'en')).toThrow(RangeError);
  });
});

describe('plurals', () => {
  it('follows the CLDR one/other rules for English and Hindi', () => {
    for (const count of [0, 1, 2, 5, 0.5, 1.5, 21, 100]) {
      expect(pluralCategory(count, 'en')).toBe(new Intl.PluralRules('en').select(count));
      expect(pluralCategory(count, 'hi')).toBe(new Intl.PluralRules('hi').select(count));
    }
    expect(pluralCategory(0, 'hi')).toBe('one');
    expect(pluralCategory(0, 'en')).toBe('other');
  });

  it('formats counted nouns with grouped numbers', () => {
    expect(formatCount('setCount', 1, 'en')).toBe('1 set');
    expect(formatCount('setCount', 0, 'en')).toBe('0 sets');
    expect(formatCount('setCount', 2, 'en')).toBe('2 sets');
    expect(formatCount('memberCount', 100000, 'en')).toBe('1,00,000 members');
    expect(formatCount('receiptCount', 0, 'hi')).toBe('0 रसीद');
    expect(formatCount('receiptCount', 1, 'hi')).toBe('1 रसीद');
    expect(formatCount('receiptCount', 2, 'hi')).toBe('2 रसीदें');
  });
});

describe('units', () => {
  it('formats canonical measures with the PRD §4.2 display precision', () => {
    expect(formatMeasure(82.5, 'kg', 'en')).toBe('82.5 kg');
    expect(formatMeasure(102.456, 'kg', 'en')).toBe('102.46 kg');
    expect(formatMeasure(25.25, 'g', 'en')).toBe('25.3 g');
    expect(formatMeasure(1234.5, 'kcal', 'en')).toBe('1,235 kcal');
    expect(formatMeasure(12345.5, 'kgReps', 'en')).toBe('12,345.5 kg·reps');
    expect(formatMeasure(90, 's', 'en')).toBe('90 s');
    expect(formatMeasure(null, 'kg', 'en')).toBe('—');
  });

  it('formats the same measures in Hindi', () => {
    expect(formatMeasure(82.5, 'kg', 'hi')).toBe('82.5 किग्रा');
    expect(formatMeasure(1234.5, 'kcal', 'hi')).toBe('1,235 कैलोरी');
    expect(formatMeasure(45, 'min', 'hi')).toBe('45 मिनट');
    expect(unitLabel('cm', 'hi')).toBe('सेमी');
    expect(labelWithUnit('वज़न', 'kg', 'hi')).toBe('वज़न (किग्रा)');
  });

  it('labels inputs and value lists with a unit', () => {
    expect(labelWithUnit('Weight', 'kg', 'en')).toBe('Weight (kg)');
    expect(withUnit('25 + 20', 'kg', 'en')).toBe('25 + 20 kg');
  });

  it('converts from canonical kg and cm with the PRD factors before display', () => {
    expect(KG_PER_LB).toBe(0.45359237);
    expect(CM_PER_INCH).toBe(2.54);
    expect(formatWeight(100, 'lb', 'en')).toBe('220.46 lb');
    expect(formatWeight(100, 'kg', 'hi')).toBe('100 किग्रा');
    expect(formatWeight(null, 'kg', 'en')).toBe('—');
    expect(formatLength(80, 'in', 'en')).toBe('31.5 in');
    expect(formatLength(80, 'cm', 'hi')).toBe('80 सेमी');
  });
});
