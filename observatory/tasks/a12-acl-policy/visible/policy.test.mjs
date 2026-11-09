import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from '../src/policy.mjs';

const policy = {
  name: 'docs',
  statements: [
    { id: 'leitura', effect: 'allow', principals: ['group:equipe'], actions: ['docs:Read'], resources: ['docs/**'] },
    { id: 'segredos', effect: 'deny', principals: ['*'], actions: ['docs:*'], resources: ['docs/**/segredo'] },
    { id: 'export', effect: 'allow', principals: ['group:equipe'], actions: ['relatorios:exportar*'], resources: ['relatorios/*'] },
  ],
};
const ana = { id: 'ana', groups: ['equipe'] };

test('allow with ** and case-insensitive action', () => {
  assert.deepEqual(
    evaluate(policy, { principal: ana, action: 'DOCS:read', resource: 'docs/2024/q1.md' }),
    { decision: 'allow', reason: 'allowed', matched: ['leitura'] },
  );
});

test('explicit deny beats allow', () => {
  assert.deepEqual(
    evaluate(policy, { principal: ana, action: 'docs:read', resource: 'docs/rh/segredo' }),
    { decision: 'deny', reason: 'explicit-deny', matched: ['segredos'] },
  );
});

test('allow on relatorios:exportar* covers exports', () => {
  const req = (action) => ({ principal: ana, action, resource: 'relatorios/2024' });
  assert.equal(evaluate(policy, req('relatorios:exportarCSV')).decision, 'allow');
  assert.equal(evaluate(policy, req('relatorios:exportar')).decision, 'allow');
});
