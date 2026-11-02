/**
 * Counted nouns. English and Hindi both use the CLDR categories one and other; Hindi puts 0 in one.
 * Every form carries {count}, which the formatter fills with an Indian-grouped number.
 */
export interface PluralForms {
  readonly one: string;
  readonly other: string;
}

export const pluralsEn = {
  setCount: { one: '{count} set', other: '{count} sets' },
  workingSetCount: { one: '{count} working set', other: '{count} working sets' },
  exerciseCount: { one: '{count} exercise', other: '{count} exercises' },
  sessionCount: { one: '{count} session', other: '{count} sessions' },
  measurementCount: { one: '{count} measurement', other: '{count} measurements' },
  dayCount: { one: '{count} day', other: '{count} days' },
  memberCount: { one: '{count} member', other: '{count} members' },
  receiptCount: { one: '{count} receipt', other: '{count} receipts' },
  goalCount: { one: '{count} goal', other: '{count} goals' },
} as const satisfies Record<string, PluralForms>;

export type PluralKey = keyof typeof pluralsEn;

export const pluralsHi = {
  setCount: { one: '{count} सेट', other: '{count} सेट' },
  workingSetCount: { one: '{count} वर्किंग सेट', other: '{count} वर्किंग सेट' },
  exerciseCount: { one: '{count} व्यायाम', other: '{count} व्यायाम' },
  sessionCount: { one: '{count} सेशन', other: '{count} सेशन' },
  measurementCount: { one: '{count} माप', other: '{count} माप' },
  dayCount: { one: '{count} दिन', other: '{count} दिन' },
  memberCount: { one: '{count} सदस्य', other: '{count} सदस्य' },
  receiptCount: { one: '{count} रसीद', other: '{count} रसीदें' },
  goalCount: { one: '{count} लक्ष्य', other: '{count} लक्ष्य' },
} as const satisfies Record<PluralKey, PluralForms>;
