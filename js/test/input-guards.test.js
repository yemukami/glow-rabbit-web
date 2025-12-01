import assert from 'assert';
import { ensureNonNegativeNumber, ensurePositiveInt } from '../utils/input-guards.js';

function testEnsureNonNegativeNumber() {
    assert.strictEqual(ensureNonNegativeNumber(-5, 0), 0, 'negative should clamp to default');
    assert.strictEqual(ensureNonNegativeNumber('10.5', 0), 10.5, 'string number should parse');
    assert.strictEqual(ensureNonNegativeNumber('abc', 7), 7, 'invalid should return fallback');
}

function testEnsurePositiveInt() {
    assert.strictEqual(ensurePositiveInt(-3, 1), 1, 'negative int should clamp to fallback');
    assert.strictEqual(ensurePositiveInt('12', 0), 12, 'string int should parse');
    assert.strictEqual(ensurePositiveInt('abc', 5), 5, 'invalid should return fallback');
}

function run() {
    testEnsureNonNegativeNumber();
    testEnsurePositiveInt();
    console.log('input-guards tests passed');
}

run();
