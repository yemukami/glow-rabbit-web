import assert from 'assert';
import { syncRaceConfigs } from '../core/race-sync-service.js';

function mockRace() {
  return {
    id: 1,
    distance: 400,
    startPos: 0,
    status: 'ready',
    syncNeeded: true,
    initialConfigSent: false,
    pacers: [
      { id: 1, pace: 80, color: 'red', runPlan: null, currentDist: 0, currentSegmentIdx: 0, nextCommandPrepared: false, finishTime: null }
    ],
    markers: []
  };
}

async function testSyncRaceConfigsDryRun() {
  const race = mockRace();
  const res = await syncRaceConfigs(race, { dryRun: true });
  assert.ok(res.ok, 'syncRaceConfigs should succeed');
  assert.ok(Array.isArray(res.records), 'records should be array');
  assert.ok(res.records.length >= 2, 'should enqueue at least color and pace commands');
  assert.strictEqual(race.initialConfigSent, true, 'initialConfigSent should be true after sync');
  assert.strictEqual(race.syncNeeded, false, 'syncNeeded should be false after sync');
}

async function run() {
  await testSyncRaceConfigsDryRun();
  console.log('race-sync-service tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
