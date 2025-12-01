import assert from 'assert';
import { createModalState, resetModalState, setActiveTab, setModalTarget, setSelectedColor } from '../ui/race-modal-state.js';

function testInitialState() {
    const state = createModalState();
    assert.deepStrictEqual(state.target, {}, 'initial target should be empty object');
    assert.strictEqual(state.selectedColor, 'red', 'initial color should be red');
    assert.strictEqual(state.activeTab, 'simple', 'initial tab should be simple');
}

function testMutations() {
    const state = createModalState();
    setModalTarget(state, { raceId: 1, pacerId: 2 });
    setSelectedColor(state, 'blue');
    setActiveTab(state, 'segments');
    assert.deepStrictEqual(state.target, { raceId: 1, pacerId: 2 }, 'target should update');
    assert.strictEqual(state.selectedColor, 'blue', 'color should update');
    assert.strictEqual(state.activeTab, 'segments', 'tab should update');
}

function testReset() {
    const state = createModalState();
    setModalTarget(state, { raceId: 5, pacerId: 6 });
    setSelectedColor(state, 'green');
    setActiveTab(state, 'segments');
    resetModalState(state);
    assert.deepStrictEqual(state.target, {}, 'target should reset');
    assert.strictEqual(state.selectedColor, 'red', 'color should reset');
    assert.strictEqual(state.activeTab, 'simple', 'tab should reset');
}

function run() {
    console.log('\n[race-modal-state.test] start');
    testInitialState();
    testMutations();
    testReset();
    console.log('race-modal-state tests passed');
}

run();
