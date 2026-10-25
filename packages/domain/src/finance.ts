import { z } from 'zod';

export const paise = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
/** Decimal input is parsed as a string so ₹0.29 is exactly 29 paise. */
export function parseRupees(value: string): number {
  const match = /^(0|[1-9]\d{0,10})(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) throw new Error('Enter a nonnegative INR amount with at most two decimal places');
  return paise.parse(Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0')));
}
export interface FinanceCharge { id: string; amount: number; dueDate: string }
export interface FinancePayment { id: string; amount: number }
export interface FinanceAllocation { paymentId: string; chargeId: string; delta: number }
export interface PrincipalEvent { paymentId: string; start: number; amount: number; type: 'refund' | 'reversal' }
export function accountBalance(charges: FinanceCharge[], payments: FinancePayment[], allocations: FinanceAllocation[], corrections: PrincipalEvent[] = []) {
  for (const c of charges) paise.parse(c.amount);
  for (const p of payments) paise.parse(p.amount);
  const charge = charges.reduce((a, c) => a + c.amount, 0);
  const principal = payments.reduce((a, p) => a + p.amount, 0) - corrections.reduce((a, e) => a + e.amount, 0);
  const allocated = allocations.reduce((a, e) => a + e.delta, 0);
  for (const p of payments) {
    const events = corrections.filter((e) => e.paymentId === p.id).sort((a, b) => a.start - b.start);
    for (let i = 0; i < events.length; i++) {
      const e = events[i]!; paise.parse(e.start); paise.parse(e.amount);
      if (e.amount === 0 || e.start + e.amount > p.amount || (i > 0 && events[i - 1]!.start + events[i - 1]!.amount > e.start)) throw new Error('Principal portions overlap or exceed the payment');
    }
    const used = allocations.filter((a) => a.paymentId === p.id).reduce((a, e) => a + e.delta, 0);
    if (used < 0 || used > p.amount - events.reduce((a, e) => a + e.amount, 0)) throw new Error('Invalid payment allocation');
  }
  for (const c of charges) {
    const used = allocations.filter((a) => a.chargeId === c.id).reduce((a, e) => a + e.delta, 0);
    if (used < 0 || used > c.amount) throw new Error('Invalid charge allocation');
  }
  if (allocations.some((a) => !charges.some((c) => c.id === a.chargeId) || !payments.some((p) => p.id === a.paymentId)) || corrections.some((e) => !payments.some((p) => p.id === e.paymentId))) throw new Error('Unknown ledger reference');
  return { charges: charge, principal, allocated, due: charge - allocated, credit: principal - allocated, net: charge - principal };
}
