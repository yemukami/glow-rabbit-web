import assert from 'assert';
import { computePaceFromTarget, parseTimeStr } from '../ui/race-modal-utils.js';

function testParseTimeStr() {
    assert.strictEqual(parseTimeStr('2:30'), 150, 'mm:ss should parse to seconds');
    assert.strictEqual(parseTimeStr('75.5'), 75.5, 'plain seconds should parse');
    assert.strictEqual(parseTimeStr(''), 0, 'empty should be zero');
    assert.strictEqual(parseTimeStr('bad'), 0, 'invalid should be zero');
}

function testComputePace() {
    const pace = computePaceFromTarget(800, '2:40'); // 160 sec -> pace 80 sec/400
    assert.strictEqual(pace, 80, 'pace should be distance-normalized');
    const invalid = computePaceFromTarget(0, '2:40');
    assert.strictEqual(invalid, null, 'invalid distance returns null');
}

function run() {
    console.log('\n[race-modal-utils.test] start');
    testParseTimeStr();
    testComputePace();
    console.log('race-modal-utils tests passed');
}

run();
