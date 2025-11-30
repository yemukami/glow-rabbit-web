import assert from 'assert';
import { PaceCalculator } from '../core/pace-calculator.js';
import { roundToTenth, formatPace, formatPaceLabel, formatDistanceMeters } from '../utils/render-utils.js';

function testPaceRounding() {
  const targetSec = 325; // 5:25 for 1600m
  const pace = roundToTenth((targetSec / 1600) * 400);
  assert.strictEqual(pace, 81.3, 'Pace should round to 81.3');
  assert.strictEqual(formatPace(81.26), '81.3', 'formatPace rounds to one decimal');
  assert.strictEqual(formatPaceLabel(81.26), '81.3s', 'formatPaceLabel appends unit');
  assert.strictEqual(formatPace(NaN), '--.-', 'formatPace returns fallback on NaN');
  assert.strictEqual(formatPaceLabel('bad'), '--.-s', 'formatPaceLabel returns fallback on invalid');
}

function testDistanceFormatting() {
  assert.strictEqual(formatDistanceMeters(123.9), '123m', 'Distance floors for display');
  assert.strictEqual(formatDistanceMeters(NaN), '0m', 'Invalid distance falls back to 0m');
}

function testPlanConsistency() {
  const plan = PaceCalculator.createPlanFromTargetTime(1600, 325, 400);
  const total = plan[plan.length - 1].endTime;
  assert.ok(Math.abs(total - 325) < 0.2, 'Plan total close to target time');
}

function run() {
  testPaceRounding();
  testDistanceFormatting();
  testPlanConsistency();
  console.log('render-utils tests passed');
}

run();
