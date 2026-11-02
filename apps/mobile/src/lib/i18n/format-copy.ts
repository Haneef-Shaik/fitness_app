/**
 * Catalog copy used by the formatters: unit symbols, the templates that place a number next to its
 * unit, and day periods. Spread into en.ts and hi.ts so the parity test covers it.
 * Hindi unit symbols follow the house style already in the catalog ('कमर (सेमी)'); the qualified
 * reviewer in G14.hi confirms them.
 */
export const formatCopyEn = {
  measureValue: '{value} {unit}',
  labelWithUnit: '{label} ({unit})',
  unitKg: 'kg',
  unitLb: 'lb',
  unitG: 'g',
  unitCm: 'cm',
  unitIn: 'in',
  unitM: 'm',
  unitKm: 'km',
  unitMi: 'mi',
  unitKcal: 'kcal',
  unitSeconds: 's',
  unitMinutes: 'min',
  unitKgReps: 'kg·reps',
  timeAm: 'am',
  timePm: 'pm',
  e1rmFormula: 'Epley e1RM v1',
} as const;

export const formatCopyHi = {
  measureValue: '{value} {unit}',
  labelWithUnit: '{label} ({unit})',
  unitKg: 'किग्रा',
  unitLb: 'पाउंड',
  unitG: 'ग्रा',
  unitCm: 'सेमी',
  unitIn: 'इंच',
  unitM: 'मी',
  unitKm: 'किमी',
  unitMi: 'मील',
  unitKcal: 'कैलोरी',
  unitSeconds: 'सेकंड',
  unitMinutes: 'मिनट',
  unitKgReps: 'किग्रा·रेप्स',
  timeAm: 'am',
  timePm: 'pm',
  e1rmFormula: 'एप्ली e1RM v1',
} as const satisfies Record<keyof typeof formatCopyEn, string>;
