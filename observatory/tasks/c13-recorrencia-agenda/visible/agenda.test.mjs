import { test } from 'node:test';
import assert from 'node:assert/strict';
import { between, firstN } from '../src/query.mjs';
import { parseRule, formatRule } from '../src/rrule.mjs';

test('regras comuns: semanal, mensal (último dia) e diária', () => {
  assert.deepEqual(between('FREQ=WEEKLY;BYDAY=MO,WE,FR', '2025-03-03', '2025-03-01', '2025-03-14'),
    ['2025-03-03', '2025-03-05', '2025-03-07', '2025-03-10', '2025-03-12', '2025-03-14']);
  assert.deepEqual(between('FREQ=MONTHLY;BYMONTHDAY=-1', '2025-01-10', '2025-01-01', '2025-06-30'),
    ['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30', '2025-05-31', '2025-06-30']);
  assert.deepEqual(between('FREQ=DAILY;INTERVAL=3;UNTIL=20250131', '2025-01-20', '2025-01-01', '2025-03-01'),
    ['2025-01-20', '2025-01-23', '2025-01-26', '2025-01-29']);
  assert.deepEqual(firstN('FREQ=MONTHLY;BYDAY=-1FR', '2025-01-01', 3), ['2025-01-31', '2025-02-28', '2025-03-28']);
  for (const t of ['FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=6', 'FREQ=MONTHLY;BYDAY=1MO,-1FR;UNTIL=20251231']) {
    assert.equal(formatRule(parseRule(t)), t);
  }
});

test('escala quinzenal iniciada num domingo', () => {
  assert.deepEqual(between('FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE', '2025-03-02', '2025-03-01', '2025-03-31'),
    ['2025-03-02', '2025-03-12', '2025-03-16', '2025-03-26', '2025-03-30']);
});
