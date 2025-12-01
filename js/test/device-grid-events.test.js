import assert from 'assert';
import { attachDeviceGridHandlers } from '../ui/device-grid-events.js';

function createGridStub() {
    return {
        __deviceHandlersAttached: false,
        listeners: {},
        addEventListener(type, fn) {
            this.listeners[type] = fn;
        }
    };
}

function makeEvent(idx) {
    const target = {
        dataset: { deviceIdx: idx },
        closest: (selector) => (selector === '[data-action="open-device"]' ? target : null)
    };
    return { target };
}

function testOpenDevice() {
    const grid = createGridStub();
    let openedIdx = null;
    attachDeviceGridHandlers(grid, {
        getMode: () => 'normal',
        onOpenDevice: (idx) => { openedIdx = idx; }
    });
    grid.listeners.click(makeEvent('2'));
    assert.strictEqual(openedIdx, 2, 'should invoke onOpenDevice with parsed index');
}

function testSwapMode() {
    const grid = createGridStub();
    let swappedIdx = null;
    attachDeviceGridHandlers(grid, {
        getMode: () => 'swapping',
        onSwapMode: (idx) => { swappedIdx = idx; }
    });
    grid.listeners.click(makeEvent('1'));
    assert.strictEqual(swappedIdx, 1, 'should invoke onSwapMode when swapping');
}

function testIgnoreInvalid() {
    const grid = createGridStub();
    let called = false;
    attachDeviceGridHandlers(grid, {
        getMode: () => 'normal',
        onOpenDevice: () => { called = true; }
    });
    // invalid idx
    grid.listeners.click(makeEvent('not-number'));
    assert.strictEqual(called, false, 'should ignore invalid index');
}

function run() {
    console.log('\n[device-grid-events.test] start');
    testOpenDevice();
    testSwapMode();
    testIgnoreInvalid();
    console.log('device-grid-events tests passed');
}

run();
