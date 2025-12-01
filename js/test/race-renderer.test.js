import assert from 'assert';
import { renderRaceTable, updateRunningDisplays } from '../ui/race-renderer.js';

function buildMockRace(status = 'ready') {
    return {
        id: 1,
        time: '12:34',
        name: 'Race A',
        group: 2,
        distance: 400,
        startPos: 0,
        status,
        syncNeeded: status === 'ready',
        pacers: [
            { id: 10, pace: 80, color: 'red', currentDist: 100, runPlan: [{ endTime: 120 }] }
        ],
        markers: []
    };
}

function testRenderRaceTable() {
    const race = buildMockRace('ready');
    const html = renderRaceTable([race], race.id, 0, {});
    assert.ok(html.includes('toggleRow(1'), 'row should include toggle handler');
    assert.ok(html.includes('要同期'), 'syncNeeded badge should be present');
    assert.ok(html.includes('START'), 'expanded race should render START button');
}

function testRenderRaceTableSynced() {
    const race = buildMockRace('ready');
    race.syncNeeded = false;
    const html = renderRaceTable([race], race.id, 0, {});
    assert.ok(!html.includes('要同期'), 'syncNeeded badge should be hidden when not needed');
}

function testUpdateRunningDisplays() {
    const race = buildMockRace('running');
    const timerEl = { innerText: '' };
    const headLabel = { innerText: '' };
    const headEl = { style: {}, querySelector: () => headLabel };
    const estEl = { innerText: '' };
    const fillEl = { style: {} };
    const leadEl = { innerHTML: '' };
    const elements = {
        'timer-display': timerEl,
        'pacer-head-10': headEl,
        'pacer-est-10': estEl,
        'progress-fill-1': fillEl,
        'lead-dist-display': leadEl
    };
    const originalDoc = global.document;
    global.document = { getElementById: (id) => elements[id] || null };

    try {
        updateRunningDisplays(race, 5);
        assert.strictEqual(timerEl.innerText, '00:05.0', 'timer should update');
        assert.ok(fillEl.style.width && fillEl.style.width.includes('%'), 'progress width should set');
        assert.ok(headEl.style.left && headEl.style.left.includes('%'), 'pacer head should move');
        assert.ok(leadEl.innerHTML.includes('先頭'), 'lead distance should render');
        assert.ok(estEl.innerText.includes('Goal'), 'estimate label should render');
    } finally {
        global.document = originalDoc;
    }
}

async function run() {
    testRenderRaceTable();
    testRenderRaceTableSynced();
    testUpdateRunningDisplays();
    console.log('race-renderer tests passed');
}

run().catch(e => { console.error(e); process.exit(1); });
