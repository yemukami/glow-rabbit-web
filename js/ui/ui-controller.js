import { races, saveRaces, loadRaces, addNewRace, getActiveRace, getRaceById } from '../core/race-manager.js';
import { deviceList, deviceSettings, deviceInteraction, markDeviceListDirty, loadDeviceList, updateSettings, addDeviceToList, swapDevices, replaceDevice, removeDevice, syncAllDevices, setDeviceToDummy, checkDirtyAndSync, fillRemainingWithDummy, saveDeviceList, isSyncing } from '../core/device-manager.js';
import { connectBLE, isConnected, sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';
import { PaceCalculator } from '../core/pace-calculator.js';
import { roundToTenth, formatPace, formatPaceLabel, formatTime } from '../utils/render-utils.js';
import { parseTimeInput, resolvePaceValue, escapeHTML } from '../utils/data-utils.js';
import { getColorRGB } from '../utils/color-utils.js';
import { advanceRaceTick, startRaceService, sendStopRunner, transitionToReview, finalizeRaceState, resetRaceState, markSyncNeeded, stopRaceService } from '../core/race-service.js';
import { prepareRacePlans, sendInitialConfigs, syncRaceConfigs } from '../core/race-sync-service.js';
import { clearEditingPace, clearRaceInterval, getEditingPaces, getElapsedTime, getExpandedRaceId, resetElapsedTime, setEditingPace, setElapsedTime, setExpandedRaceId, setRaceInterval, toggleExpandedRace } from './race-ui-state.js';
import { attachRaceTableHandlers } from './race-table-events.js';
import { markRaceUnsynced, markOtherRacesUnsynced } from './race-unsync-helpers.js';
import { renderSegmentTable } from './race-modal-renderer.js';
import { buildDeviceGridHtml, buildDeviceOverlayHtml } from './device-renderer.js';
import { attachSetupTableHandlers } from './setup-table-events.js';
import { attachDeviceGridHandlers } from './device-grid-events.js';
import { renderSetupTable } from './setup-renderer.js';
import { renderConnectionStatus } from './connection-renderer.js';
import { renderReplaceModal, updateReplaceMacText } from './replace-modal-renderer.js';
import { createModalState, resetModalState, setActiveTab, setModalTarget, setSelectedColor } from './race-modal-state.js';
import { computePaceFromTarget, parseTimeStr } from './race-modal-utils.js';
import { bindTargetInput, closeModalUI, openModalUI, setActiveTabUI, setCalcPaceText, setColorSelection, setTargetTimeValue } from './race-modal-view.js';
import { buildSegmentsForSave, computeSegmentSummaryText, readSegmentsFromDomRows } from './segment-utils.js';
import { ensureNonNegativeNumber, ensurePositiveInt } from '../utils/input-guards.js';
import { renderScreenMode, syncRaceTitle, updateVersionDisplay } from './screen-renderer.js';
import { getRaceTableBody, getSetupTableBody } from './table-hooks.js';
import { appendOverlay, appendReplaceOverlay, createDeviceOverlay } from './overlay-renderer.js';
import { openVersionModal, closeVersionModal } from './version-modal.js';
import { renderRaceScreen, updateRunningRaceView } from './race-screen.js';
import { renderRaceScreen } from './race-screen.js';
// modalTarget and modalSelectedColor are now part of modalState
let modalState = createModalState();

const UI_CONSTANTS = {
    PROGRESS_BAR_PADDING_METERS: 50,
    FINISH_MARGIN_METERS: 50,
    PRESEND_MARGIN_METERS: 10,
    UPDATE_INTERVAL_MS: 100,
    APP_VERSION: 'v2.1.0-beta.120'
};

function formatDisplayPaceLabel(rawPace) {
    const pace = resolvePaceValue(rawPace);
    return formatPaceLabel(pace);
}

function isButtonOrInput(target) {
    const tag = target.tagName;
    return tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'OPTION';
}

function requireConnection(actionLabel) {
    if (!isConnected) {
        alert(`BLE未接続です。${actionLabel}前に接続してください。`);
        return false;
    }
    return true;
}

function showStartError(reason) {
    if (reason === 'no_pacers') {
        alert("ペーサーが設定されていません。設定後にSTARTしてください。");
        return;
    }
    if (reason === 'busy') {
        alert("他のレースが実行中です。停止してからSTARTしてください。");
        return;
    }
    if (reason === 'not_found') {
        alert("対象のレースが見つかりません。再読み込みを試してください。");
        return;
    }
    alert("STARTに失敗しました。コンソールログを確認してください。");
}

export function initUI() {
    console.log("[Init] Starting UI Initialization...");
    
    try {
        loadRaces();
        console.log("[Init] Races loaded:", races.length);
        
        loadDeviceList();
        console.log("[Init] Devices loaded:", deviceList.length);
        
        loadAppState();
        updateVersionDisplay(UI_CONSTANTS.APP_VERSION);
    } catch (e) {
        console.error("[Init] Data Load Error:", e);
    }
    
    // Bind Globals
    window.switchMode = switchMode;
    window.connectBLE = async () => {
        try {
            const connected = await connectBLE(
                () => updateConnectionStatus(false), 
                handleNotification
            );
            updateConnectionStatus(!!connected);
        } catch (e) {
            console.error("[connectBLE] Failed:", e);
            alert("BLE接続に失敗しました。近くで再試行してください。\n" + e.message);
            updateConnectionStatus(false);
        }
    };
    
    window.checkDirtyAndSync = checkDirtyAndSync;
    
    // Setup
    window.saveCompetitionTitle = saveCompetitionTitle;
    window.addNewRow = addNewRow;
    window.deleteRow = deleteRow;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.selectModalColor = selectModalColor;
    window.switchModalTab = switchModalTab;
    window.saveModalData = saveModalData;
    window.deletePacerFromModal = deletePacerFromModal;
    window.updateData = updateData;
    
    // Race
    window.toggleRow = toggleRow;
    window.startRaceWrapper = startRaceWrapper;
    window.syncRaceWrapper = syncRaceWrapper;
    window.stopRaceWrapper = stopRaceWrapper;
    window.finalizeRace = finalizeRace;
    window.resetRace = resetRace;
    window.updateStartPos = updateStartPos;
    
    window.startEditing = startEditing;
    window.updateEditValue = updateEditValue;
    window.adjustPace = adjustPace;
    window.cancelPace = cancelPace;
    window.commitPace = commitPace;
    
    window.closeVersionModal = closeVersionModal;
    window.openVersionModal = openVersionModal;

    // Devices
    window.updateRaceSettings = (d, i) => { updateSettings(d, i); renderDeviceList(); };
    window.fillWithDummy = fillWithDummy;
    window.clearDeviceList = () => { 
        if(confirm('All Clear?')) { 
            deviceList.length = 0; 
            markDeviceListDirty(true);
            saveDeviceList();
            renderDeviceList(); 
        } 
    };
        window.syncAllDevices = async () => {
        if (!isConnected) {
            alert("BLE未接続です。接続してから同期してください。");
            return;
        }
        const expandedRaceId = getExpandedRaceId();
        const r = getRaceById(expandedRaceId);
        if (r && r.pacers && r.pacers.length > 0) {
            const res = await syncRaceConfigs(r, { dryRun: false });
            if (res.ok) { saveRaces(); }
        }
        if(await syncAllDevices()) alert('同期完了');
    };
    window.downloadCSV = downloadCSV;
    window.importCSV = importCSV;
    
    window.openDeviceActionMenu = openDeviceActionMenu;
    window.triggerStartReplace = startReplaceMode;
    window.triggerStartSwap = startSwapMode;
    window.triggerBlink = testBlinkDevice;
    window.triggerDummy = (i) => { setDeviceToDummy(i); renderDeviceList(); };
    window.triggerRemove = (i) => { removeDevice(i); renderDeviceList(); };
    window.triggerMoveUp = (i) => { /* Need move logic in manager */ alert('Move Up Not Implemented yet'); };
    window.triggerMoveDown = (i) => { /* Need move logic in manager */ alert('Move Down Not Implemented yet'); };
    window.triggerReplace = (i) => { 
        // Manual Replace Logic
        const newMac = prompt("MAC Address?");
        if(newMac) { 
            const res = replaceDevice(i, newMac); 
            if (!res || res.ok === false) {
                if (res && res.reason === 'duplicate') {
                    alert(`Duplicate MAC at position ${res.index + 1}. Replacement aborted.`);
                } else {
                    alert('Invalid MAC. Please enter 12 hex digits (e.g., AA:BB:CC:DD:EE:FF).');
                }
            } else {
                renderDeviceList(); 
            }
        }
    };

    window.cancelReplace = cancelReplace;
    window.confirmReplace = confirmReplace;

    console.log("[Init] Globals bound. Switching mode...");

    // Modal input listeners (Simple tab)
    bindTargetInput(
        () => updateCalcPace(),
        () => {
            const targetInput = document.getElementById('modal-target-time');
            const sec = targetInput ? parseTimeStr(targetInput.value) : 0;
            if (sec > 0 && targetInput) targetInput.value = formatTime(sec);
            updateCalcPace();
        }
    );

    // Initial Render
    const savedMode = localStorage.getItem('glow_current_mode') || 'race';
    try {
        // Force at least one race if empty (Fail-safe)
        if (!races || races.length === 0) {
            console.warn("[Init] No races found (even after load). Creating default.");
            races.length = 0; 
            addNewRow(); // This pushes to 'races' and saves.
        }
        
        switchMode(savedMode, true);
    } catch(e) {
        console.error("[Init] Switch Mode Failed, falling back to 'setup'", e);
        switchMode('setup', true);
    }
    const raceTbody = getRaceTableBody();
    attachRaceTableHandlers(raceTbody, {
        onToggleRow: toggleRow,
        onConnect: connectBLE,
        onSync: syncRaceWrapper,
        onStart: startRaceWrapper,
        onStop: stopRaceWrapper,
        onFinalize: finalizeRace,
        onReset: resetRace,
        onUpdateStartPos: updateStartPos
    });
    const setupTbody = getSetupTableBody();
    attachSetupTableHandlers(setupTbody, {
        onOpenModal: openModal,
        onOpenPacerModal: openModal,
        onDeleteRace: deleteRow,
        onUpdateField: updateData
    });
}

function handleNotification(event) {
    if (isSyncing) {
        console.warn("[Notification] Ignored during sync");
        return;
    }
    const value = event.target.value;
    const data = [];
    for (let i = 0; i < value.byteLength; i++) {
        data.push(value.getUint8(i));
    }
    
    if (data.length >= 12) {
        let macBytes = data.slice(6, 12);
        if (macBytes.some(b => b !== 0)) {
            let macStr = macBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':');
            if (macStr.startsWith('CC:33') || macStr === '00:00:00:00:00:00') {
                console.warn("[Notification] Ignored blocked MAC:", macStr);
                return;
            }
            if (deviceInteraction.mode === 'replacing') {
                deviceInteraction.scannedMac = macStr;
                updateReplaceModalUI(macStr);
            } else {
                const res = addDeviceToList(macStr);
                if(res.added) renderDeviceList();
            }
        }
    }
}

function updateConnectionStatus(connected) {
    renderConnectionStatus(connected);
}

async function syncWrapper() {
    if(await syncAllDevices()) alert('同期完了');
}

// --- Navigation ---

function loadAppState() {
    const savedTitle = localStorage.getItem('glow_competition_title');
    if(savedTitle) {
        const input = document.getElementById('competition-title');
        if (input) {
            input.value = savedTitle;
            syncRaceTitle('competition-title', 'race-screen-title');
        }
    }
}

function saveCompetitionTitle(val) {
    localStorage.setItem('glow_competition_title', val);
    syncRaceTitle('competition-title', 'race-screen-title');
}

async function switchMode(mode, skipGuard = false) {
    const targetScreen = document.getElementById(`screen-${mode}`);
    if (!targetScreen) return;

    try {
        if (!skipGuard && document.getElementById('screen-devices').classList.contains('active') && mode !== 'devices') {
            if (await checkDirtyAndSync() === false) return;
        }
        if (!skipGuard && document.getElementById('screen-race').classList.contains('active') && mode !== 'race') {
            const activeRace = getActiveRace();
            if (activeRace && activeRace.status === 'running') {
                if (!confirm("レース実行中です。停止しますか？")) return;
                stopRaceWrapper(activeRace.id);
            }
        }
    } catch(e) { console.warn(e); }

    if (!renderScreenMode(mode)) return;
    localStorage.setItem('glow_current_mode', mode);
    
    if(mode==='setup') renderSetup();
    if(mode==='race') {
        syncRaceTitle('competition-title', 'race-screen-title');
        renderRace();
    }
    if(mode === 'devices') renderDeviceList();
}

// --- SETUP SCREEN ---

function renderSetup() {
    const tb = getSetupTableBody(); 
    if(!tb) return;
    renderSetupTable(tb, races);
}

function updateData(id, f, v) { 
    const r = getRaceById(id); 
    if(!r) return;
    if(f==='distance') {
        const prevDist = r.distance;
        const pacerCount = r.pacers ? r.pacers.length : 0;
        let d = ensureNonNegativeNumber(v, 0);
        if (pacerCount > 0 && d !== prevDist) {
            const ok = confirm("距離変更に伴いペーサー設定を削除します。続行しますか？");
            if (!ok) { renderSetup(); return; }
            r.pacers = [];
            markSyncNeeded(r);
        }
        r.distance = d;
        let mod = d % 400;
        r.startPos = (mod === 0) ? 0 : (400 - mod);
        saveRaces();
        renderSetup();
    } else {
        const isNumeric = (f==='count'||f==='group'||f==='startPos');
        if (f === 'time') {
            const parsed = parseTimeInput(v, r.time);
            r[f] = parsed === null ? r.time : formatTime(parsed);
        } else {
            r[f] = isNumeric ? ensurePositiveInt(v, 0) : v; 
        }
        if (f === 'startPos') markSyncNeeded(r);
        saveRaces();
    }
}

function addNewRow() { addNewRace(); saveRaces(); renderSetup(); }

function deleteRow(id) { 
    if(confirm("削除?")){
        const idx = races.findIndex(r=>r.id===id);
        if(idx>=0) races.splice(idx,1);
        saveRaces(); renderSetup();
    } 
}

// --- RACE SCREEN ---

function toggleRow(id, event) {
    if (event && isButtonOrInput(event.target)) return;
    toggleExpandedRace(id);
    renderRace();
}

function renderRace() {
    console.log("[renderRace] Start. Races count:", races.length);
    renderRaceScreen(races, getExpandedRaceId(), getEditingPaces());
}

async function startRaceWrapper(id) {
    if (!requireConnection("START実行")) return;
    const r = getRaceById(id);
    if (!r) {
        alert("対象レースが見つかりません。再読み込み後にやり直してください。");
        return;
    }
    const startResult = await startRaceService(
        r,
        id,
        r.startPos,
        () => {
            const active = getActiveRace();
            return active && active.id !== id && active.status === 'running';
        },
        { dryRun: false },
        { sendStop: false, resendConfig: false }
    );
    if (!startResult || !startResult.ok) {
        showStartError(startResult?.reason);
        return;
    }
    if (startResult && startResult.records) {
        console.log("[startRaceWrapper] Start command records:", startResult.records.length, startResult.records);
    }
    markOtherRacesUnsynced(races, id);
    resetElapsedTime();
    clearRaceInterval();
    renderRace();
    setRaceInterval(setInterval(() => { updateState(id); }, UI_CONSTANTS.UPDATE_INTERVAL_MS));
}

async function stopRaceWrapper(id) {
    const dryRun = !isConnected;
    if (dryRun) {
        alert("BLE未接続のためSTOP信号は送れません。表示のみ停止します。");
    }
    try {
        const race = getRaceById(id);
        const res = await stopRaceService(race, { dryRun });
        if (res && res.records) {
            console.log("[stopRaceWrapper] Stop command records:", res.records.length, res.records);
        }
    } catch (e) {
        console.error("[stopRaceWrapper] Failed to send stopRunner:", e);
    }
    freezeRace(id);
}

async function syncRaceWrapper(id) {
    if (!requireConnection("同期")) return;
    const r = getRaceById(id);
    if (!r) {
        alert("対象レースが見つかりません。再読み込み後にやり直してください。");
        return;
    }
    if (!r.pacers || r.pacers.length === 0) {
        alert("ペーサーが設定されていません。設定後に同期してください。");
        return;
    }
    const res = await syncRaceConfigs(r, { dryRun: false });
    if (res.ok) {
        console.log("[syncRaceWrapper] Synced race", { raceId: r.id, commands: res.records?.length });
        saveRaces();
        markOtherRacesUnsynced(races, r.id);
        renderRace();
        alert("同期完了（色/ペース送信）");
    }
}

async function updateState(raceId) {
    const race = raceId ? getRaceById(raceId) : getActiveRace();
    if(!race || race.status !== 'running' || !race.pacers) {
        clearRaceInterval();
        return;
    }
    const tickResult = advanceRaceTick(race, getElapsedTime(), deviceSettings.interval);
    setElapsedTime(tickResult.elapsedTime);

    updateRunningRaceView(race, getElapsedTime());

    if(tickResult.allFinished) {
        try {
            const res = await stopRaceService(race, { dryRun: false });
            if (res && res.records) {
                console.log("[updateState] stopRunner sent after finish:", res.records.length, res.records);
            }
        } catch (e) {
            console.error("[updateState] stopRaceService failed:", e);
        }
        freezeRace(race.id);
    }
}

function freezeRace(id) {
    clearRaceInterval();
    resetElapsedTime();
    const r = getRaceById(id);
    if (!r) return;
    transitionToReview(r);
    renderRace();
    saveRaces();
}

function finalizeRace(id) { const r = getRaceById(id); finalizeRaceState(r); setExpandedRaceId(null); renderRace(); saveRaces(); }
function resetRace(id) { const r = getRaceById(id); resetRaceState(r); setExpandedRaceId(null); renderRace(); saveRaces(); }
function updateStartPos(id, val) { 
    const r = getRaceById(id); 
    if (!r) return;
    const sanitized = ensureNonNegativeNumber(val, 0);
    if (sanitized !== val) {
        console.warn("[updateStartPos] startPos sanitized", { raceId: id, raw: val, sanitized });
    }
    r.startPos = sanitized; 
    markSyncNeeded(r);
    saveRaces();
    renderRace();
}

// --- MODAL ---
function openModal(rid, pid) { 
    resetModalState(modalState);
    setModalTarget(modalState, { raceId: rid, pacerId: pid });
    const r = getRaceById(rid); 
    if (!r) {
        alert("対象レースが見つかりません。再読み込み後にやり直してください。");
        return;
    }
    
    // Reset Tab (default to simple)
    switchModalTab('simple');
    
    if(pid){ 
        const p=r.pacers.find(x=>x.id===pid); 
        selectModalColor(p.color); 
        
        // Load Data
        if (p.type === 'segments' && p.segments && p.segments.length > 0) {
            switchModalTab('segments');
            renderSegmentTable(p.segments, document.getElementById('segment-tbody'), updateSegmentSummaryFromDom);
        } else {
            // Simple Mode
            let tVal = "";
            if (p.targetTime) tVal = formatTime(p.targetTime);
            else if (p.pace) {
                let totalSec = (r.distance / 400) * p.pace;
                tVal = formatTime(totalSec);
            }
            setTargetTimeValue(tVal);
            updateCalcPace();
        }
        // Preference: if segments exist, segments tab takes priority
        if (p.type === 'segments' && p.segments && p.segments.length > 0) {
            switchModalTab('segments');
        } else {
            switchModalTab('simple');
        }
    } else { 
        // New Pacer
        selectModalColor('red'); 
        setTargetTimeValue("");
        setCalcPaceText("--.-");
        updateSegmentSummaryFromDom();
        renderSegmentTable([], document.getElementById('segment-tbody'), updateSegmentSummaryFromDom);
    } 
    openModalUI();
}

function closeModal() { closeModalUI(); }
function selectModalColor(c) { 
    setSelectedColor(modalState, c);
    setColorSelection(c);
}

function switchModalTab(tab) {
    setActiveTab(modalState, tab);
    setActiveTabUI(tab);
    if (tab === 'segments') updateSegmentSummaryFromDom();
}

function updateCalcPace() {
    const val = document.getElementById('modal-target-time')?.value;
    const r = getRaceById(modalState.target.raceId);
    const pace = r ? computePaceFromTarget(r.distance, val) : null;
    setCalcPaceText(pace && pace > 0 ? formatPace(pace) : "--.-");
}

function saveModalData() { 
    const r = getRaceById(modalState.target.raceId);
    if (!r) return alert("対象レースが見つかりません。再読み込み後にやり直してください。");
    if (!r.distance) return alert("レース距離を設定してください");
    let pacerData = {
        id: modalState.target.pacerId || Date.now(),
        color: modalState.selectedColor,
        currentDist: 0,
        finishTime: null
    };

    if (modalState.activeTab === 'simple') {
        // In simple mode, any existing segments are cleared
        const tStr = document.getElementById('modal-target-time')?.value;
        const totalSec = parseTimeStr(tStr);
        if (totalSec <= 0) return alert("目標タイムを入力してください");
        
        pacerData.type = 'target_time';
        pacerData.targetTime = totalSec;
        pacerData.pace = roundToTenth((totalSec / r.distance) * 400); 
        pacerData.runPlan = PaceCalculator.createPlanFromTargetTime(r.distance, totalSec, 400);
        pacerData.segments = [];
        
    } else {
        const rows = document.querySelectorAll('#segment-tbody tr');
        const segResult = buildSegmentsForSave(r, rows);
        if (!segResult) return alert("区間を入力してください");
        pacerData = { ...pacerData, ...segResult };
    }

    if (modalState.target.pacerId) {
        const idx = r.pacers.findIndex(x => x.id === modalState.target.pacerId);
        if (idx >= 0) {
            r.pacers[idx] = { ...r.pacers[idx], ...pacerData };
        }
    } else {
        r.pacers.push(pacerData);
    }
    markSyncNeeded(r);
    saveRaces(); 
    closeModal(); 
    renderSetup(); 
}

function deletePacerFromModal() { if(modalState.target.pacerId && confirm('削除?')) { const r=getRaceById(modalState.target.raceId); if (r) { r.pacers=r.pacers.filter(x=>x.id!==modalState.target.pacerId); saveRaces(); } } closeModal(); renderSetup(); }

function startEditing(pid, v) { setEditingPace(pid, parseFloat(v)); renderRace(); }
function updateEditValue(pid, v) { setEditingPace(pid, parseFloat(v)); /* don't re-render on every key, just store */ }
function adjustPace(pid, d) { /* logic */ } // Simplification for now
function cancelPace(rid, pid) { clearEditingPace(pid); renderRace(); }
function commitPace(rid, pid) { /* logic */ renderRace(); saveRaces(); }

function updateSegmentSummaryFromDom() {
    const summaryEl = document.getElementById('segment-total-time');
    if (!summaryEl) return;
    const r = getRaceById(modalState.target.raceId);
    if (!r) return;
    const rows = document.querySelectorAll('#segment-tbody tr');
    const summary = computeSegmentSummaryText(r, rows);
    summaryEl.innerText = summary.text;
}

// Fallback global bindings in case initUI fails early
if (typeof window !== 'undefined') {
    window.switchModalTab = window.switchModalTab || switchModalTab;
}

function renderDeviceList() {
    const container = document.getElementById('device-list-container');
    if (!container) return;
    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    
    // Update Count Display
    const countEl = document.getElementById('device-count-display');
    if (countEl) {
        countEl.innerText = `${deviceList.length} / ${maxDevices}`;
    }

    container.innerHTML = buildDeviceGridHtml(deviceList, deviceSettings, deviceInteraction);
    const grid = document.getElementById('device-grid');
    attachDeviceGridHandlers(grid, {
        getMode: () => deviceInteraction.mode,
        onSwapMode: (idx) => startSwapMode(idx),
        onOpenDevice: (idx) => openDeviceActionMenu(idx)
    });
}

// CSV functions...
function downloadCSV() {}
function importCSV(input) {}
function fillWithDummy() {
    if(confirm("未設定の箇所をすべてダミーとして埋めますか？")) {
        fillRemainingWithDummy();
        renderDeviceList();
    }
}
function testBlinkDevice(i) {
    const d = deviceList[i];
    if (!d || !d.mac || d.status === 'dummy' || d.mac === '00:00:00:00:00:00') {
        alert("デバイスが設定されていません。置換または設置してから試験点灯してください。");
        return;
    }
    sendCommand(BluetoothCommunity.commandMakeLightUp(i+1, d.mac));
}

function startReplaceMode(i) {
    deviceInteraction.mode = 'replacing';
    deviceInteraction.targetIndex = i;
    deviceInteraction.scannedMac = null;
    updateReplaceModalUI("Scanning... (Press Button on Device)");
}
function startSwapMode(i) {
    if(deviceInteraction.mode === 'swapping') {
        // Execute
        swapDevices(deviceInteraction.targetIndex, i);
        deviceInteraction.mode = 'normal';
        deviceInteraction.targetIndex = -1;
    } else {
        deviceInteraction.mode = 'swapping';
        deviceInteraction.targetIndex = i;
    }
    renderDeviceList();
}

// --- Missing Implementations ---

function cancelReplace() {
    deviceInteraction.mode = 'normal';
    deviceInteraction.targetIndex = -1;
    deviceInteraction.scannedMac = null;
    const el = document.getElementById('modal-replace-overlay');
    if(el) el.remove();
    renderDeviceList();
}

function confirmReplace() {
    if (deviceInteraction.mode === 'replacing' && deviceInteraction.scannedMac) {
        replaceDevice(deviceInteraction.targetIndex, deviceInteraction.scannedMac);
        alert(`Device #${deviceInteraction.targetIndex+1} replaced with ${deviceInteraction.scannedMac}`);
        cancelReplace();
    } else {
        alert("No device scanned yet to replace with.");
    }
}

function updateReplaceModalUI(mac) {
    let el = document.getElementById('modal-replace-overlay');
    if (!el) {
        el = renderReplaceModal(deviceInteraction.targetIndex, "Scanning... (Press Button on Device)");
        appendReplaceOverlay(el);
        el.addEventListener('click', (e) => {
            if (e.target === el) el.remove();
            const actionEl = e.target.closest('[data-action]');
            if (!actionEl) return;
            if (actionEl.dataset.action === 'replace-cancel') cancelReplace();
            if (actionEl.dataset.action === 'replace-confirm') confirmReplace();
        });
    }
    updateReplaceMacText(mac);
}

function openDeviceActionMenu(i) {
    const d = deviceList[i];
    const dist = i * deviceSettings.interval;
    
    const overlay = createDeviceOverlay(buildDeviceOverlayHtml(i, dist, d));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            return;
        }
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const idx = parseInt(actionEl.dataset.idx, 10);
        const action = actionEl.dataset.action;
        if (action === 'modal-close') { overlay.remove(); return; }
        if (Number.isNaN(idx)) return;
        if (action === 'device-blink') triggerBlink(idx);
        if (action === 'device-swap') { triggerStartSwap(idx); overlay.remove(); }
        if (action === 'device-replace-scan') { triggerStartReplace(idx); overlay.remove(); }
        if (action === 'device-replace-manual') { triggerReplace(idx); overlay.remove(); }
        if (action === 'device-dummy') { triggerDummy(idx); overlay.remove(); }
        if (action === 'device-remove') { triggerRemove(idx); overlay.remove(); }
    });
    appendOverlay(overlay);
}

// Device grid handlers moved to device-grid-events for clarity.
