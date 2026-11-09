import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sort, formatRange, maxSatisfying } from '../src/semver.mjs';

test('sort orders prereleases by SemVer precedence', () => {
  assert.deepEqual(
    sort(['1.0.0', '1.0.0-rc.1', '1.0.0-beta.11', '1.0.0-beta.2', '1.0.0-alpha', '1.0.0-alpha.1']),
    ['1.0.0-alpha', '1.0.0-alpha.1', '1.0.0-beta.2', '1.0.0-beta.11', '1.0.0-rc.1', '1.0.0'],
  );
});

test('formatRange normalizes caret, tilde and hyphen', () => {
  assert.equal(formatRange('^1.2.3'), '>=1.2.3 <2.0.0');
  assert.equal(formatRange('~1.2'), '>=1.2.0 <1.3.0');
  assert.equal(formatRange('1.2.3 - 2.3.4'), '>=1.2.3 <=2.3.4');
});

test('maxSatisfying picks the highest compatible stable version', () => {
  assert.equal(maxSatisfying(['1.9.0', '2.0.0-rc.1', '1.10.0'], '^1.2.3'), '1.10.0');
});
