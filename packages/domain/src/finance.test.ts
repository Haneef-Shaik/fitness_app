import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accountBalance, parseRupees } from './finance.ts';
test('paise input never rounds a binary floating point currency value', () => {
  assert.equal(parseRupees('0.29'), 29); assert.equal(parseRupees('1000.01'), 100001);
  assert.throws(() => parseRupees('1.001')); assert.throws(() => parseRupees('-1')); assert.throws(() => parseRupees('1e3'));
});
test('PRD finance fixtures keep charges, collections, allocations and credit separate', () => {
  const c = (amount: number) => [{ id: 'c', amount, dueDate: '2026-10-01' }];
  const p = (amount: number) => [{ id: 'p', amount }];
  const a = (delta: number) => [{ paymentId: 'p', chargeId: 'c', delta }];
  const event = (amount: number, type: 'refund' | 'reversal', start = 0) => ({ paymentId: 'p', amount, type, start });
  assert.deepEqual(accountBalance(c(100000), p(40000), a(0), [event(40000, 'reversal')]), { charges: 100000, principal: 0, allocated: 0, due: 100000, credit: 0, net: 100000 });
  assert.equal(accountBalance(c(100000), p(100000), a(80000), [event(20000, 'refund')]).due, 20000);
  assert.deepEqual(accountBalance(c(80000), p(100000), a(80000), [event(20000, 'refund')]), { charges: 80000, principal: 80000, allocated: 80000, due: 0, credit: 0, net: 0 });
  assert.equal(accountBalance(c(100000), p(120000), a(100000), [event(15000, 'refund')]).credit, 5000);
  assert.equal(accountBalance(c(80000), p(100000), a(80000)).credit, 20000);
  assert.throws(() => accountBalance(c(100000), p(100000), a(60000), [event(20000, 'refund'), event(20000, 'reversal')]), /overlap/);
});
