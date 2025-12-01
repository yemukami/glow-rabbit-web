// Mock Browser Environment
global.document = {
    getElementById: (id) => {
        if (!global.mockDOM[id]) {
            global.mockDOM[id] = { 
                _html: '',
                style: {}, 
                value: '',
                addEventListener: () => {},
                classList: { 
                    add: (c) => { global.mockDOM[id].classes.add(c) },
                    remove: (c) => { global.mockDOM[id].classes.delete(c) },
                    contains: (c) => global.mockDOM[id].classes.has(c)
                },
                classes: new Set(),
                appendChild: (child) => { 
                    global.mockDOM[id].children.push(child);
                    // Simulate DOM insertion for innerHTML check
                    global.mockDOM[id].innerHTML = (global.mockDOM[id].innerHTML || '') + child.innerHTML; 
                },
                children: [],
                remove: () => {},
                querySelector: () => null
            };
            Object.defineProperty(global.mockDOM[id], 'innerHTML', {
                set: function(v) { 
                    this._html = v; 
                    this.children = [];
                },
                get: function() { return this._html || ''; }
            });
        }
        return global.mockDOM[id];
    },
    createElement: (tag) => {
        return {
            tagName: tag.toUpperCase(),
            innerHTML: '',
            className: '',
            style: {}, 
            onclick: null,
            children: [],
            querySelector: () => null
        };
    },
    querySelectorAll: () => [],
    querySelector: () => null,
    body: { appendChild: () => {} }
};

global.window = {
    confirm: () => true,
    alert: (msg) => console.log("[Alert]", msg),
    location: {}
};

global.localStorage = {
    store: {},
    getItem: (k) => global.localStorage.store[k],
    setItem: (k, v) => { global.localStorage.store[k] = v; }
};

Object.defineProperty(global, 'navigator', {
    value: { bluetooth: {} },
    writable: true
});
global.prompt = () => "00:00:00:00:00:00";

// Reset Mock State
global.resetMock = () => {
    global.mockDOM = {};
    global.localStorage.store = {};
};

// --- Import Modules to Test ---
// Note: We need to use dynamic imports or run this in a module-enabled environment.
// Since we are running via 'node', we'll assume standard ES modules are enabled in package.json or use .mjs extension.
// But here we will try to load them.

import { initUI } from '../ui/ui-controller.js';
import { races, loadRaces, saveRaces } from '../core/race-manager.js';

async function runTests() {
    console.log("=== STARTING TDD CHECKS ===");
    global.resetMock();

    // TEST 1: Data Initialization
    console.log("\n[Test 1] Data Initialization (Empty Storage)");
    
    // Setup DOM mocks needed for initUI
    document.getElementById('screen-race');
    document.getElementById('btn-mode-race');
    document.getElementById('competition-title'); // used in switchMode
    document.getElementById('race-screen-title');
    document.getElementById('race-tbody'); 
    document.getElementById('setup-tbody'); 

    // Run Init
    initUI();

    // Assertions
    if (races.length === 1) {
        console.log("✅ PASS: Default race created when storage is empty.");
    } else {
        console.error("❌ FAIL: Races length is " + races.length + ", expected 1.");
    }

    // TEST 2: Render Logic
    console.log("\n[Test 2] Render Logic (race-tbody)");
    
    // Check if race-tbody has content
    const tbody = document.getElementById('race-tbody');
    
    const rowContent = tbody.innerHTML;
    if (rowContent.includes('<tr')) {
        console.log("✅ PASS: tbody rendered HTML content.");
        if (rowContent.includes('New Race')) {
            console.log("✅ PASS: Row content contains 'New Race'.");
        } else {
            console.error("❌ FAIL: Row content incorrect. Got: " + rowContent.substring(0, 50) + "...");
        }
    } else {
        console.error("❌ FAIL: tbody did not render rows.");
        console.log("Debug: tbody innerHTML: ", rowContent);
    }

    // TEST 3: Pacer Rendering
    console.log("\n[Test 3] Pacer Rendering inside Row");
    // Add a pacer to the race
    races[0].pacers.push({id:1, color:'red', pace:60, currentDist:0});
    
    // Re-render (simulate switchMode calling renderRace internally, or call renderRace if exported? 
    // renderRace is not exported, so we trigger switchMode('race') again)
    global.window.switchMode('race');
    
    const tbody2 = document.getElementById('race-tbody');
    const rowHtml2 = tbody2.innerHTML;
    if (rowHtml2.includes('pacer-chip') || rowHtml2.includes('pacer-control-row')) {
        console.log("✅ PASS: Pacer info rendered in race row.");
    } else {
        console.error("❌ FAIL: Pacer info missing. Row HTML: " + rowHtml2);
    }
}

runTests().catch(e => console.error("TEST CRASHED:", e));
