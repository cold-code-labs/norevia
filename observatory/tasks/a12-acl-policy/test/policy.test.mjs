import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  matchSegment, matchAction, matchResource, matchPrincipal, testCondition,
  evaluate, evaluateAll, explain, validatePolicy, allowedActions,
} from '../src/policy.mjs';

const ana = { id: 'ana', groups: ['equipe', 'rh'] };

test('matchSegment: * matches zero or more characters, including at the end', () => {
  assert.equal(matchSegment('exportar*', 'exportar'), true);
  assert.equal(matchSegment('exportar*', 'exportarCSV'), true);
  assert.equal(matchSegment('*', ''), true);
  assert.equal(matchSegment('v**', 'v'), true);
  assert.equal(matchSegment('*x*', 'x'), true);
  assert.equal(matchSegment('a*b', 'ab'), true);
  assert.equal(matchSegment('a*b', 'ba'), false);
});

test('matchSegment: wildcard backtracking and literals', () => {
  assert.equal(matchSegment('app-*-prod', 'app-eu-west-prod'), true);
  assert.equal(matchSegment('app-*-prod', 'app--prod'), true);
  assert.equal(matchSegment('app-*-prod', 'app-prod'), false);
  assert.equal(matchSegment('*.pdf', 'relatorio.final.pdf'), true);
  assert.equal(matchSegment('*.pdf', 'pdf'), false);
  assert.equal(matchSegment('abc', 'abcd'), false);
});

test('segments: * matches exactly one segment (even empty); ** matches zero or more', () => {
  assert.equal(matchResource('a/*/c', 'a//c'), true);
  assert.equal(matchResource('a/*/c', 'a/b/x/c'), false);
  assert.equal(matchResource('a/*', 'a'), false);
  assert.equal(matchResource('docs/**', 'docs'), true);
  assert.equal(matchResource('a/**/b', 'a/b'), true);
  assert.equal(matchResource('a/**/b', 'a/x/y/b'), true);
  assert.equal(matchResource('**', ''), true);
  assert.equal(matchResource('a/**', 'b'), false);
});

test('case: actions ignore it, resources distinguish it', () => {
  assert.equal(matchAction('Docs:Read', 'docs:READ'), true);
  assert.equal(matchAction('docs:*', 'DOCS:Write'), true);
  assert.equal(matchResource('Docs/x', 'docs/x'), false);
  const p = { statements: [{ effect: 'allow', actions: ['*:*'], resources: ['Docs/**'] }] };
  assert.equal(evaluate(p, { principal: ana, action: 'a:b', resource: 'docs/x' }).reason, 'implicit-deny');
  assert.equal(evaluate(p, { principal: ana, action: 'a:b', resource: 'Docs/x' }).reason, 'allowed');
});

test('principals: omitted, *, user:, group: and empty list', () => {
  assert.equal(matchPrincipal(undefined, null), true);
  assert.equal(matchPrincipal(['*'], null), false);
  assert.equal(matchPrincipal(['*'], { id: 'x' }), true);
  assert.equal(matchPrincipal(['user:Ana'], ana), false);
  assert.equal(matchPrincipal(['user:bob', 'group:rh'], ana), true);
  assert.equal(matchPrincipal([], ana), false);
  const p = { statements: [{ effect: 'allow', actions: ['x:y'] }] };
  assert.equal(evaluate(p, { principal: undefined, action: 'x:y', resource: 'qualquer/coisa' }).decision, 'allow');
});

test('conditions: absent key is false for any operator', () => {
  assert.equal(testCondition({ key: 'ip', op: 'ne', value: '1.2.3.4' }, {}), false);
  assert.equal(testCondition({ key: 'ip', op: 'notIn', value: ['1.2.3.4'] }, { ip: undefined }), false);
  assert.equal(testCondition({ key: 'toString', op: 'ne', value: 'x' }, {}), false);
  assert.equal(testCondition({ key: 'ip', op: 'ne', value: '1.2.3.4' }, { ip: '9.9.9.9' }), true);
  assert.equal(testCondition({ key: 'tier', op: 'in', value: ['ouro', 'prata'] }, { tier: 'prata' }), true);
  assert.equal(testCondition({ key: 'tier', op: 'in', value: 'prata' }, { tier: 'prata' }), false);
  assert.equal(testCondition({ key: 'n', op: 'eq', value: 1 }, { n: '1' }), false);
  assert.equal(testCondition({ key: 'v', op: 'eq', value: null }, { v: null }), true);
});

test('numeric conditions and between with exclusive bounds', () => {
  assert.equal(testCondition({ key: 'h', op: 'lt', value: 10 }, { h: '5' }), false);
  assert.equal(testCondition({ key: 'h', op: 'lte', value: 10 }, { h: 10 }), true);
  assert.equal(testCondition({ key: 'h', op: 'gt', value: 10 }, { h: 10 }), false);
  assert.equal(testCondition({ key: 'h', op: 'gte', value: 10 }, { h: NaN }), false);
  const b = (h, v) => testCondition({ key: 'h', op: 'between', value: v }, { h });
  assert.equal(b(8, { min: 8, max: 18 }), true);
  assert.equal(b(18, { min: 8, max: 18 }), true);
  assert.equal(b(8, { min: 8, max: 18, exclusiveMin: true }), false);
  assert.equal(b(18, { min: 8, max: 18, exclusiveMax: true }), false);
  assert.equal(b(17.5, { min: 8, max: 18, exclusiveMax: true }), true);
  assert.equal(testCondition({ key: 'p', op: 'prefix', value: '10.' }, { p: '10.0.0.1' }), true);
  assert.equal(testCondition({ key: 'p', op: 'prefix', value: '1' }, { p: 10 }), false);
});

test('notActions: applies to actions that match no pattern', () => {
  const p = {
    statements: [
      { id: 'tudo', effect: 'allow', principals: ['*'], actions: ['*:*'] },
      { id: 'so-iam', effect: 'deny', principals: ['group:rh'], notActions: ['iam:*'], resources: ['contas/**'] },
    ],
  };
  assert.deepEqual(evaluate(p, { principal: ana, action: 'IAM:CreateUser', resource: 'contas/1' }),
    { decision: 'allow', reason: 'allowed', matched: ['tudo'] });
  assert.deepEqual(evaluate(p, { principal: ana, action: 's3:get', resource: 'contas/1' }),
    { decision: 'deny', reason: 'explicit-deny', matched: ['so-iam'] });
});

test('matched: only statements of the deciding effect, in policy order, default ids #i', () => {
  const p = {
    statements: [
      { effect: 'allow', actions: ['x:*'] },
      { id: 'd1', effect: 'deny', actions: ['x:y'], conditions: [{ key: 'mfa', op: 'eq', value: false }] },
      { id: '', effect: 'allow', actions: ['*:y'] },
      { effect: 'deny', actions: ['x:**'] },
    ],
  };
  assert.deepEqual(evaluate(p, { principal: ana, action: 'x:y', resource: 'r', context: { mfa: false } }),
    { decision: 'deny', reason: 'explicit-deny', matched: ['d1', '#3'] });
  const q = { statements: p.statements.slice(0, 3) };
  assert.deepEqual(evaluate(q, { principal: ana, action: 'x:y', resource: 'r', context: { mfa: true } }),
    { decision: 'allow', reason: 'allowed', matched: ['#0', '#2'] });
  assert.deepEqual(evaluate(q, { principal: ana, action: 'z:w', resource: 'r' }),
    { decision: 'deny', reason: 'implicit-deny', matched: [] });
});

test('explain: first check that failed, in the order principal→action→resource→conditions', () => {
  const p = {
    statements: [
      { id: 'a', effect: 'allow', principals: ['user:bob'], actions: ['nada:*'] },
      { id: 'b', effect: 'deny', actions: ['nada:*'], resources: ['outro/*'] },
      { id: 'c', effect: 'allow', actions: ['doc:ler'], resources: ['outro/*'] },
      { id: 'd', effect: 'allow', actions: ['doc:ler'], conditions: [{ key: 'h', op: 'gte', value: 8 }, { key: 'h', op: 'lt', value: 9 }] },
      { effect: 'allow', notActions: ['doc:escrever'], resources: ['docs/*'] },
    ],
  };
  assert.deepEqual(explain(p, { principal: ana, action: 'doc:ler', resource: 'docs/1', context: { h: 12 } }), [
    { id: 'a', effect: 'allow', applies: false, failed: 'principal' },
    { id: 'b', effect: 'deny', applies: false, failed: 'action' },
    { id: 'c', effect: 'allow', applies: false, failed: 'resource' },
    { id: 'd', effect: 'allow', applies: false, failed: 'condition:1' },
    { id: '#4', effect: 'allow', applies: true, failed: null },
  ]);
});

test('validatePolicy and evaluate errors', () => {
  assert.deepEqual(validatePolicy({}), ['statements deve ser um array']);
  assert.deepEqual(validatePolicy({ statements: [
    { id: 'x', effect: 'permit', actions: ['a:b'] },
    { id: 'x', effect: 'allow', actions: ['a:b'], notActions: [] },
    null,
    { effect: 'deny', resources: 'docs/*', actions: ['a:b'], conditions: [{ key: 'k', op: 'regex', value: '.' }] },
  ] }), [
    '#0: effect inválido',
    '#1: use exatamente um de actions/notActions',
    '#1: id duplicado "x"',
    '#2: instrução inválida',
    '#3: resources deve ser um array de strings',
    '#3: operador desconhecido "regex"',
  ]);
  assert.throws(() => evaluate({ statements: [{ effect: 'allow' }] }, { action: 'a:b', resource: 'r' }),
    { name: 'TypeError', message: '#0: use exatamente um de actions/notActions' });
  assert.throws(() => evaluate({ statements: [] }, { action: 'a:b' }), { name: 'TypeError', message: 'requisição inválida' });
});

test('evaluateAll: deny-overrides across policies and prefixes', () => {
  const p1 = { name: 'base', statements: [{ id: 'ler', effect: 'allow', actions: ['doc:*'] }] };
  const p2 = { statements: [{ effect: 'deny', actions: ['doc:apagar'] }, { id: 'ok', effect: 'allow', actions: ['doc:ler'] }] };
  assert.deepEqual(evaluateAll([p1, p2], { principal: ana, action: 'doc:ler', resource: 'r' }),
    { decision: 'allow', reason: 'allowed', matched: ['base/ler', '#1/ok'] });
  assert.deepEqual(evaluateAll([p1, p2], { principal: ana, action: 'doc:apagar', resource: 'r' }),
    { decision: 'deny', reason: 'explicit-deny', matched: ['#1/#0'] });
  assert.deepEqual(evaluateAll([], { principal: ana, action: 'doc:ler', resource: 'r' }),
    { decision: 'deny', reason: 'implicit-deny', matched: [] });
});

test('allowedActions: input order, no repetition ignoring case', () => {
  const p = {
    statements: [
      { effect: 'allow', principals: ['group:equipe'], actions: ['rel:exportar*', 'rel:ver'] },
      { effect: 'deny', actions: ['rel:exportarTudo'] },
    ],
  };
  const req = { principal: ana, resource: 'rel/1' };
  assert.deepEqual(
    allowedActions(p, req, ['rel:Ver', 'rel:exportar', 'REL:ver', 'rel:exportartudo', 'rel:apagar', 'rel:exportarPDF']),
    ['rel:Ver', 'rel:exportar', 'rel:exportarPDF'],
  );
});
