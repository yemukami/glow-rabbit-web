import assert from 'assert';
import { PaceCalculator } from '../core/pace-calculator.js';

function roundToTenth(value) {
  return Math.round(value * 10) / 10;
}

function testPaceRounding() {
  const targetSec = 325; // 5:25 for 1600m
  const pace = roundToTenth((targetSec / 1600) * 400);
  assert.strictEqual(pace, 81.3, 'Pace should round to 81.3');
}

function testPlanConsistency() {
  const plan = PaceCalculator.createPlanFromTargetTime(1600, 325, 400);
  const total = plan[plan.length - 1].endTime;
  assert.ok(Math.abs(total - 325) < 0.2, 'Plan total close to target time');
}

function run() {
  testPaceRounding();
  testPlanConsistency();
  console.log('render-utils tests passed');
}

run();
