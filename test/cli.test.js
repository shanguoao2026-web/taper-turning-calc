import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

import { mkdtempSync, openSync, closeSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Capture to files so subprocess checks also work in restricted pipe environments.
const run = (...args) => {
  const dir = mkdtempSync(join(tmpdir(), 'taper-cli-'));
  const out = join(dir, 'stdout');
  const err = join(dir, 'stderr');
  const stdout = openSync(out, 'w');
  const stderr = openSync(err, 'w');
  try {
    const result = spawnSync(process.execPath, ['dist/cli.js', ...args.map(String)], {
      stdio: ['ignore', stdout, stderr],
    });
    if (result.error) throw result.error;
    return { status: result.status, stdout: readFileSync(out, 'utf8'), stderr: readFileSync(err, 'utf8') };
  } finally {
    closeSync(stdout);
    closeSync(stderr);
    rmSync(dir, { recursive: true, force: true });
  }
};
const json = (...args) => {
  const result = run(...args, '--json');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
};
const base = ['--large', 30, '--length', 50];

test('diameter check values, angles at four decimals and offset at three', () => {
  const value = json(...base, '--small', 20, '--work-length', 100, '--decimals', 4);
  assert.equal(value.taper, 0.2);
  assert.equal(value.ratio, 5);
  assert.equal(value.halfAngle, 5.7106);
  assert.equal(value.includedAngle, 11.4212);
  assert.equal(value.tailstockOffset, 10);
  const text = run(...base, '--small', 20, '--work-length', 100);
  assert.match(text.stdout, /Taper ratio: 1:5\.000/);
  assert.match(text.stdout, /Tailstock offset: 10\.000 mm/);
});
test('ratio check values', () => {
  const value = json('--large', 20, '--ratio', 20, '--length', 40, '--decimals', 4);
  assert.equal(value.small, 18);
  assert.equal(value.halfAngle, 1.4321);
  assert.match(run('--large', 20, '--ratio', 20, '--length', 40).stdout, /Small diameter: 18\.000 mm/);
});
test('half-angle check value', () => {
  assert.equal(json(...base, '--half-angle', 5).small, 21.251);
});

for (const [name, args] of [
  ['equal diameters', [...base, '--small', 30]],
  ['multiple taper inputs', [...base, '--small', 20, '--ratio', 5]],
  ['no taper input', base],
  ['45 degree half-angle', [...base, '--half-angle', 45]],
  ['short work length', [...base, '--small', 20, '--work-length', 40]],
  ['missing large', ['--length', 50, '--small', 20]],
  ['missing length', ['--large', 30, '--small', 20]],
  ['zero large', ['--large', 0, '--length', 50, '--small', 0]],
  ['negative length', ['--large', 30, '--length', -1, '--small', 20]],
  ['negative small', [...base, '--small', -1]],
  ['larger small', [...base, '--small', 31]],
  ['zero ratio', [...base, '--ratio', 0]],
  ['negative ratio', [...base, '--ratio', -5]],
  ['impossible ratio', [...base, '--ratio', 1]],
  ['zero angle', [...base, '--half-angle', 0]],
  ['negative angle', [...base, '--half-angle', -5]],
  ['impossible angle', [...base, '--half-angle', 40]],
  ...['NaN', 'Infinity', '-Infinity', 'abc', ''].map(value => [`nonfinite or invalid ${value}`, [...base, '--small', value]]),
  ...[-1, 7, 1.5].map(value => [`invalid decimals ${value}`, [...base, '--small', 20, '--decimals', value]]),
  ['missing value', [...base, '--small']],
  ['unknown option', [...base, '--small', 20, '--unknown']],
  ['duplicate option', [...base, '--small', 20, '--small', 10]],
]) {
  test(`rejects ${name}`, () => {
    const result = run(...args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^Error:/);
    assert.equal(result.stdout, '');
  });
}
test('help is available without required arguments', () => {
  const result = run('--help');
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage:/);
});
test('zero small diameter and equal work length are valid; offset is optional', () => {
  const value = json(...base, '--small', 0, '--work-length', 50);
  assert.equal(value.tailstockOffset, 15);
  assert.equal('tailstockOffset' in json(...base, '--small', 20), false);
});
test('precision boundaries', () => {
  assert.equal(json(...base, '--small', 20, '--decimals', 0).halfAngle, 6);
  assert.equal(json(...base, '--small', 20, '--decimals', 6).halfAngle, 5.710593);
});
