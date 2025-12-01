import { races, saveRaces, loadRaces, activeRaceId, setActiveRaceId } from '../core/race-manager.js';
import { deviceList, deviceSettings, deviceInteraction, markDeviceListDirty, loadDeviceList, updateSettings, addDeviceToList, swapDevices, replaceDevice, removeDevice, syncAllDevices, setDeviceToDummy, checkDirtyAndSync, fillRemainingWithDummy, saveDeviceList, isSyncing } from '../core/device-manager.js';
import { connectBLE, isConnected, sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';
import { PaceCalculator } from '../core/pace-calculator.js';
import { roundToTenth, formatPace, formatPaceLabel, formatTime } from '../utils/render-utils.js';
import { sanitizeNumberInput, sanitizePositiveInt, parseTimeInput, resolvePaceValue, escapeHTML } from '../utils/data-utils.js';
import { getColorRGB } from '../utils/color-utils.js';
import { advanceRaceTick, startRaceService, sendStopRunner, transitionToReview, finalizeRaceState, resetRaceState, markSyncNeeded, stopRaceService } from '../core/race-service.js';
import { prepareRacePlans, sendInitialConfigs, syncRaceConfigs } from '../core/race-sync-service.js';
import { buildSetupPacerChips } from './race-view-model.js';
import { buildRaceTableHTML, updateRunningDisplays } from './race-renderer.js';
import { clearEditingPace, clearRaceInterval, getEditingPaces, getElapsedTime, getExpandedRaceId, resetElapsedTime, setEditingPace, setElapsedTime, setExpandedRaceId, setRaceInterval, toggleExpandedRace } from './race-ui-state.js';
import { attachRaceTableHandlers } from './race-table-events.js';
import { markRaceUnsynced, markOtherRacesUnsynced } from './race-unsync-helpers.js';
// modalTarget and modalSelectedColor are now part of modalState
let modalState = {
    target: {},
    selectedColor: 'red',
    activeTab: 'simple'
};

const UI_CONSTANTS = {
    PROGRESS_BAR_PADDING_METERS: 50,
    FINISH_MARGIN_METERS: 50,
    PRESEND_MARGIN_METERS: 10,
    UPDATE_INTERVAL_MS: 100
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
    window.addSegmentRow = addSegmentRow;
    window.removeSegmentRow = removeSegmentRow;
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
        const r = races.find(rc => rc.id === expandedRaceId);
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
    const targetInput = document.getElementById('modal-target-time');
    if (targetInput) {
        targetInput.addEventListener('input', () => {
            updateCalcPace();
        });
        targetInput.addEventListener('blur', () => {
            const sec = parseTimeStr(targetInput.value);
            if (sec > 0) targetInput.value = formatTime(sec);
            updateCalcPace();
        });
    }

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
    const tbody = document.getElementById('race-tbody');
    attachRaceTableHandlers(tbody, {
        onToggleRow: toggleRow,
        onConnect: connectBLE,
        onSync: syncRaceWrapper,
        onStart: startRaceWrapper,
        onStop: stopRaceWrapper,
        onFinalize: finalizeRace,
        onReset: resetRace,
        onUpdateStartPos: updateStartPos
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
    const el = document.querySelector('.ble-status');
    const btn = document.querySelector('.btn-connect');
    if(connected) { 
        if(el) { el.innerHTML = '● 接続完了'; el.style.color = 'var(--success-color)'; }
        if(btn) { btn.innerHTML = '🔌 切断'; btn.style.background = '#EEE'; btn.style.color='#555'; }
    } else { 
        if(el) { el.innerHTML = '● 未接続'; el.style.color = '#999'; }
        if(btn) { btn.innerHTML = '📡 接続'; btn.style.background='#EEF2F5'; btn.style.color='var(--info-color)'; }
    }
}

async function syncWrapper() {
    if(await syncAllDevices()) alert('同期完了');
}

// --- Navigation ---

function loadAppState() {
    const savedTitle = localStorage.getItem('glow_competition_title');
    if(savedTitle) document.getElementById('competition-title').value = savedTitle;
}

function saveCompetitionTitle(val) {
    localStorage.setItem('glow_competition_title', val);
    document.getElementById('race-screen-title').innerText = val;
}

async function switchMode(mode, skipGuard = false) {
    if (!document.getElementById('screen-'+mode)) return;

    try {
        if (!skipGuard && document.getElementById('screen-devices').classList.contains('active') && mode !== 'devices') {
            if (await checkDirtyAndSync() === false) return;
        }
        if (!skipGuard && document.getElementById('screen-race').classList.contains('active') && mode !== 'race') {
            if (activeRaceId !== null) {
                const r = races.find(x => x.id === activeRaceId);
                if (r && r.status === 'running') {
                    if (!confirm("レース実行中です。停止しますか？")) return;
                    stopRaceWrapper(activeRaceId);
                }
            }
        }
    } catch(e) { console.warn(e); }

    document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(e => e.classList.remove('active'));
    document.getElementById('screen-'+mode).classList.add('active');
    document.getElementById('btn-mode-'+mode).classList.add('active');
    localStorage.setItem('glow_current_mode', mode);
    
    if(mode==='setup') renderSetup();
    if(mode==='race') {
        const t = document.getElementById('competition-title');
        if(t) document.getElementById('race-screen-title').innerText = t.value;
        renderRace();
    }
    if(mode === 'devices') renderDeviceList();
}

// --- SETUP SCREEN ---

function renderSetup() {
    const tb = document.getElementById('setup-tbody'); 
    if(!tb) return;
    tb.innerHTML = '';
    races.forEach(r => {
        const ph = buildSetupPacerChips(r);
        let tr = document.createElement('tr');
        const timeVal = escapeHTML(r.time);
        const nameVal = escapeHTML(r.name);
        const groupVal = escapeHTML(r.group);
        const distanceVal = escapeHTML(r.distance);
        const startPosVal = escapeHTML(r.startPos);
        const countVal = escapeHTML(r.count);
        tr.innerHTML = `
            <td><input type="time" class="input-cell" value="${timeVal}" onchange="updateData(${r.id}, 'time', this.value)"></td>
            <td><input type="text" class="input-cell" value="${nameVal}" onchange="updateData(${r.id}, 'name', this.value)"></td>
            <td><input type="number" class="input-cell" min="1" value="${groupVal}" onchange="updateData(${r.id}, 'group', this.value)"></td>
            <td><input type="number" class="input-cell" min="0" value="${distanceVal}" onchange="updateData(${r.id}, 'distance', this.value)"></td>
            <td><input type="number" class="input-cell input-start" min="0" value="${startPosVal}" onchange="updateData(${r.id}, 'startPos', this.value)" step="any"></td>
            <td><input type="number" class="input-cell" min="0" value="${countVal}" onchange="updateData(${r.id}, 'count', this.value)"></td>
            <td>${ph} <button class="btn-sm btn-outline" onclick="openModal(${r.id},null)">＋</button></td>
            <td><button class="btn-sm btn-danger" style="border:none; background:#FFF0F0;" onclick="deleteRow(${r.id})">削除</button></td>
        `;
        tb.appendChild(tr);
    });
}

function updateData(id, f, v) { 
    const r = races.find(x=>x.id===id); 
    if(r) {
        if(f==='distance') {
            const prevDist = r.distance;
            const pacerCount = r.pacers ? r.pacers.length : 0;
            let d = sanitizeNumberInput(v, 0);
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
                r[f] = isNumeric ? sanitizePositiveInt(v, 0) : v; 
            }
            if (f === 'startPos') markSyncNeeded(r);
            saveRaces();
        }
    } 
}

function addNewRow() { 
    races.push({id:Date.now(), time:"10:00", name:"New Race", group:1, distance:1000, startPos:0, count:10, status:"ready", pacers:[], markers:[]}); 
    saveRaces(); renderSetup(); 
}

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
    const tbody = document.getElementById('race-tbody');
    if(!tbody) { console.error("[renderRace] No tbody found!"); return; }
    const expandedRaceId = getExpandedRaceId();
    const editingPaces = getEditingPaces();
    tbody.innerHTML = buildRaceTableHTML(races, expandedRaceId, getElapsedTime(), editingPaces);
}

async function startRaceWrapper(id) {
    if (!requireConnection("START実行")) return;
    const r = races.find(x=>x.id===id);
    const startResult = await startRaceService(r, id, r.startPos, () => activeRaceId && activeRaceId !== id, { dryRun: false }, { sendStop: false, resendConfig: false });
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
    setRaceInterval(setInterval(() => { updateState(r); }, UI_CONSTANTS.UPDATE_INTERVAL_MS));
}

async function stopRaceWrapper(id) {
    const dryRun = !isConnected;
    if (dryRun) {
        alert("BLE未接続のためSTOP信号は送れません。表示のみ停止します。");
    }
    try {
        const race = races.find(x=>x.id===id);
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
    const r = races.find(rc => rc.id === id);
    if (!r) return;
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

async function updateState(race) {
    if(!race || !race.pacers) return;
    const tickResult = advanceRaceTick(race, getElapsedTime(), deviceSettings.interval);
    setElapsedTime(tickResult.elapsedTime);

    updateRunningDisplays(race, getElapsedTime());

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
    const r = races.find(x=>x.id===id);
    transitionToReview(r);
    setActiveRaceId(null);
    renderRace();
    saveRaces();
}

function finalizeRace(id) { const r = races.find(x=>x.id===id); finalizeRaceState(r); setActiveRaceId(null); setExpandedRaceId(null); renderRace(); saveRaces(); }
function resetRace(id) { const r = races.find(x=>x.id===id); resetRaceState(r); renderRace(); saveRaces(); }
function updateStartPos(id, val) { 
    const r = races.find(x=>x.id===id); 
    r.startPos = parseInt(val)||0; 
    markSyncNeeded(r);
    saveRaces();
    renderRace();
}

// --- MODAL ---
function openModal(rid, pid) { 
    modalState.target = {raceId:rid, pacerId:pid}; 
    const r=races.find(x=>x.id===rid); 
    
    // Reset Tab (default to simple)
    switchModalTab('simple');
    
    if(pid){ 
        const p=r.pacers.find(x=>x.id===pid); 
        selectModalColor(p.color); 
        
        // Load Data
        if (p.type === 'segments' && p.segments && p.segments.length > 0) {
            switchModalTab('segments');
            renderSegmentTable(p.segments);
        } else {
            // Simple Mode
            let tVal = "";
            if (p.targetTime) tVal = formatTime(p.targetTime);
            else if (p.pace) {
                let totalSec = (r.distance / 400) * p.pace;
                tVal = formatTime(totalSec);
            }
            document.getElementById('modal-target-time').value = tVal;
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
        document.getElementById('modal-target-time').value = "";
        document.getElementById('modal-calc-pace').innerText = "--.-";
        updateSegmentSummary();
        renderSegmentTable([]);
    } 
    document.getElementById('modal-settings').classList.add('open'); 
}

function closeModal() { document.getElementById('modal-settings').classList.remove('open'); }
function selectModalColor(c) { 
    modalState.selectedColor = c; 
    document.querySelectorAll('.color-option').forEach(e=>e.classList.remove('selected')); 
    document.querySelector('.bg-'+c).classList.add('selected'); 
}

function switchModalTab(tab) {
    modalState.activeTab = tab;
    document.querySelectorAll('.modal-tab').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById('tab-btn-'+tab).classList.add('active');
    document.getElementById('tab-content-'+tab).classList.add('active');
    if (tab === 'segments') updateSegmentSummary();
}

function updateCalcPace() {
    const val = document.getElementById('modal-target-time').value;
    const sec = parseTimeStr(val);
    const r = races.find(x => x.id === modalState.target.raceId);
    if (sec > 0 && r && r.distance > 0) {
        const pace = (sec / r.distance) * 400;
        document.getElementById('modal-calc-pace').innerText = formatPace(pace);
    } else {
        document.getElementById('modal-calc-pace').innerText = "--.-";
    }
}

function parseTimeStr(str) {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length === 2) {
        return (parseInt(parts[0]) * 60) + parseFloat(parts[1]);
    } else {
        return parseFloat(str);
    }
}

function renderSegmentTable(segments) {
    const tbody = document.getElementById('segment-tbody');
    tbody.innerHTML = '';
    segments.forEach((s, idx) => {
        addSegmentRow(s.distance, s.pace);
    });
    if (segments.length === 0) addSegmentRow(400, 72); 
    updateSegmentSummary();
}

function addSegmentRow(dist = "", pace = "") {
    const tbody = document.getElementById('segment-tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="number" class="segment-input inp-dist" value="${dist}" step="100"></td>
        <td><input type="number" class="segment-input inp-pace" value="${pace}" step="0.1"></td>
        <td><button class="btn-sm btn-danger" onclick="removeSegmentRow(this)">×</button></td>
    `;
    tbody.appendChild(tr);
    tr.querySelectorAll('input').forEach(inp => {
        inp.addEventListener('input', updateSegmentSummary);
        inp.addEventListener('change', updateSegmentSummary);
    });
    updateSegmentSummary();
}

function removeSegmentRow(btn) {
    btn.closest('tr').remove();
    updateSegmentSummary();
}

function saveModalData() { 
    const r = races.find(x => x.id === modalState.target.raceId);
    if (!r || !r.distance) return alert("レース距離を設定してください");
    let pacerData = {
        id: modalState.target.pacerId || Date.now(),
        color: modalState.selectedColor,
        currentDist: 0,
        finishTime: null
    };

    if (modalState.activeTab === 'simple') {
        // In simple mode, any existing segments are cleared
        const tStr = document.getElementById('modal-target-time').value;
        const totalSec = parseTimeStr(tStr);
        if (totalSec <= 0) return alert("目標タイムを入力してください");
        
        pacerData.type = 'target_time';
        pacerData.targetTime = totalSec;
        pacerData.pace = roundToTenth((totalSec / r.distance) * 400); 
        pacerData.runPlan = PaceCalculator.createPlanFromTargetTime(r.distance, totalSec, 400);
        pacerData.segments = [];
        
    } else {
        const rows = document.querySelectorAll('#segment-tbody tr');
        const segments = [];
        rows.forEach(tr => {
            const d = parseFloat(tr.querySelector('.inp-dist').value);
            const p = parseFloat(tr.querySelector('.inp-pace').value);
            if (d > 0 && p > 0) segments.push({ distance: d, pace: roundToTenth(p) });
        });
        if (segments.length === 0) return alert("区間を入力してください");
        // ensure ascending cumulative distance
        segments.sort((a,b) => a.distance - b.distance);
        if (segments[segments.length - 1].distance < r.distance) {
            segments.push({ distance: r.distance, pace: segments[segments.length - 1].pace });
        }
        
        pacerData.type = 'segments';
        pacerData.segments = segments;
        pacerData.pace = roundToTenth(segments[0].pace); 
        pacerData.runPlan = PaceCalculator.createPlanFromSegments(segments, 400);
        pacerData.targetTime = null;
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

function deletePacerFromModal() { if(modalState.target.pacerId && confirm('削除?')) { const r=races.find(x=>x.id===modalState.target.raceId); r.pacers=r.pacers.filter(x=>x.id!==modalState.target.pacerId); saveRaces(); } closeModal(); renderSetup(); }

function startEditing(pid, v) { setEditingPace(pid, parseFloat(v)); renderRace(); }
function updateEditValue(pid, v) { setEditingPace(pid, parseFloat(v)); /* don't re-render on every key, just store */ }
function adjustPace(pid, d) { /* logic */ } // Simplification for now
function cancelPace(rid, pid) { clearEditingPace(pid); renderRace(); }
function commitPace(rid, pid) { /* logic */ renderRace(); saveRaces(); }

function openVersionModal() { document.getElementById('modal-version').classList.add('open'); }
function closeVersionModal() { document.getElementById('modal-version').classList.remove('open'); }

function updateSegmentSummary() {
    const summaryEl = document.getElementById('segment-total-time');
    if (!summaryEl) return;
    const r = races.find(x => x.id === modalState.target.raceId);
    if (!r || !r.distance) {
        summaryEl.innerText = "ゴール予想タイム: --:--.-";
        return;
    }
    const segments = [];
    document.querySelectorAll('#segment-tbody tr').forEach(tr => {
        const d = parseFloat(tr.querySelector('.inp-dist').value);
        const p = parseFloat(tr.querySelector('.inp-pace').value);
        if (d > 0 && p > 0) segments.push({ distance: d, pace: p });
    });
    if (segments.length === 0) {
        summaryEl.innerText = "ゴール予想タイム: --:--.-";
        return;
    }
    segments.sort((a,b) => a.distance - b.distance);
    if (segments[segments.length - 1].distance < r.distance) {
        segments.push({ distance: r.distance, pace: segments[segments.length - 1].pace });
    }
    const plan = PaceCalculator.createPlanFromSegments(segments, 400);
    const total = plan.length ? plan[plan.length - 1].endTime : 0;
    summaryEl.innerText = `ゴール予想タイム: ${total > 0 ? formatTime(total) : '--:--.-'}`;
}

// Fallback global bindings in case initUI fails early
if (typeof window !== 'undefined') {
    window.switchModalTab = window.switchModalTab || switchModalTab;
    window.addSegmentRow = window.addSegmentRow || addSegmentRow;
    window.removeSegmentRow = window.removeSegmentRow || removeSegmentRow;
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

    let html = `<div class="device-grid ${deviceInteraction.mode === 'swapping' ? 'mode-swapping' : ''}">`;
    for (let i = 0; i < maxDevices; i++) {
        const d = deviceList[i];
        const dist = i * deviceSettings.interval;
        let cellClass = 'device-cell';
        if (deviceInteraction.mode === 'swapping' && deviceInteraction.targetIndex === i) cellClass += ' swap-source';
        let macDisplay = '';
        if (d) {
            if(d.status==='dummy') { cellClass += ' cell-dummy'; macDisplay='(DUMMY)'; }
            else { cellClass += ' cell-active'; macDisplay=d.mac.slice(-5); } // Simplified
        } else { cellClass += ' cell-empty'; }
        
        let onClick = `openDeviceActionMenu(${i})`;
        if (deviceInteraction.mode === 'swapping') onClick = `triggerStartSwap(${i})`; // Wait, executeSwap?
        // Re-bind execute logic needs export
        
        html += `<div class="${cellClass}" onclick="${onClick}"><span>#${i+1} ${dist}m</span><br><small>${macDisplay}</small></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;
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
function testBlinkDevice(i) { sendCommand(BluetoothCommunity.commandMakeLightUp(i+1, deviceList[i].mac)); }

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
        el = document.createElement('div');
        el.id = 'modal-replace-overlay';
        el.className = 'modal-overlay open';
        el.innerHTML = `
            <div class="modal-content">
                <h3>Replace Device</h3>
                <p>Target: #${deviceInteraction.targetIndex + 1}</p>
                <p>Detected MAC: <strong id="replace-mac-display" style="font-size:1.2em; color:var(--primary-color);">Scanning...</strong></p>
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
                    <button class="btn-sm btn-outline" onclick="cancelReplace()">Cancel</button>
                    <button class="btn-sm btn-primary" onclick="confirmReplace()">Replace</button>
                </div>
            </div>
        `;
        document.body.appendChild(el);
    }
    const display = document.getElementById('replace-mac-display');
    if(display) display.innerText = mac;
}

function openDeviceActionMenu(i) {
    const d = deviceList[i];
    const dist = i * deviceSettings.interval;
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };
    
    overlay.innerHTML = `
        <div class="modal-content" style="width:320px;">
            <h3 style="margin-top:0;">Device #${i+1} (${dist}m)</h3>
            <p style="color:#888; margin-bottom:20px;">MAC: ${d ? d.mac : 'None'} <br> Status: ${d ? d.status : 'Empty'}</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <button class="btn-sm btn-outline" onclick="triggerBlink(${i})">💡 Test Blink</button>
                <button class="btn-sm btn-outline" onclick="triggerStartSwap(${i}); this.closest('.modal-overlay').remove();">⇄ Swap Position</button>
                <button class="btn-sm btn-outline" onclick="triggerStartReplace(${i}); this.closest('.modal-overlay').remove();">🔄 Replace (Scan)</button>
                 <button class="btn-sm btn-outline" onclick="triggerReplace(${i}); this.closest('.modal-overlay').remove();">✏️ Edit MAC Manually</button>
                <button class="btn-sm btn-outline" onclick="triggerDummy(${i}); this.closest('.modal-overlay').remove();">👻 Set to Dummy</button>
                <button class="btn-sm btn-danger" onclick="triggerRemove(${i}); this.closest('.modal-overlay').remove();">🗑 Remove</button>
            </div>
            <div style="margin-top:20px; text-align:right;">
                <button class="btn-sm" onclick="this.closest('.modal-overlay').remove()">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}
