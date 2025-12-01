import assert from 'assert';
import { closeModalUI, openModalUI, setActiveTabUI, setCalcPaceText, setColorSelection, setTargetTimeValue } from '../ui/race-modal-view.js';

function createClassList() {
    const set = new Set();
    return {
        add(cls) { set.add(cls); },
        remove(cls) { set.delete(cls); },
        contains(cls) { return set.has(cls); },
        _values: set
    };
}

function setupDom() {
    const elementsById = {};
    const allSelectors = {
        '.modal-tab': [],
        '.tab-content': [],
        '.color-option': []
    };
    function register(id, el) {
        elementsById[id] = el;
        return el;
    }
    const modal = register('modal-settings', { classList: createClassList() });
    const targetInput = register('modal-target-time', { value: '' });
    const calc = register('modal-calc-pace', { innerText: '' });
    register('tab-btn-simple', { classList: createClassList() });
    register('tab-content-simple', { classList: createClassList() });
    register('tab-btn-segments', { classList: createClassList() });
    register('tab-content-segments', { classList: createClassList() });
    const colorRed = { classList: createClassList() };
    const colorBlue = { classList: createClassList() };
    colorRed.className = 'bg-red color-option';
    colorBlue.className = 'bg-blue color-option';
    allSelectors['.color-option'].push(colorRed, colorBlue);
    allSelectors['.modal-tab'].push(elementsById['tab-btn-simple'], elementsById['tab-btn-segments']);
    allSelectors['.tab-content'].push(elementsById['tab-content-simple'], elementsById['tab-content-segments']);

    global.document = {
        getElementById: (id) => elementsById[id] || null,
        querySelector: (selector) => {
            if (selector.startsWith('.bg-')) {
                const color = selector.replace('.bg-', '');
                return color === 'red' ? colorRed : colorBlue;
            }
            return null;
        },
        querySelectorAll: (selector) => allSelectors[selector] || []
    };
    return { modal, targetInput, calc, colorRed, colorBlue, selectors: allSelectors };
}

function cleanupDom() {
    delete global.document;
}

function testModalOpenClose() {
    const { modal } = setupDom();
    openModalUI();
    assert.ok(modal.classList.contains('open'), 'modal should be open');
    closeModalUI();
    assert.ok(!modal.classList.contains('open'), 'modal should be closed');
    cleanupDom();
}

function testTargetAndPace() {
    const { targetInput, calc } = setupDom();
    setTargetTimeValue('1:23');
    setCalcPaceText('80.0');
    assert.strictEqual(targetInput.value, '1:23', 'target time should update');
    assert.strictEqual(calc.innerText, '80.0', 'calc pace should update');
    cleanupDom();
}

function testColorSelection() {
    const { colorRed, colorBlue } = setupDom();
    setColorSelection('blue');
    assert.ok(colorBlue.classList.contains('selected'), 'blue should be selected');
    assert.ok(!colorRed.classList.contains('selected'), 'red should not be selected');
    cleanupDom();
}

function testActiveTab() {
    const { selectors } = setupDom();
    setActiveTabUI('segments');
    const btnSegments = selectors['.modal-tab'][1];
    const contentSegments = selectors['.tab-content'][1];
    assert.ok(btnSegments.classList.contains('active'), 'segments tab should be active');
    assert.ok(contentSegments.classList.contains('active'), 'segments content should be active');
    cleanupDom();
}

function run() {
    console.log('\n[race-modal-view.test] start');
    testModalOpenClose();
    testTargetAndPace();
    testColorSelection();
    testActiveTab();
    console.log('race-modal-view tests passed');
}

run();
