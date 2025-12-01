import assert from 'assert';
import { renderReplaceModal, updateReplaceMacText } from '../ui/replace-modal-renderer.js';

function createStubDocument() {
    const elementsById = {};
    const body = {
        children: [],
        appendChild(el) {
            this.children.push(el);
        }
    };
    const doc = {
        body,
        _elementsById: elementsById,
        createElement() {
            const el = {
                _id: null,
                className: '',
                style: {},
                _innerHTML: '',
                addEventListener() {},
                appendChild() {},
                set id(v) {
                    this._id = v;
                    elementsById[v] = this;
                },
                get id() { return this._id; },
                set innerHTML(val) {
                    this._innerHTML = val;
                    // Minimal hook: create MAC display element when needed
                    if (val.includes('replace-mac-display')) {
                        const display = { id: 'replace-mac-display', innerText: '', style: {} };
                        elementsById['replace-mac-display'] = display;
                    }
                },
                get innerHTML() { return this._innerHTML; }
            };
            return el;
        },
        getElementById(id) {
            return elementsById[id] || null;
        }
    };
    return doc;
}

function withDom(fn) {
    const stub = createStubDocument();
    global.document = stub;
    try {
        fn();
    } finally {
        delete global.document;
    }
}

function testRenderReplaceModal() {
    withDom(() => {
        const modal = renderReplaceModal(2, 'Scanning...');
        assert.ok(modal.id === 'modal-replace-overlay', 'modal id should be set');
        assert.ok(modal.innerHTML.includes('Target: #3'), 'target index should be rendered as 3 (1-based)');
        assert.ok(modal.innerHTML.includes('replace-mac-display'), 'MAC display element should exist');
    });
}

function testUpdateReplaceMacText() {
    withDom(() => {
        const modal = renderReplaceModal(0, 'Scanning...');
        document.body.appendChild(modal);
        updateReplaceMacText('AA:BB:CC:DD:EE:FF');
        const display = document.getElementById('replace-mac-display');
        assert.strictEqual(display.innerText, 'AA:BB:CC:DD:EE:FF', 'MAC text should update');
        if (typeof modal.remove === 'function') modal.remove();
    });
}

function run() {
    console.log('\n[replace-modal-renderer.test] start');
    testRenderReplaceModal();
    testUpdateReplaceMacText();
    console.log('replace-modal-renderer tests passed');
}

run();
