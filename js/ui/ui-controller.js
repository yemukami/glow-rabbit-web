import { races, saveRaces, loadRaces, activeRaceId, setActiveRaceId, sendRaceConfig, sendStartRace, sendStopRace } from '../core/race-manager.js';
import { deviceList, deviceSettings, deviceInteraction, isListDirty, loadDeviceList, updateSettings, addDeviceToList, swapDevices, replaceDevice, removeDevice, syncAllDevices, setDeviceToDummy, checkDirtyAndSync, fillRemainingWithDummy } from '../core/device-manager.js';
import { connectBLE, isConnected, sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';

let expandedRaceId = null;
let editingPaces = {};
let raceInterval = null;
let elapsedTime = 0;
let modalTarget = {};
let modalSelectedColor = 'red';

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
    window.connectBLE = () => connectBLE(
        () => updateConnectionStatus(false), 
        handleNotification
    ).then(() => updateConnectionStatus(true));
    
    window.checkDirtyAndSync = checkDirtyAndSync;
    
    // Setup
    window.saveCompetitionTitle = saveCompetitionTitle;
    window.addNewRow = addNewRow;
    window.deleteRow = deleteRow;
    window.openModal = openModal;
    window.closeModal = closeModal;
    window.selectModalColor = selectModalColor;
    window.saveModalData = saveModalData;
    window.deletePacerFromModal = deletePacerFromModal;
    window.updateData = updateData;
    
    // Race
    window.toggleRow = toggleRow;
    window.startRaceWrapper = startRaceWrapper;
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
    window.clearDeviceList = () => { if(confirm('All Clear?')) { deviceList.length=0; renderDeviceList(); } };
    window.syncAllDevices = syncWrapper;
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
        if(newMac) { replaceDevice(i, newMac); renderDeviceList(); }
    };

    window.cancelReplace = cancelReplace;
    window.confirmReplace = confirmReplace;

    console.log("[Init] Globals bound. Switching mode...");

    // Initial Render
    const savedMode = localStorage.getItem('glow_current_mode') || 'race';
    try {
        // Force at least one race if empty (Fail-safe)
        if (!races || races.length === 0) {
            console.warn("[Init] No races found (even after load). Creating default.");
            races = []; 
            addNewRow(); // This pushes to 'races' and saves.
        }
        
        switchMode(savedMode, true);
    } catch(e) {
        console.error("[Init] Switch Mode Failed, falling back to 'setup'", e);
        switchMode('setup', true);
    }
}

function handleNotification(event) {
    const value = event.target.value;
    const data = [];
    for (let i = 0; i < value.byteLength; i++) {
        data.push(value.getUint8(i));
    }
    
    if (data.length >= 12) {
        let macBytes = data.slice(6, 12);
        if (macBytes.some(b => b !== 0)) {
            let macStr = macBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':');
            
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
        let ph = r.pacers.map(p=>`<span class="pacer-chip" onclick="openModal(${r.id},${p.id})"><span class="dot bg-${p.color}"></span>${p.pace}s</span>`).join('');
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="time" class="input-cell" value="${r.time}" onchange="updateData(${r.id}, 'time', this.value)"></td>
            <td><input type="text" class="input-cell" value="${r.name}" onchange="updateData(${r.id}, 'name', this.value)"></td>
            <td><input type="number" class="input-cell" value="${r.group}" onchange="updateData(${r.id}, 'group', this.value)"></td>
            <td><input type="number" class="input-cell" value="${r.distance}" onchange="updateData(${r.id}, 'distance', this.value)"></td>
            <td><input type="number" class="input-cell input-start" value="${r.startPos}" onchange="updateData(${r.id}, 'startPos', this.value)"></td>
            <td><input type="number" class="input-cell" value="${r.count}" onchange="updateData(${r.id}, 'count', this.value)"></td>
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
            let d = parseInt(v)||0;
            r.distance = d;
            let mod = d % 400;
            r.startPos = (mod === 0) ? 0 : (400 - mod);
            saveRaces();
            renderSetup();
        } else {
            r[f] = (f==='count'||f==='group'||f==='startPos')?parseInt(v)||0:v; 
            saveRaces();
        }
    } 
}

function addNewRow() { 
    races.push({id:Date.now(), time:"10:00", name:"New Race", group:1, distance:1000, startPos:200, count:10, status:"ready", pacers:[], markers:[]}); 
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
    if (event.target.tagName === 'BUTTON' || event.target.tagName === 'INPUT') return;
    expandedRaceId = (expandedRaceId === id) ? null : id;
    renderRace();
}

function renderRace() {
    console.log("[renderRace] Start. Races count:", races.length);
    const tbody = document.getElementById('race-tbody');
    if(!tbody) { console.error("[renderRace] No tbody found!"); return; }
    tbody.innerHTML = '';
    
    if (!races || races.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align:center; padding:20px; color:#999;">レースデータがありません。<br>設定画面から追加してください。</td></tr>';
        return;
    }
    
    races.forEach(r => {
        try {
            const tr = document.createElement('tr');
            let rowClass = 'race-row';
            if (r.id === expandedRaceId) rowClass += ' expanded';
            if (r.status === 'running') rowClass += ' active-running';
            if (r.status === 'review') rowClass += ' active-review';
            if (r.status === 'finished') rowClass += ' finished';
            tr.className = rowClass;
            tr.onclick = (e) => toggleRow(r.id, e);

            let content = '';
            const isExpanded = (r.id === expandedRaceId);
            let badge = '';
            if(r.status === 'ready') badge = '<span class="status-badge status-ready">待機</span>';
            if(r.status === 'running') badge = '<span class="status-badge status-running">実行中</span>';
            if(r.status === 'review') badge = '<span class="status-badge status-review">記録確認</span>';
            if(r.status === 'finished') badge = '<span class="status-badge status-finished">完了</span>';

            if (!isExpanded) {
                let chips = "";
                if(r.pacers && Array.isArray(r.pacers)) {
                    chips = r.pacers.map(p => `<span class="pacer-chip"><span class="dot bg-${p.color||'red'}"></span>${p.pace||72}s</span>`).join(' ');
                }
                content = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <strong style="font-size:16px;">${r.time} ${r.name}</strong> 
                            <span style="color:#8E8E93; margin-left:10px;">${r.group}組 (${r.distance}m)</span>
                            ${badge}
                            <div style="margin-top:8px;">${chips}</div>
                        </div>
                        <div style="color:#C6C6C8; font-size:20px;">▼</div>
                    </div>`;
            } else {
                let pacerRows = "";
            if(r.pacers && Array.isArray(r.pacers)) {
                pacerRows = r.pacers.map(p => {
                    // Edit Logic...
                    const isEditing = editingPaces[p.id] !== undefined;
                const displayPace = isEditing ? editingPaces[p.id] : p.pace;
                const valClass = isEditing ? "pace-input changed" : "pace-input";
                const showAdjust = (r.status !== 'running' && r.status !== 'review' && r.status !== 'finished');
                const inputReadonly = !showAdjust ? "readonly" : "";
                const inputStyle = !showAdjust ? "border:none; background:transparent; color:var(--text-main);" : "";
                const btnGroupClass = isEditing ? "btn-commit-group visible" : "btn-commit-group";
                
                const btnMinus = showAdjust ? `<button class="btn-adjust" onclick="adjustPace(${p.id}, 0.5)">+</button>` : "";
                const btnPlus = showAdjust ? `<button class="btn-adjust" onclick="adjustPace(${p.id}, -0.5)">−</button>` : "";

                let estStr = "--:--";
                let avgPace = 0;
                if (p.finishTime !== null) {
                    estStr = `Goal (${formatTime(p.finishTime)})`;
                    avgPace = (p.finishTime / r.distance) * 400; 
                } else if (r.status === 'ready') {
                    let speed = 400 / displayPace; 
                    let estSec = r.distance / speed;
                    estStr = `Est (${formatTime(estSec)})`;
                } else {
                    const speed = 400 / displayPace; 
                    const remDist = r.distance - p.currentDist;
                    const remSec = remDist / speed;
                    estStr = formatTime(elapsedTime + remSec);
                    if(p.currentDist > 0) avgPace = (elapsedTime / p.currentDist) * 400;
                }
                let avgLabel = (avgPace > 0 && r.status !== 'ready') ? `<span class="avg-pace-label">Avg: ${avgPace.toFixed(1)}</span>` : "";

                return `
                <div class="pacer-control-row" onclick="event.stopPropagation()">
                    <div class="pacer-info"><span class="dot-large bg-${p.color}"></span></div>
                    <div class="pacer-adjust">
                        <div style="font-size:24px; font-weight:bold; margin-left:10px;">${(p.pace||72).toFixed(1)}s</div>
                        <div style="margin-left:10px;">${avgLabel}</div>
                    </div>
                    <div class="pacer-est-time" id="pacer-est-${p.id}">${estStr}</div>
                </div>`;
            }).join('');
            }

            // Progress Bar...
            const totalScale = (r.distance || 400) + 50;
            let headsHtml = "";
            if(r.pacers && Array.isArray(r.pacers)) {
                headsHtml = r.pacers.map(p => {
                    let cDist = p.currentDist || 0;
                    // let leftPct = Math.min(((cDist + r.startPos) / (totalScale + r.startPos)) * 100, 100); 
                    let leftPct = Math.min((cDist / totalScale) * 100, 100);
                    return `<div class="pacer-head bg-${p.color||'red'}" id="pacer-head-${p.id}" style="left:${leftPct}%"><div class="pacer-head-label" style="color:${p.color==='yellow'?'black':'var(--primary-color)'}">${Math.floor(cDist)}m</div></div>`;
                }).join('');
            }
            
            let marksHtml = "";
            if(r.markers && Array.isArray(r.markers)) {
                marksHtml = r.markers.map(m => {
                    let leftPct = (m.dist / totalScale) * 100;
                    return `<div class="history-tick bg-${m.color||'gray'}" style="left:${leftPct}%"><div class="history-tick-label text-${m.color||'gray'}">${m.pace}</div></div>`;
                }).join('');
            }
            
            let maxDist = 0;
            if(r.pacers && r.pacers.length > 0) maxDist = Math.max(0, ...r.pacers.map(p=>p.currentDist||0));
            let fillPct = Math.min((maxDist / totalScale) * 100, 100);

            // Buttons
            let btnArea = "";
            let infoHeader = "";
            if (r.status === 'ready') {
                // ...
                btnArea = `<div class="action-btn-col"><button class="btn-reconnect" onclick="event.stopPropagation(); connectBLE();">📡 BLE接続</button><button class="btn-big-start" onclick="event.stopPropagation(); startRaceWrapper(${r.id})">START</button></div>`;
                infoHeader = `<div style="display:flex; gap:10px;"><div class="timer-big" style="color:#DDD;">00:00.0</div><input type="number" value="${r.startPos}" style="width:50px;" onchange="updateStartPos(${r.id},this.value)"></div>`;
            } else if (r.status === 'running') {
                btnArea = `<button class="btn-big-stop" onclick="event.stopPropagation(); stopRaceWrapper(${r.id})">STOP</button>`;
                infoHeader = `<div class="timer-big" id="timer-display">${formatTime(elapsedTime)}</div>`;
            } else if (r.status === 'review') {
                btnArea = `<button class="btn-big-close" onclick="event.stopPropagation(); finalizeRace(${r.id})">閉じる</button>`;
                infoHeader = `<div class="timer-big">${formatTime(elapsedTime)}</div>`;
            } else if (r.status === 'finished') {
                btnArea = `<button class="btn-big-reset" onclick="event.stopPropagation(); resetRace(${r.id})">リセット</button>`;
                infoHeader = `<div>記録済み</div>`;
            }

            content = `
                <div style="border-bottom:1px solid #F0F0F0; padding-bottom:15px; margin-bottom:15px; display:flex; align-items:center; justify-content:space-between;">
                        <div>
                        <span style="font-size:20px; font-weight:bold;">${r.time} ${r.name}</span>
                        <span style="color:#8E8E93; margin-left:10px;">${r.group}組 (${r.distance}m)</span>
                            ${badge}
                        </div>
                        <button style="border:none; background:none; color:#CCC; font-size:18px;">▲</button>
                </div>
                <div class="race-control-layout" onclick="event.stopPropagation()">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
                            ${infoHeader}
                            <div id="lead-dist-display">先頭: <strong>${Math.floor(maxDist)}</strong>m</div>
                        </div>
                        <div class="progress-container">
                            <div class="progress-fill" id="progress-fill-${r.id}" style="width:${fillPct}%"></div>
                            ${headsHtml} ${marksHtml}
                        </div>
                        <div class="inline-controller">${pacerRows}</div>
                    </div>
                    <div>${btnArea}</div>
                </div>`;
        }
        tr.innerHTML = `<td>${content}</td>`;
        tbody.appendChild(tr);
        } catch(e) {
            console.error("[renderRace] Error rendering row:", r, e);
        }
    });
}

function startRaceWrapper(id) {
    if(activeRaceId && activeRaceId !== id) return alert("Other race running");
    setActiveRaceId(id);
    const r = races.find(x=>x.id===id);
    
    // Re-generate plans if missing (backward compatibility or race distance changed)
    r.pacers.forEach(p => {
        if (!p.runPlan) {
            // Fallback to simple pace
            const targetTime = (r.distance / 400) * (p.pace || 72);
            p.runPlan = PaceCalculator.createPlanFromTargetTime(r.distance, targetTime, 400);
        }
        p.currentSegmentIdx = 0; // Plan index
    });

    // Send Initial Config (First Segment)
    // Note: We assume all pacers start at 0m or use startPos offset. 
    // If startPos > 0, we need to fast-forward the plan? 
    // For now, we assume startPos is physical offset, but time starts at 0.
    // commandSetTimeDelay sets the pace for the NEXT segment.
    
    for (let i = 0; i < r.pacers.length; i++) {
        const p = r.pacers[i];
        const firstSeg = p.runPlan[0];
        const runnerId = i + 1; 
        const colorRgb = getColorRGB(p.color);
        
        // Color
        sendCommand(BluetoothCommunity.commandSetColor([runnerId], colorRgb));
        
        // Initial Pace
        if (firstSeg) {
            sendCommand(BluetoothCommunity.commandSetTimeDelay(400, firstSeg.paceFor400m, 400, deviceSettings.interval, [runnerId]));
        }
    }

    // sendStartRace(r, r.startPos || 0, "00:00:00:00:00:00"); 
    // Use default MAC for now or auto-scan logic
    // We need to start the runner.
    let runnerIndices = [];
    r.pacers.forEach((p, i) => runnerIndices.push(i + 1));
    
    // Start
    // The firmware expects 'startDevIndex' to be where the runner appears.
    // Usually 1 if startPos=0. 
    // startPos in meters -> device index = floor(startPos / interval) + 1
    const startDevIdx = Math.floor((r.startPos || 0) / deviceSettings.interval) + 1;
    
    sendCommand(
        BluetoothCommunity.commandStartRunner(runnerIndices, startDevIdx, "00:00:00:00:00:00"), 
        true 
    );
    
    r.status = 'running';
    r.markers = [];
    r.pacers.forEach(p => { p.currentDist=0; p.finishTime=null; });
    elapsedTime = 0; 
    saveRaces();
    
    renderRace();
    raceInterval = setInterval(() => updateState(r), 100);
}

function getColorRGB(colorName) {
    switch(colorName) {
        case 'red': return [0xFF, 0x00, 0x00];
        case 'blue': return [0x00, 0x00, 0xFF];
        case 'green': return [0x00, 0xFF, 0x00];
        case 'yellow': return [0xFF, 0xFF, 0x00];
        case 'purple': return [0xA0, 0x20, 0xF0];
        default: return [0xFF, 0xFF, 0xFF];
    }
}

function stopRaceWrapper(id) {
    sendStopRace();
    freezeRace(id);
}

function updateState(race) {
    elapsedTime += 0.1;
    let allFinished = true;
    const limit = race.distance + 50; // Run a bit past finish
    
    race.pacers.forEach((p, idx) => {
        const runnerId = idx + 1;
        
        // 1. Update Distance based on current segment speed
        // Find which segment we are in based on currentDist?
        // Or simply use the active segment from plan.
        
        if (!p.runPlan) return;
        
        let currentSeg = p.runPlan[p.currentSegmentIdx];
        
        // If we are done with all segments
        if (!currentSeg) {
            // Keep running at last known pace or stop?
            // Just assume last pace.
            // But actually we should be finished.
        } else {
            // Move
            const speed = 400.0 / currentSeg.paceFor400m; // m/s
            p.currentDist += (speed * 0.1);
            
            // Check if we crossed segment boundary
            if (p.currentDist >= currentSeg.endDist) {
                // Advance to next segment
                p.currentSegmentIdx++;
                const nextSeg = p.runPlan[p.currentSegmentIdx];
                
                if (nextSeg) {
                    // SEND COMMAND for next segment
                    console.log(`[Pacer ${p.id}] Entering Seg ${p.currentSegmentIdx} (${nextSeg.startDist}-${nextSeg.endDist}m) @ ${nextSeg.paceFor400m.toFixed(1)}s`);
                    
                    // Note: In real world, we should send this A BIT BEFORE reaching the end.
                    // Because latency.
                    // For now, we send it exactly when crossed.
                    // Ideally: sendCommand( ... nextSeg.paceFor400m ... )
                    
                    sendCommand(
                        BluetoothCommunity.commandSetTimeDelay(400, nextSeg.paceFor400m, 400, deviceSettings.interval, [runnerId])
                    );
                    
                    currentSeg = nextSeg;
                }
            }
        }

        if (p.currentDist < limit) {
            allFinished = false;
            if (p.currentDist >= race.distance && p.finishTime === null) p.finishTime = elapsedTime;
        } else {
            if (p.finishTime === null) p.finishTime = elapsedTime;
        }
    });
    
    // Targeted DOM Update
    const tEl = document.getElementById('timer-display');
    if(tEl) tEl.innerText = formatTime(elapsedTime);

    const totalScale = (race.distance || 400) + 50;
    
    race.pacers.forEach(p => {
        // Update Head Position
        const headEl = document.getElementById(`pacer-head-${p.id}`);
        if (headEl) {
             let cDist = p.currentDist || 0;
             let leftPct = Math.min((cDist / totalScale) * 100, 100);
             headEl.style.left = `${leftPct}%`;
             const labelEl = headEl.querySelector('.pacer-head-label');
             if(labelEl) labelEl.innerText = Math.floor(cDist) + 'm';
        }
        // Update Est Time / Goal Time
        const estEl = document.getElementById(`pacer-est-${p.id}`);
        if (estEl) {
            let estStr = "";
             if (p.finishTime !== null) {
                estStr = `Goal (${formatTime(p.finishTime)})`;
            } else if (p.runPlan) {
                // Use runPlan total duration
                const lastSeg = p.runPlan[p.runPlan.length - 1];
                if(lastSeg) estStr = `Goal (${formatTime(lastSeg.endTime)})`;
            }
            estEl.innerText = estStr;
        }
    });
    
    const fillEl = document.getElementById(`progress-fill-${race.id}`);
    if (fillEl) {
         let maxDist = 0;
         if(race.pacers && race.pacers.length > 0) maxDist = Math.max(0, ...race.pacers.map(p=>p.currentDist||0));
         let fillPct = Math.min((maxDist / totalScale) * 100, 100);
         fillEl.style.width = `${fillPct}%`;
    }
    const leadEl = document.getElementById('lead-dist-display');
    if(leadEl) {
         let maxDist = 0;
         if(race.pacers && race.pacers.length > 0) maxDist = Math.max(0, ...race.pacers.map(p=>p.currentDist||0));
         leadEl.innerHTML = `先頭: <strong>${Math.floor(maxDist)}</strong>m`;
    }

    if(allFinished) {
        sendStopRace();
        freezeRace(race.id);
    }
}

function freezeRace(id) { clearInterval(raceInterval); const r = races.find(x=>x.id===id); r.status = 'review'; renderRace(); saveRaces(); }
function finalizeRace(id) { const r = races.find(x=>x.id===id); r.status = 'finished'; setActiveRaceId(null); expandedRaceId = null; renderRace(); saveRaces(); }
function resetRace(id) { const r = races.find(x=>x.id===id); r.status = 'ready'; r.pacers.forEach(p=>{ p.currentDist=0; p.finishTime=null; }); renderRace(); saveRaces(); }
function updateStartPos(id, val) { const r = races.find(x=>x.id===id); r.startPos = parseInt(val)||0; saveRaces(); }

// --- MODAL ---
function openModal(rid, pid) { 
    modalTarget={raceId:rid, pacerId:pid}; 
    const r=races.find(x=>x.id===rid); 
    
    // Reset Tab
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
            // Convert stored pace/time to display
            // If we have targetTime stored, use it. Or calculate from pace.
            let tVal = "";
            if (p.targetTime) tVal = formatTime(p.targetTime);
            else if (p.pace) {
                // Estimate total time
                let totalSec = (r.distance / 400) * p.pace;
                tVal = formatTime(totalSec);
            }
            document.getElementById('modal-target-time').value = tVal;
            updateCalcPace();
        }
    } else { 
        // New Pacer
        selectModalColor('red'); 
        document.getElementById('modal-target-time').value = "";
        document.getElementById('modal-calc-pace').innerText = "--.-";
        renderSegmentTable([]);
    } 
    document.getElementById('modal-settings').classList.add('open'); 
}

function closeModal() { document.getElementById('modal-settings').classList.remove('open'); }
function selectModalColor(c) { modalSelectedColor=c; document.querySelectorAll('.color-option').forEach(e=>e.classList.remove('selected')); document.querySelector('.bg-'+c).classList.add('selected'); }

function switchModalTab(tab) {
    modalActiveTab = tab;
    document.querySelectorAll('.modal-tab').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    document.getElementById('tab-btn-'+tab).classList.add('active');
    document.getElementById('tab-content-'+tab).classList.add('active');
}

function updateCalcPace() {
    const val = document.getElementById('modal-target-time').value;
    const sec = parseTimeStr(val);
    const r = races.find(x => x.id === modalTarget.raceId);
    if (sec > 0 && r && r.distance > 0) {
        const pace = (sec / r.distance) * 400;
        document.getElementById('modal-calc-pace').innerText = pace.toFixed(1);
    } else {
        document.getElementById('modal-calc-pace').innerText = "--.-";
    }
}

function parseTimeStr(str) {
    // Supports "3:00", "180", "3:00.0"
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
    // If empty, add one row at least? No, let user add.
    // But for existing segments:
    segments.forEach((s, idx) => {
        addSegmentRow(s.distance, s.pace);
    });
    if (segments.length === 0) addSegmentRow(400, 72); // Default row
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
}

function removeSegmentRow(btn) {
    btn.closest('tr').remove();
}

function saveModalData() { 
    const r = races.find(x => x.id === modalTarget.raceId);
    let pacerData = {
        id: modalTarget.pacerId || Date.now(),
        color: modalSelectedColor,
        currentDist: 0,
        finishTime: null
    };

    if (modalActiveTab === 'simple') {
        const tStr = document.getElementById('modal-target-time').value;
        const totalSec = parseTimeStr(tStr);
        if (totalSec <= 0) return alert("目標タイムを入力してください");
        
        pacerData.type = 'target_time';
        pacerData.targetTime = totalSec;
        pacerData.pace = (totalSec / r.distance) * 400; // Calculated Avg Pace for display
        // Create Plan
        pacerData.runPlan = PaceCalculator.createPlanFromTargetTime(r.distance, totalSec, 400);
        
    } else {
        // Segments
        const rows = document.querySelectorAll('#segment-tbody tr');
        const segments = [];
        rows.forEach(tr => {
            const d = parseFloat(tr.querySelector('.inp-dist').value);
            const p = parseFloat(tr.querySelector('.inp-pace').value);
            if (d > 0 && p > 0) segments.push({ distance: d, pace: p });
        });
        if (segments.length === 0) return alert("区間を入力してください");
        
        segments.sort((a,b) => a.distance - b.distance);
        
        pacerData.type = 'segments';
        pacerData.segments = segments;
        pacerData.pace = segments[0].pace; // Display first pace
        // Create Plan
        pacerData.runPlan = PaceCalculator.createPlanFromSegments(segments, 400);
    }

    // Update or Push
    if (modalTarget.pacerId) {
        const idx = r.pacers.findIndex(x => x.id === modalTarget.pacerId);
        if (idx >= 0) {
            // Merge to keep runtime state if needed? No, config change resets state usually.
            r.pacers[idx] = { ...r.pacers[idx], ...pacerData };
        }
    } else {
        r.pacers.push(pacerData);
    }
    
    saveRaces(); 
    closeModal(); 
    renderSetup(); 
}

function deletePacerFromModal() { if(modalTarget.pacerId && confirm('削除?')) { const r=races.find(x=>x.id===modalTarget.raceId); r.pacers=r.pacers.filter(x=>x.id!==modalTarget.pacerId); saveRaces(); } closeModal(); renderSetup(); }

function startEditing(pid, v) { editingPaces[pid]=parseFloat(v); renderRace(); }
function updateEditValue(pid, v) { editingPaces[pid]=parseFloat(v); /* don't re-render on every key, just store */ }
function adjustPace(pid, d) { /* logic */ } // Simplification for now
function cancelPace(rid, pid) { delete editingPaces[pid]; renderRace(); }
function commitPace(rid, pid) { /* logic */ renderRace(); saveRaces(); }

function openVersionModal() { document.getElementById('modal-version').classList.add('open'); }
function closeVersionModal() { document.getElementById('modal-version').classList.remove('open'); }

function formatTime(s) { if(s<0) return "00:00.0"; let m=Math.floor(s/60), sec=Math.floor(s%60), ms=Math.floor((s*10)%10); return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms}`; }

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