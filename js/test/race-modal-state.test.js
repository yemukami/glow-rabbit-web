import assert from 'assert';
import { createModalState, setActiveTab, setModalTarget, setSelectedColor } from '../ui/race-modal-state.js';

function testInitialState() {
    const state = createModalState();
    assert.deepStrictEqual(state.target, {}, 'initial target should be empty object');
    assert.strictEqual(state.selectedColor, 'red', 'initial color should default to red');
    assert.strictEqual(state.activeTab, 'simple', 'initial tab should be simple');
}

function testMutations() {
    const state = createModalState();
    setModalTarget(state, { raceId: 1, pacerId: 2 });
    setSelectedColor(state, 'blue');
    setActiveTab(state, 'segments');
    assert.deepStrictEqual(state.target, { raceId: 1, pacerId: 2 }, 'target should be set');
    assert.strictEqual(state.selectedColor, 'blue', 'color should update');
    assert.strictEqual(state.activeTab, 'segments', 'tab should update');
}

function run() {
    console.log('\n[race-modal-state.test] start');
    testInitialState();
    testMutations();
    console.log('race-modal-state tests passed');
}

run();
