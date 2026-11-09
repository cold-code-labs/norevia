import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parse, valid, compare, bump, sort, parseRange, formatRange, satisfies, maxSatisfying, minSatisfying,
} from '../src/semver.mjs';

test('parse: valid versions and fields', () => {
  assert.deepEqual(parse('v1.2.3-alpha.1+build.5'), {
    major: 1, minor: 2, patch: 3, prerelease: ['alpha', 1], build: ['build', '5'], version: '1.2.3-alpha.1',
  });
  assert.equal(parse('  1.2.3  ').version, '1.2.3');
  assert.deepEqual(parse('1.2.3+001').build, ['001']);
  assert.deepEqual(parse('1.2.3-0a.x-y').prerelease, ['0a', 'x-y']);
  assert.equal(valid('v0.0.1+meta'), '0.0.1');
});

test('parse: invalid inputs return null', () => {
  for (const s of ['01.2.3', '1.02.3', '1.2.3-01', '1.2', '1.2.3-alpha..1', '1.2.3+', '1.2.3-', 'a.b.c', '']) {
    assert.equal(parse(s), null, s);
  }
  assert.equal(parse(123), null);
  assert.equal(valid('1.2.x'), null);
});

test('compare: precedence and ignored build', () => {
  assert.equal(compare('1.10.0', '1.9.0'), 1);
  assert.equal(compare('1.0.0-1', '1.0.0-alpha'), -1);
  assert.equal(compare('1.0.0-alpha', '1.0.0-alpha.0'), -1);
  assert.equal(compare('1.0.0-beta.11', '1.0.0-beta.2'), 1);
  assert.equal(compare('1.0.0-rc.1', '1.0.0'), -1);
  assert.equal(compare('1.0.0+a', 'v1.0.0+b'), 0);
  assert.equal(compare('1.0.0-B', '1.0.0-a'), -1);
  assert.throws(() => compare('1.0', '1.0.0'), TypeError);
});

test('sort: stable, without mutating the input, invalid throws', () => {
  const input = ['1.0.0+b', 'v1.0.0', '0.9.0', '1.0.0+a'];
  const copy = input.slice();
  assert.deepEqual(sort(input), ['0.9.0', '1.0.0+b', 'v1.0.0', '1.0.0+a']);
  assert.deepEqual(input, copy);
  assert.throws(() => sort(['1.0.0', 'nope']), TypeError);
});

test('bump', () => {
  assert.equal(bump('1.2.3', 'major'), '2.0.0');
  assert.equal(bump('2.0.0-rc.1', 'major'), '2.0.0');
  assert.equal(bump('2.1.0-rc.1', 'major'), '3.0.0');
  assert.equal(bump('1.2.0-beta', 'minor'), '1.2.0');
  assert.equal(bump('1.2.3-beta', 'minor'), '1.3.0');
  assert.equal(bump('1.2.3-beta', 'patch'), '1.2.3');
  assert.equal(bump('1.2.3+build', 'patch'), '1.2.4');
  assert.equal(bump('1.2.3', 'prerelease'), '1.2.4-0');
  assert.equal(bump('1.2.3-alpha.1', 'prerelease'), '1.2.3-alpha.2');
  assert.equal(bump('1.2.3-alpha', 'prerelease'), '1.2.3-alpha.0');
  assert.throws(() => bump('1.2.3', 'build'), RangeError);
});

test('formatRange: caret and tilde, including 0.x', () => {
  assert.equal(formatRange('^0.2.3'), '>=0.2.3 <0.3.0');
  assert.equal(formatRange('^0.0.3'), '>=0.0.3 <0.0.4');
  assert.equal(formatRange('^0.0'), '>=0.0.0 <0.1.0');
  assert.equal(formatRange('^0.0.x'), '>=0.0.0 <0.1.0');
  assert.equal(formatRange('^0.x'), '>=0.0.0 <1.0.0');
  assert.equal(formatRange('^1.2.3-beta.2'), '>=1.2.3-beta.2 <2.0.0');
  assert.equal(formatRange('~1'), '>=1.0.0 <2.0.0');
  assert.equal(formatRange('~1.2.3-beta.2'), '>=1.2.3-beta.2 <1.3.0');
  assert.equal(formatRange('^*'), '>=0.0.0');
});

test('formatRange: x-ranges and comparators with partial versions', () => {
  assert.equal(formatRange('1.x'), '>=1.0.0 <2.0.0');
  assert.equal(formatRange('1.2.*'), '>=1.2.0 <1.3.0');
  assert.equal(formatRange(''), '>=0.0.0');
  assert.equal(formatRange('*'), '>=0.0.0');
  assert.equal(formatRange('1.2.3'), '=1.2.3');
  assert.equal(formatRange('>1.2'), '>=1.3.0');
  assert.equal(formatRange('>1'), '>=2.0.0');
  assert.equal(formatRange('<=1.2'), '<1.3.0');
  assert.equal(formatRange('<1.2'), '<1.2.0');
  assert.equal(formatRange('>=1'), '>=1.0.0');
  assert.equal(formatRange('>*'), '<0.0.0');
  assert.equal(formatRange('> 1.2.3 < 2'), '>1.2.3 <2.0.0');
});

test('formatRange: hyphen with partials and unions', () => {
  assert.equal(formatRange('1.2 - 2.3'), '>=1.2.0 <2.4.0');
  assert.equal(formatRange('1.2.3 - 2'), '>=1.2.3 <3.0.0');
  assert.equal(formatRange('1 - *'), '>=1.0.0');
  assert.equal(formatRange('^1.2 || ~0.4.1'), '>=1.2.0 <2.0.0 || >=0.4.1 <0.5.0');
});

test('parseRange: errors', () => {
  assert.throws(() => parseRange(42), TypeError);
  for (const r of ['1.x.3', '>=', '1.2.x-beta', '^1.2.3.4', '~a']) {
    assert.throws(() => parseRange(r), SyntaxError, r);
  }
});

test('satisfies: stable versions', () => {
  assert.equal(satisfies('1.2.3', '^1.2.3'), true);
  assert.equal(satisfies('2.0.0', '^1.2.3'), false);
  assert.equal(satisfies('0.3.0', '^0.2.3'), false);
  assert.equal(satisfies('2.3.4', '1.2.3 - 2.3.4'), true);
  assert.equal(satisfies('2.3.9', '1.2.3 - 2.3'), true);
  assert.equal(satisfies('2.4.0', '1.2.3 - 2.3'), false);
  assert.equal(satisfies('1.2.3+build', '=1.2.3'), true);
  assert.equal(satisfies('5.0.0', '<1 || >=5'), true);
  assert.equal(satisfies('not-a-version', '*'), false);
});

test('satisfies: prerelease requires a comparator with the same tuple and a prerelease', () => {
  assert.equal(satisfies('1.2.3-beta.2', '>=1.2.3-beta.1 <1.3.0'), true);
  assert.equal(satisfies('1.2.4-alpha', '>=1.2.3-beta <2'), false);
  assert.equal(satisfies('2.0.0-rc.1', '^1.2.3'), false);
  assert.equal(satisfies('1.2.4-beta', '1.2.3 - 1.2.4'), false);
  assert.equal(satisfies('3.0.0-beta', '<=3.0.0'), false);
  assert.equal(satisfies('0.0.0-alpha', '*'), false);
  assert.equal(satisfies('1.0.0-rc.1', '<1.0.0'), false);
  assert.equal(satisfies('1.0.0-rc.1', '>=1.0.0-beta'), true);
});

test('satisfies: prerelease rule evaluated per set', () => {
  assert.equal(satisfies('1.3.0-beta', '<1.0.0 || >=1.3.0-alpha <1.4.0'), true);
  assert.equal(satisfies('1.3.0-beta', '>=1.3.0-alpha <1.3.0-alpha.1 || >=1.2.0 <1.4.0'), false);
});

test('maxSatisfying/minSatisfying: ties, invalid ones and prereleases', () => {
  assert.equal(maxSatisfying(['1.2.3+b', 'junk', 'v1.2.3', '1.2.0'], '~1.2'), '1.2.3+b');
  assert.equal(minSatisfying(['1.2.3', '1.2.0+x', '1.2.0'], '1.2.x'), '1.2.0+x');
  assert.equal(maxSatisfying(['1.0.0', '1.1.0'], '^2'), null);
  assert.equal(maxSatisfying(['1.2.3', '1.2.4-beta', '1.2.4-rc.1'], '>=1.2.4-alpha <1.3.0'), '1.2.4-rc.1');
  assert.equal(maxSatisfying(['2.0.0-rc.1', '1.9.9'], '<2'), '1.9.9');
  assert.equal(minSatisfying(['1.0.0-rc.1', '1.0.0'], '>=0.9.0 <=1.0.0'), '1.0.0');
});
