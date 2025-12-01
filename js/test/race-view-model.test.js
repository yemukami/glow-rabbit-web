import assert from 'assert';
import { computeLeadAndFill, buildRaceViewModel } from '../ui/race-view-model.js';

function mockRace() {
    return {
        id: 1,
        time: "10:00",
        name: "<Race>",
        group: 1,
        distance: 800,
        startPos: 0,
        status: 'ready',
        syncNeeded: true,
        pacers: [
            { id: 1, pace: 80, color: 'red', currentDist: 100 },
            { id: 2, pace: 90, color: 'blue', currentDist: 200 }
        ],
        markers: []
    };
}

function testComputeLeadAndFill() {
    const race = mockRace();
    const { totalScale, maxDist, fillPct } = computeLeadAndFill(race);
    assert.strictEqual(totalScale, race.distance + 50, 'totalScale should include padding');
    assert.strictEqual(maxDist, 200, 'maxDist should pick leading pacer distance');
    assert.ok(fillPct > 0, 'fillPct should be positive');
}

function testBuildRaceViewModelEscapes() {
    const race = mockRace();
    const vm = buildRaceViewModel(race, null);
    assert.ok(vm.safeName.includes('&lt;Race&gt;'), 'race name should be escaped');
    assert.ok(vm.badge.includes('要同期'), 'syncNeeded badge should appear when true');
}

async function run() {
    testComputeLeadAndFill();
    testBuildRaceViewModelEscapes();
    console.log('race-view-model tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
