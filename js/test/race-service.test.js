import assert from 'assert';
import { advanceRaceTick, prepareRacePlans, findActiveSegment, startRaceService } from '../core/race-service.js';

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

async function testStartRaceServiceDryRun() {
  const race = mockRace(400, 80);
  prepareRacePlans(race);
  const deviceManager = await import('../core/device-manager.js');
  deviceManager.deviceList[0] = { mac: 'AA:BB:CC:DD:EE:FF' };
  const res = await startRaceService(race, 1, 0, () => false, { dryRun: true }, { sendStop: true, resendConfig: true });
  const records = res.records;
  const startCmd = records[records.length - 1];
  assert.strictEqual(startCmd.opts.highPriority, true, 'Start command should be high priority');
  assert.strictEqual(records.length, 5, 'Expected 5 commands for single pacer flow');
}

async function run() {
  testAdvanceRaceTickFinishes();
  testFindActiveSegment();
  await testStartRaceServiceDryRun();
  console.log('race-service tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
