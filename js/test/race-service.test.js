import assert from 'assert';
import { advanceRaceTick, prepareRacePlans, findActiveSegment } from '../core/race-service.js';

function mockRace(distance = 800, pace = 80) {
  return {
    distance,
    pacers: [{
      id: 1,
      pace,
      color: 'red',
      runPlan: null,
      currentDist: 0,
      currentSegmentIdx: 0,
      nextCommandPrepared: false,
      finishTime: null
    }],
    markers: [],
    status: 'ready'
  };
}

function testAdvanceRaceTickFinishes() {
  const race = mockRace(400, 80);
  prepareRacePlans(race);
  let elapsed = 0;
  for (let i = 0; i < 2000; i++) { // generous upper bound to cross finish + margin
    const res = advanceRaceTick(race, elapsed, 2);
    elapsed = res.elapsedTime;
    if (res.allFinished) {
      assert.ok(race.pacers[0].finishTime !== null, 'finishTime should be set');
      return;
    }
  }
  assert.fail('Race did not finish within expected ticks');
}

function testFindActiveSegment() {
  const plan = [
    { endDist: 200, paceFor400m: 70 },
    { endDist: 400, paceFor400m: 80 }
  ];
  const seg = findActiveSegment(plan, 150);
  assert.strictEqual(seg.paceFor400m, 70, 'Should pick first segment');
}

function run() {
  testAdvanceRaceTickFinishes();
  testFindActiveSegment();
  console.log('race-service tests passed');
}

run();
