import assert from 'assert';
import { advanceRaceTick, prepareRacePlans, findActiveSegment, startRaceService, stopRaceService, resetSyncFlags, setRaceSynced, finalizeRaceState, resetRaceState } from '../core/race-service.js';

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

async function testStartRaceServiceClampsStartPos() {
  const race = mockRace(400, 80);
  const deviceManager = await import('../core/device-manager.js');
  deviceManager.deviceList[0] = { mac: 'AA:BB:CC:DD:EE:FF' };
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args);
  await startRaceService(race, 1, -25, () => false, { dryRun: true }, { sendStop: false, resendConfig: true });
  console.warn = originalWarn;
  assert.strictEqual(race.startPos, 0, 'startPos should clamp to zero when negative');
  const warningText = warnings.map(w => w.join(' ')).join(' ');
  assert.ok(warningText.includes('startPos sanitized'), 'Should log startPos sanitized warning');
}

async function testStopRaceServiceDryRun() {
  const race = mockRace(400, 80);
  const res = await stopRaceService(race, { dryRun: true });
  assert.ok(res.records.length === 1, 'Stop should enqueue one command');
  assert.strictEqual(res.records[0].opts.highPriority, true, 'Stop command should be high priority');
  assert.strictEqual(race.syncNeeded, true, 'Stop should mark syncNeeded');
  assert.strictEqual(race.initialConfigSent, false, 'Stop should clear initialConfigSent');
}

async function testStopClearsActiveRaceId() {
  const raceManager = await import('../core/race-manager.js');
  const race = mockRace(400, 80);
  raceManager.setActiveRaceId(99);
  await stopRaceService(race, { dryRun: true });
  assert.strictEqual(raceManager.activeRaceId, null, 'stop should clear activeRaceId');
}

async function testFinalizeAndResetClearActiveRaceId() {
  const raceManager = await import('../core/race-manager.js');
  const race = mockRace(400, 80);
  raceManager.setActiveRaceId(5);
  finalizeRaceState(race);
  assert.strictEqual(raceManager.activeRaceId, null, 'finalize should clear activeRaceId');
  raceManager.setActiveRaceId(7);
  resetRaceState(race);
  assert.strictEqual(raceManager.activeRaceId, null, 'reset should clear activeRaceId');
}

function testSyncFlagHelpers() {
  const race = mockRace(400, 80);
  setRaceSynced(race);
  assert.strictEqual(race.syncNeeded, false, 'setRaceSynced should clear syncNeeded');
  assert.strictEqual(race.initialConfigSent, true, 'setRaceSynced should set initialConfigSent');
  resetSyncFlags(race);
  assert.strictEqual(race.syncNeeded, true, 'resetSyncFlags should set syncNeeded');
  assert.strictEqual(race.initialConfigSent, false, 'resetSyncFlags should clear initialConfigSent');
}

async function run() {
  testAdvanceRaceTickFinishes();
  testFindActiveSegment();
  await testStartRaceServiceDryRun();
  await testStartRaceServiceClampsStartPos();
  await testStopRaceServiceDryRun();
  await testStopClearsActiveRaceId();
  await testFinalizeAndResetClearActiveRaceId();
  testSyncFlagHelpers();
  console.log('race-service tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
