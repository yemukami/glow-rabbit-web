import { PaceCalculator } from '../core/pace-calculator.js';

function assertApprox(actual, expected, tol, msg) {
    if (Math.abs(actual - expected) > tol) {
        throw new Error(msg + ` (actual: ${actual}, expected: ${expected}, tol: ${tol})`);
    }
}

function testTargetTimePlan() {
    const totalDist = 5000;
    const targetSec = 900; // 15:00
    const plan = PaceCalculator.createPlanFromTargetTime(totalDist, targetSec, 400);
    const total = Math.round(plan.reduce((s, c) => s + c.duration, 0) * 10) / 10;
    assertApprox(total, targetSec, 0.2, 'Total duration drifts from target time');
    if (plan.some(c => Number.isNaN(c.duration) || Number.isNaN(c.paceFor400m))) {
        throw new Error('NaN detected in plan');
    }
}

function testSegmentPlan() {
    const segments = [
        { distance: 400, pace: 80 },
        { distance: 800, pace: 78 },
        { distance: 1200, pace: 76 },
    ];
    const plan = PaceCalculator.createPlanFromSegments(segments, 400);
    const last = plan[plan.length - 1];
    assertApprox(last.endDist, 1200, 0.1, 'Segment plan end distance mismatch');
    if (plan.some(c => Number.isNaN(c.duration) || Number.isNaN(c.paceFor400m))) {
        throw new Error('NaN detected in segment plan');
    }
}

function run() {
    testTargetTimePlan();
    testSegmentPlan();
    console.log('pace-calculator tests passed');
}

run();
