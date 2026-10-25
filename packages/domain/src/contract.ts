import { z } from 'zod';
import * as calculations from './calculations.ts';
import * as dates from './dates.ts';
import * as finance from './finance.ts';
import * as models from './models.ts';

/** Semver of the published contract (docs/architecture/003 §8). Changing any schema below needs a bump and a new snapshot. */
export const CONTRACT_VERSION = '0.1.0';

export type ContractJson = null | boolean | number | string | ContractJson[] | { [key: string]: ContractJson };
export interface ContractSnapshot { version: string; schemas: Record<string, ContractJson>; persisted: Record<string, ContractJson> }
type Schemas = Readonly<Record<string, z.ZodType>>;

const byKey = ([a]: [string, unknown], [b]: [string, unknown]) => (a < b ? -1 : a > b ? 1 : 0);
/** Discovered from the exports of every module index.ts re-exports, so a new exported schema joins the contract automatically. */
function exportedSchemas(modules: readonly object[]): Schemas {
  const entries = modules.flatMap((module) => Object.entries(module).filter((entry): entry is [string, z.ZodType] => entry[1] instanceof z.ZodType));
  const repeated = entries.filter(([key], i) => entries.findIndex(([other]) => other === key) !== i).map(([key]) => key);
  if (repeated.length) throw new Error(`Contract schema names must be unique: ${repeated.join(', ')}`);
  return Object.freeze(Object.fromEntries(entries.sort(byKey)));
}
export const contractSchemas = exportedSchemas([models, calculations, dates, finance]);
/** What Postgres validates in private.contracts, built exactly as scripts/backend/contracts.ts:6 builds it. */
export const persistedContracts: Schemas = Object.freeze({
  exercise: models.exerciseSchema, food: models.foodSchema, nutrients: models.nutrientsSchema, days: z.array(models.planDaySchema),
  instances: z.array(models.sessionInstanceSchema), set: models.performedSetSchema, measurements: models.bodyEntrySchema.shape.measurements, goal: models.goalSchema,
});

/** Keys sorted at every depth, so the text depends on the schemas and not on the order Zod emits them in. */
function canonical(value: unknown): ContractJson {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(byKey).map(([key, v]) => [key, canonical(v)]));
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) return value;
  throw new Error(`A contract snapshot cannot encode ${String(value)}`);
}
const render = (schemas: Schemas) => Object.fromEntries(Object.entries(schemas).sort(byKey)
  .map(([key, schema]) => [key, canonical(z.toJSONSchema(schema, { target: 'draft-7', unrepresentable: 'any' }))]));

/** Built on demand, so a client that imports the package pays nothing for it. JSON Schema cannot express `.refine()` predicates. */
export function contractSnapshot(): ContractSnapshot {
  return { version: CONTRACT_VERSION, schemas: render(contractSchemas), persisted: render(persistedContracts) };
}
/** The exact bytes of contracts/<version>.json, which contracts/manifest.json hashes. */
export function contractSnapshotJson(): string {
  return `${JSON.stringify(canonical(contractSnapshot()), null, 2)}\n`;
}
