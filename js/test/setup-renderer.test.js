import { buildSetupTableHTML } from '../ui/setup-renderer.js';

function testBuildSetupTableHTML() {
    const races = [{
        id: 1,
        time: '10:00',
        name: 'Test Race',
        group: 2,
        distance: 800,
        startPos: 50,
        count: 5,
        pacers: [{ id: 10, color: 'red', pace: 60 }]
    }];
    const html = buildSetupTableHTML(races);
    if (!html.includes('data-action="update-field"') || !html.includes('data-action="open-modal"')) {
        throw new Error('Setup row HTML missing expected data-action attributes');
    }
    if (!html.includes('Test Race') || !html.includes('value="10:00"')) {
        throw new Error('Setup row HTML did not include escaped race values');
    }
    console.log('✅ PASS: buildSetupTableHTML renders setup row with controls and values.');
}

function testEmptyRaces() {
    const html = buildSetupTableHTML([]);
    if (html !== '') {
        throw new Error('Expected empty string for no races');
    }
    console.log('✅ PASS: buildSetupTableHTML returns empty string when no races exist.');
}

function run() {
    console.log('\n[setup-renderer.test] start');
    testBuildSetupTableHTML();
    testEmptyRaces();
}

run();
