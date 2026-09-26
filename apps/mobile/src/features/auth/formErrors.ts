/**
 * Turning a failed request into what a form shows — the rule A-03 and A-04
 * already follow, in one place for A-05, A-06 and K-02.
 *
 * A server error that names a field goes under that field; one that names none
 * becomes the form's banner. Anything that is not an `ApiError` never reached
 * the server, and says so rather than guessing.
 */
import { ApiError } from '@/lib/api';
import { AuthProblem } from './supabaseAuth';

export interface FormErrors {
  fields: Record<string, string>;
  general: string | null;
}

export const OFFLINE_MESSAGE = 'Could not reach the server. Check your connection.';

export function formErrors(e: unknown): FormErrors {
  // Supabase Auth's problems (docs/14) already say which field they belong to.
  if (e instanceof AuthProblem) {
    return e.field ? { fields: { [e.field]: e.message }, general: null } : { fields: {}, general: e.message };
  }
  if (e instanceof ApiError) {
    const named = Object.keys(e.fields).length > 0;
    return { fields: e.fields, general: named ? null : e.message };
  }
  return { fields: {}, general: OFFLINE_MESSAGE };
}
