// App Logic for Glow-Rabbit Web
// Handles BLE connectivity, Device List Management, and Race Control

const GLOW_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const GLOW_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const DUMMY_MAC = "00:00:00:00:00:00";

let bluetoothDevice;
let glowCharacteristic;
let isConnected = false;

// Device List Management
let deviceList = []; // { mac: "AA:BB:..", id: 1, status: "ok" }
let isSyncing = false; // Flag to prevent self-loop addition during sync

// Interaction State for Replace/Swap
let deviceInteraction = {
    mode: 'normal', // 'normal', 'replacing', 'swapping'
    targetIndex: -1, // Index being replaced or swap-source
    scannedMac: null // Temp storage for replacement
};
let isListDirty = false; // Flag for unsaved/unsynced changes

// Race State
let raceState = {
    distance: 1600,
    pace: 72.0,
    isRunning: false
};

let deviceInterval = 2; // Default 2m
let totalDistance = 400; // Default 400m

async function connectBLE() {
    // Toggle: If connected, disconnect
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        console.log('Disconnecting...');
        bluetoothDevice.gatt.disconnect();
        // onDisconnected event will handle the rest
        return;
    }

    try {
        console.log('Requesting Bluetooth Device...');
        // Filter by Name Prefix "GLOW_C" to specifically target the Controller
        // and avoid picking up hundreds of Glow-R devices on the field.
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "GLOW_C" }],
            optionalServices: [GLOW_SERVICE_UUID]
        });

        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);

        console.log('Connecting to GATT Server...');
        const server = await bluetoothDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await server.getPrimaryService(GLOW_SERVICE_UUID);

        console.log('Getting Characteristic...');
        glowCharacteristic = await service.getCharacteristic(GLOW_CHAR_UUID);

        console.log('Starting Notifications...');
        await glowCharacteristic.startNotifications();
        glowCharacteristic.addEventListener('characteristicvaluechanged', handleNotifications);

        isConnected = true;
        updateConnectionStatus(true);
        alert("接続しました！");
        
        // Auto-load cached list if empty
        loadDeviceList();

    } catch (error) {
        console.error('Argh! ' + error);
        alert("接続エラー: " + error);
    }
}

function onDisconnected(event) {
    console.log('> Bluetooth Device disconnected');
    isConnected = false;
    updateConnectionStatus(false);
    alert("切断しました");
}

function updateConnectionStatus(connected) {
    const el = document.querySelector('.ble-status');
    const btn = document.querySelector('.btn-connect');
    
    if (connected) {
        if(el) {
            el.innerHTML = '● 接続完了';
            el.style.color = 'var(--success-color)';
        }
        if(btn) {
            btn.innerHTML = '🔌 切断';
            btn.style.background = '#EEE';
            btn.style.color = '#555';
        }
    } else {
        if(el) {
            el.innerHTML = '● 未接続';
            el.style.color = '#999';
        }
        if(btn) {
            btn.innerHTML = '📡 接続';
            btn.style.background = '#EEF2F5';
            btn.style.color = 'var(--info-color)';
        }
    }
}

// --- Notification Handler (Glow-C -> Web) ---
function handleNotifications(event) {
    const value = event.target.value;
    const data = [];
    for (let i = 0; i < value.byteLength; i++) {
        data.push(value.getUint8(i));
    }
    
    if (data.length >= 12) {
        let macBytes = data.slice(6, 12);
        // Check if valid (not all zeros)
        if (macBytes.some(b => b !== 0)) {
            let macStr = macBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':');
            
            // If syncing, ignore notifications to prevent echo/loopback adding
            if (isSyncing) return;
            // Ignore Dummy MAC
            if (macStr === DUMMY_MAC) return;

            console.log("Received MAC:", macStr);
            
            // Mode Check
            if (deviceInteraction.mode === 'replacing') {
                // Capture MAC for replacement
                deviceInteraction.scannedMac = macStr;
                updateReplaceModalUI(macStr); // Update the modal if open
                return; // Do NOT add to list
            }

            // Normal: Add to list if not exists
            addDeviceToList(macStr);
        }
    }
}

// --- Device List Logic ---

function addDeviceToList(mac) {
    // Find first empty slot or append if within limit
    const maxDevices = Math.ceil(totalDistance / deviceInterval);
    
    console.log(`Adding Device: ${mac}. Current: ${deviceList.length}, Max: ${maxDevices}`);

    // Check if already exists
    const existingIndex = deviceList.findIndex(d => d.mac === mac);
    if (existingIndex >= 0) {
        console.log("Device already exists at index " + existingIndex);
        highlightDevice(mac);
        return;
    }
    
    if (deviceList.length < maxDevices) {
        deviceList.push({
            mac: mac,
            id: deviceList.length + 1,
            status: 'new'
        });
        renderDeviceList();
        saveDeviceList();
        setTimeout(() => highlightDevice(mac), 100);
    } else {
        console.warn("Device list full based on current distance settings.");
        alert(`デバイスリストが一杯です(最大${maxDevices}個)。設定距離を延ばすか、不要なデバイスを削除してください。`);
    }
}

function highlightDevice(mac) {
    const safeId = 'device-cell-' + mac.replace(/:/g, '');
    const el = document.getElementById(safeId);
    
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('highlight-blink');
        setTimeout(() => el.classList.remove('highlight-blink'), 1000);
    }
}

// Change Settings (Distance / Interval)
function updateRaceSettings(dist, interval) {
    if (dist) totalDistance = parseInt(dist);
    if (interval) deviceInterval = parseInt(interval);
    
    // Recalculate logic?
    const maxDevices = Math.ceil(totalDistance / deviceInterval);
    console.log(`Settings Updated: ${totalDistance}m / ${deviceInterval}m = ${maxDevices} devices`);
    
    // Re-render grid
    renderDeviceList();
    saveDeviceList(); 
}

function setDeviceToDummy(index) {
    if (deviceList[index]) {
        if(confirm(`#${index+1} を故障/ダミーとしてマークしますか？\n(同期時にスキップされます)`)) {
            deviceList[index].mac = DUMMY_MAC;
            deviceList[index].status = 'dummy';
            renderDeviceList();
            saveDeviceList();
        }
    }
}

function removeDeviceFromList(index) {
    if(confirm(`#${index+1} をリストから削除して詰め合わせますか？`)) {
        deviceList.splice(index, 1);
        // Re-index IDs? Currently IDs are just index+1.
        renderDeviceList();
        saveDeviceList();
    }
}

function moveDeviceUp(index) {
    if (index > 0) {
        [deviceList[index], deviceList[index - 1]] = [deviceList[index - 1], deviceList[index]];
        renderDeviceList();
        saveDeviceList();
    }
}

function moveDeviceDown(index) {
    if (index < deviceList.length - 1) {
        [deviceList[index], deviceList[index + 1]] = [deviceList[index + 1], deviceList[index]];
        renderDeviceList();
        saveDeviceList();
    }
}

function replaceDevice(index) {
    const newMac = prompt("新しいMACアドレスを入力してください (例: AA:BB:CC:11:22:33)", "");
    if (newMac && newMac.match(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/)) {
        deviceList[index].mac = newMac.toUpperCase();
        deviceList[index].status = 'modified';
        renderDeviceList();
        saveDeviceList();
    } else if (newMac) {
        alert("MACアドレスの形式が正しくありません");
    }
}

function fillWithDummy() {
    const maxDevices = Math.ceil(totalDistance / deviceInterval);
    const currentCount = deviceList.length;
    
    if (currentCount >= maxDevices) {
        alert(`既に設定距離(${totalDistance}m)分のデバイス(${maxDevices}個)が埋まっています`);
        return;
    }
    
    if (!confirm(`残り(${maxDevices - currentCount}個)をダミーデバイスで埋めますか？`)) return;
    
    for (let i = currentCount; i < maxDevices; i++) {
        deviceList.push({
            mac: DUMMY_MAC,
            id: i + 1,
            status: 'dummy'
        });
    }
    
    renderDeviceList();
    saveDeviceList();
}

function clearDeviceList() {
    if (deviceList.length === 0) return;
    if (!confirm("デバイスリストを全て削除しますか？")) return;
    
    deviceList = [];
    renderDeviceList();
    saveDeviceList();
}

// --- RENDER GRID ---
function renderDeviceList() {
    const container = document.getElementById('device-list-container');
    if (!container) return;
    
    // Update Grid Container Class for Swap Mode
    const gridEl = document.querySelector('.device-grid');
    if(gridEl) {
        if(deviceInteraction.mode === 'swapping') gridEl.classList.add('mode-swapping');
        else gridEl.classList.remove('mode-swapping');
    }

    const maxDevices = Math.ceil(totalDistance / deviceInterval);
    let html = `<div class="device-grid ${deviceInteraction.mode === 'swapping' ? 'mode-swapping' : ''}">`;
    
    // Render existing devices + empty slots up to maxDevices
    for (let i = 0; i < maxDevices; i++) {
        const d = deviceList[i];
        const dist = i * deviceInterval;
        
        let cellClass = 'device-cell';
        // Swap Source Highlight
        if (deviceInteraction.mode === 'swapping' && deviceInteraction.targetIndex === i) {
            cellClass += ' swap-source';
        }

        let content = '';
        let macDisplay = '';
        
        if (d) {
            if (d.mac === DUMMY_MAC) {
                cellClass += ' cell-dummy';
                macDisplay = '<span style="font-size:10px; color:#AAA;">(DUMMY)</span>';
            } else {
                cellClass += ' cell-active';
                // Show last 2 bytes of MAC for compactness
                const shortMac = d.mac.split(':').slice(-2).join(':');
                macDisplay = `<div class="cell-mac">${shortMac}</div>`;
            }
        } else {
            cellClass += ' cell-empty';
            macDisplay = '<span style="color:#EEE;">--</span>';
        }
        
        // Safe ID for highlighting
        const safeId = d ? 'device-cell-' + d.mac.replace(/:/g, '') : '';
        
        // OnClick handler
        let onClick = `openDeviceActionMenu(${i})`;
        if (deviceInteraction.mode === 'swapping') {
            onClick = `executeSwap(${i})`;
        }

        html += `
            <div class="${cellClass}" id="${safeId}" onclick="${onClick}">
                <div class="cell-header">
                    <span class="cell-id">#${i+1}</span>
                    <span class="cell-dist">${dist}m</span>
                </div>
                ${macDisplay}
            </div>
        `;
    }
    html += `</div>`;
    container.innerHTML = html;
    
    // Update settings UI inputs if they exist (to sync with loaded data)
    const distInput = document.getElementById('setting-distance');
    const intInput = document.getElementById('setting-interval');
    if(distInput && document.activeElement !== distInput) distInput.value = totalDistance;
    if(intInput && document.activeElement !== intInput) intInput.value = deviceInterval;
}

// --- CSV I/O ---

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Index,Distance,MAC\n";
    deviceList.forEach((d, i) => {
        csvContent += `${i+1},${i*deviceInterval},${d.mac}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "glow_device_list.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function testBlinkDevice(index) {
    const d = deviceList[index];
    if(!d || d.mac === DUMMY_MAC) return;
    
    console.log("Blinking Device:", d.mac);
    highlightDevice(d.mac);
    
    // Send Command: White Flash
    await sendCommand(BluetoothCommunity.commandMakeLightUp(index + 1, d.mac, [255, 255, 255], 0x0A)); // Pattern 0x0A for Color
}

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        const newList = [];
        // Skip header
        for(let i=1; i<lines.length; i++) {
            const row = lines[i].split(',');
            if(row.length >= 3) {
                const mac = row[2].trim();
                if(mac) newList.push({ mac: mac, id: i, status: 'imported' });
            }
        }
        if(newList.length > 0) {
            deviceList = newList;
            renderDeviceList();
            saveDeviceList();
            alert(`${newList.length}件のデバイスを読み込みました`);
        }
    };
    reader.readAsText(file);
}

function saveDeviceList() {
    localStorage.setItem('glow_device_list', JSON.stringify(deviceList));
    localStorage.setItem('glow_settings', JSON.stringify({ totalDistance, deviceInterval }));
}

function loadDeviceList() {
    const savedList = localStorage.getItem('glow_device_list');
    const savedSettings = localStorage.getItem('glow_settings');
    
    if (savedSettings) {
        const s = JSON.parse(savedSettings);
        if(s.totalDistance) totalDistance = parseInt(s.totalDistance);
        if(s.deviceInterval) deviceInterval = parseInt(s.deviceInterval);
    }
    
    // Validate settings
    if(!totalDistance || isNaN(totalDistance) || totalDistance <= 0) totalDistance = 400;
    if(!deviceInterval || isNaN(deviceInterval) || deviceInterval <= 0) deviceInterval = 2;

    if (savedList) {
        try {
            deviceList = JSON.parse(savedList);
            renderDeviceList();
        } catch(e) { console.error(e); }
    } else {
        // Initial Render even if empty
        renderDeviceList();
    }
}

// --- BLE Commands ---

// BLE Queue Logic
let commandQueue = [];
let isWriting = false;

async function sendCommand(data, highPriority = false) {
    if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
        console.warn("Device not connected. Command ignored.");
        return;
    }

    // If High Priority (e.g. Start Race), clear pending commands to ensure immediate execution
    if (highPriority && commandQueue.length > 0) {
        console.log("High Priority Command: Clearing " + commandQueue.length + " pending commands.");
        commandQueue = []; 
    }

    // Add to queue
    return new Promise((resolve, reject) => {
        commandQueue.push({ data, resolve, reject });
        processQueue();
    });
}

async function processQueue() {
    if (isWriting || commandQueue.length === 0) return;

    isWriting = true;
    const { data, resolve, reject } = commandQueue.shift();

    try {
        // Add Timeout to prevent hanging forever
        const timeoutPromise = new Promise((_, r) => setTimeout(() => r(new Error("Write Timeout")), 2000));
        const writePromise = glowCharacteristic.writeValue(data);
        
        await Promise.race([writePromise, timeoutPromise]);
        
        console.log("Command Sent", data);
        resolve();
    } catch (error) {
        console.error("Write Error:", error);
        // Don't reject the whole flow, just this command, so queue continues
        if(error.message.includes("Timeout")) {
            console.warn("Command timed out, proceeding to next.");
        }
        resolve(); 
        reject(error);
    } finally {
        isWriting = false;
        // Small delay to allow GATT to settle / Notify to come in
        setTimeout(processQueue, 50); 
    }
}

async function checkDirtyAndSync() {
    if (isListDirty) {
        if (confirm("デバイスリストに変更があります。同期しますか？\n(キャンセルすると変更は破棄されませんが、Glow-Cには反映されません)")) {
            await syncAllDevices();
            return true; 
        }
        return false; 
    }
    return true; 
}

async function syncAllDevices() {
    if(!confirm("現在のリストをGlow-Cに上書き登録しますか？\n(一度リセットしてから順番に追加します)")) return;
    
    isSyncing = true;
    
    try {
        // 1. Reset
        await sendCommand(BluetoothCommunity.commandReset());
        
        // 2. Add devices (Batching dummies)
        let i = 0;
        while (i < deviceList.length) {
            const d = deviceList[i];
            
            if (d.mac === DUMMY_MAC) {
                // Count consecutive dummies
                let count = 0;
                let j = i;
                while (j < deviceList.length && deviceList[j].mac === DUMMY_MAC) {
                    count++;
                    j++;
                }
                
                console.log(`Adding ${count} Dummy Devices...`);
                // Send 0x1A with COUNT (not ID!)
                await sendCommand(BluetoothCommunity.commandAddDummyDevice(count));
                
                // Skip processed dummies
                i += count;
            } else {
                // Normal Device
                await sendCommand(BluetoothCommunity.commandAddDevice(d.mac));
                i++;
            }
            
            // Small delay between commands
            await new Promise(r => setTimeout(r, 50));
        }
        
        alert("同期完了！");
        isListDirty = false;
    } catch(e) {
        console.error(e);
        alert("同期中にエラーが発生しました: " + e);
    } finally {
        // Wait a bit for last ACKs to clear before re-enabling notifications
        setTimeout(() => { isSyncing = false; }, 1000);
    }
}

// --- Race Control Bindings ---

function getColorRGB(colorName) {
    switch(colorName) {
        case 'red': return [0xFF, 0x00, 0x00];
        case 'blue': return [0x00, 0x00, 0xFF];
        case 'green': return [0x00, 0xFF, 0x00];
        case 'yellow': return [0xFF, 0xFF, 0x00];
        case 'purple': return [0xA0, 0x20, 0xF0];
        case 'white': return [0xFF, 0xFF, 0xFF];
        default: return [0xFF, 0xFF, 0xFF];
    }
}

// Helper to get bitmask for a runner ID (1-based)
function getRunnerBitmask(runnerId) {
    return 1 << (runnerId - 1);
}

async function sendRaceConfig(distance, pacers) {
    console.log("Sending Race Config...", pacers);
    
    for (let i = 0; i < pacers.length; i++) {
        const p = pacers[i];
        const runnerId = i + 1; // 1-based ID
        const colorRgb = getColorRGB(p.color);
        
        console.log(`Configuring Runner #${runnerId} (${p.color}, ${p.pace}s/400m)`);

        // 1. Set Color
        await sendCommand(BluetoothCommunity.commandSetColor([runnerId], colorRgb));
        
        // 2. Set Pace (Time Delay)
        await sendCommand(BluetoothCommunity.commandSetTimeDelay(400, p.pace, 400, deviceInterval, [runnerId])); 
    }
}

async function sendStartRace(pacers, startPos = 0) {
    if(deviceList.length === 0) {
        alert("デバイスリストが空です (開始デバイスを特定できません)");
        return;
    }

    // 1. Calculate Start Device Number
    let startDevIndex = Math.floor(startPos / deviceInterval);
    
    // Safety check
    if (startDevIndex >= deviceList.length) {
        alert(`スタート位置(${startPos}m)がデバイス設置範囲を超えています`);
        return;
    }
    
    const targetDevice = deviceList[startDevIndex];
    if(targetDevice.mac === DUMMY_MAC) {
        if(!confirm("スタート位置のデバイスがダミー(故障中)です。続行しますか？")) return;
    }

    const startDevNo = startDevIndex + 1; // Device Number is 1-based
    
    // 2. Calculate Runner Bitmask
    let positionsMask = 0;
    let runnerIndices = [];
    
    pacers.forEach((p, i) => {
        const runnerId = i + 1;
        runnerIndices.push(runnerId);
        positionsMask |= getRunnerBitmask(runnerId);
    });
    
    console.log(`Starting Race from Dev#${startDevNo} (${targetDevice.mac}) for Runners: ${positionsMask} (IDs: ${runnerIndices})`);
    
    // HIGH PRIORITY
    await sendCommand(
        BluetoothCommunity.commandStartRunner(runnerIndices, startDevNo, targetDevice.mac),
        true 
    );
}

async function sendStopRace() {
    await sendCommand(BluetoothCommunity.commandStopRunner(), true);
}

async function sendPaceConfig(distance, pacers) {
    return sendRaceConfig(distance, pacers);
}

// --- Device Action Menu UI ---
function openDeviceActionMenu(index) {
    // Remove existing menu if any
    const existing = document.getElementById('device-action-menu-overlay');
    if (existing) existing.remove();

    const d = deviceList[index];
    const dist = index * deviceInterval;
    const isDummy = d && d.mac === DUMMY_MAC;
    const isEmpty = !d;

    const overlay = document.createElement('div');
    overlay.id = 'device-action-menu-overlay';
    overlay.style.cssText = `
        position: fixed; top:0; left:0; right:0; bottom:0; 
        background: rgba(0,0,0,0.5); z-index: 2000; 
        display:flex; justify-content:center; align-items:center;
    `;
    overlay.onclick = (e) => { if(e.target===overlay) overlay.remove(); };

    let actionsHtml = '';

    if (!isEmpty) {
        // Blink Button
        if (!isDummy) {
            actionsHtml += `<button class="menu-btn" onclick="window.triggerBlink(${index})">💡 テスト点灯 (Blink)</button>`;
            actionsHtml += `<button class="menu-btn" onclick="window.triggerDummy(${index})">⚠️ 故障/ダミー化</button>`;
        }
        
        // Replace & Swap
        actionsHtml += `<button class="menu-btn" onclick="window.triggerStartReplace(${index})">🔄 デバイス交換 (ボタン押下)</button>`;
        actionsHtml += `<button class="menu-btn" style="font-size:12px; color:#888;" onclick="window.triggerReplace(${index})">✏️ 手入力で交換</button>`;
        actionsHtml += `<button class="menu-btn" onclick="window.triggerStartSwap(${index})">⇄ 場所を入れ替え (Swap)</button>`;
        
        actionsHtml += `<button class="menu-btn btn-danger" onclick="window.triggerRemove(${index})">🗑 削除 (詰める)</button>`;
        
        // Move buttons
        actionsHtml += `
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="menu-btn" style="flex:1;" onclick="window.triggerMoveUp(${index})">↑ 前へ</button>
                <button class="menu-btn" style="flex:1;" onclick="window.triggerMoveDown(${index})">↓ 次へ</button>
            </div>
        `;
    } else {
        actionsHtml += `<div style="padding:10px; color:#888;">未登録スロット</div>`;
        actionsHtml += `<button class="menu-btn" onclick="window.triggerStartReplace(${index})">🔄 デバイス追加 (ボタン押下)</button>`;
        actionsHtml += `<button class="menu-btn" onclick="window.triggerReplace(${index})">＋ MACアドレスを手入力登録</button>`;
    }

    const content = document.createElement('div');
    content.style.cssText = `
        background: white; padding: 20px; border-radius: 16px; width: 300px; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    content.innerHTML = `
        <h3 style="margin-top:0; display:flex; justify-content:space-between; align-items:center;">
            #${index+1} (${dist}m)
            <button onclick="document.getElementById('device-action-menu-overlay').remove()" style="border:none; background:none; font-size:20px;">✖</button>
        </h3>
        <p style="font-family:monospace; background:#F5F5F5; padding:5px; border-radius:4px;">
            ${d ? d.mac : 'Empty'}
        </p>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${actionsHtml}
        </div>
    `;

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Helper triggers to close modal then act
    window.triggerBlink = (i) => { overlay.remove(); testBlinkDevice(i); };
    window.triggerDummy = (i) => { overlay.remove(); setDeviceToDummy(i); };
    window.triggerReplace = (i) => { 
        overlay.remove(); 
        if(!deviceList[i]) {
            // Fill gaps if empty
            expandListToIndex(i);
        }
        replaceDevice(i); 
    };

    window.triggerRemove = (i) => { overlay.remove(); removeDeviceFromList(i); };
    window.triggerMoveUp = (i) => { overlay.remove(); moveDeviceUp(i); };
    window.triggerMoveDown = (i) => { overlay.remove(); moveDeviceDown(i); };
    
    // New triggers
    window.triggerStartReplace = (i) => { overlay.remove(); startReplaceMode(i); };
    window.triggerStartSwap = (i) => { overlay.remove(); startSwapMode(i); };
}

function expandListToIndex(index) {
    while(deviceList.length <= index) {
        deviceList.push({ mac: DUMMY_MAC, id: deviceList.length+1, status:'dummy' });
    }
}


// --- Swap & Replace Logic ---
function startSwapMode(index) {
    deviceInteraction.mode = 'swapping';
    deviceInteraction.targetIndex = index;
    renderDeviceList();
    alert("入れ替えモード: 入れ替え先のマスをクリックしてください。");
}

function executeSwap(targetIndex) {
    const srcIndex = deviceInteraction.targetIndex;
    if (srcIndex === -1 || srcIndex === targetIndex) {
        // Cancel if clicked same
        deviceInteraction.mode = 'normal';
        deviceInteraction.targetIndex = -1;
        renderDeviceList();
        return;
    }
    
    // Auto expand list if clicking empty slot
    expandListToIndex(Math.max(srcIndex, targetIndex));
    
    const temp = deviceList[srcIndex];
    deviceList[srcIndex] = deviceList[targetIndex];
    deviceList[targetIndex] = temp;
    
    // Update IDs (optional, purely visual if IDs track index)
    if(deviceList[srcIndex]) deviceList[srcIndex].id = srcIndex + 1;
    if(deviceList[targetIndex]) deviceList[targetIndex].id = targetIndex + 1;

    isListDirty = true;
    deviceInteraction.mode = 'normal';
    deviceInteraction.targetIndex = -1;
    renderDeviceList();
    alert(`#${srcIndex+1} と #${targetIndex+1} を入れ替えました。\n(同期ボタンを押して確定してください)`);
}

function startReplaceMode(index) {
    deviceInteraction.mode = 'replacing';
    deviceInteraction.targetIndex = index;
    deviceInteraction.scannedMac = null;
    
    // Show Modal
    const overlay = document.createElement('div');
    overlay.id = 'replace-modal-overlay';
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.8);z-index:3000;display:flex;justify-content:center;align-items:center;color:white;`;
    overlay.innerHTML = `
        <div style="background:white;color:black;padding:30px;border-radius:16px;text-align:center;width:300px;">
            <h3 style="margin-top:0;">デバイス交換 (#${index+1})</h3>
            <p>新しいGlow-Rのボタンを押してください...</p>
            <div id="replace-scan-status" style="font-size:24px;font-weight:bold;margin:20px 0;color:#CCC;">Wait...</div>
            <div style="display:flex;gap:10px;justify-content:center;">
                <button class="btn-sm btn-outline" onclick="window.cancelReplace()">キャンセル</button>
                <button id="btn-confirm-replace" class="btn-sm btn-primary" disabled onclick="window.confirmReplace()">このMACで更新</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function updateReplaceModalUI(mac) {
    const el = document.getElementById('replace-scan-status');
    const btn = document.getElementById('btn-confirm-replace');
    if(el) { el.innerText = mac; el.style.color = "var(--primary-color)"; }
    if(btn) btn.disabled = false;
}

window.cancelReplace = function() {
    const el = document.getElementById('replace-modal-overlay');
    if(el) el.remove();
    deviceInteraction.mode = 'normal';
    deviceInteraction.targetIndex = -1;
};

window.confirmReplace = function() {
    if(!deviceInteraction.scannedMac) return;
    const idx = deviceInteraction.targetIndex;
    
    // Update List
    expandListToIndex(idx);
    deviceList[idx] = {
        mac: deviceInteraction.scannedMac,
        id: idx + 1,
        status: 'replaced'
    };
    
    isListDirty = true;
    window.cancelReplace();
    renderDeviceList();
    alert(`#${idx+1} を更新しました。\n(同期ボタンを押して確定してください)`);
};

// --- End Swap & Replace Logic ---

// --- Auto Calibration Logic (Dynamic Lap Adjustment) ---
// Absorbs the +/- 0.1s error caused by 2m interval integer rounding.
// Future-proof for "Split Pacing" (Build-up).

let calibrationState = {}; // { pacerId: { nextCheckDist: 350, lapIndex: 0 } }

function initCalibration(race) {
    calibrationState = {};
    race.pacers.forEach(p => {
        calibrationState[p.id] = {
            nextCheckDist: 350, // First check at 350m (50m before end of lap 1)
            lapIndex: 0,
            currentDelaySetting: null // Will store last sent delay to calc predictions
        };
    });
    console.log("Calibration Initialized for Race:", race.id);
}

function checkAndCalibrate(race, currentElapsedTime) {
    // Run logic for each pacer
    race.pacers.forEach(p => {
        const state = calibrationState[p.id];
        if (!state) return;

        // Check if we passed the checkpoint (e.g. 350m)
        if (p.currentDist >= state.nextCheckDist) {
            const targetPace = p.pace; 
            const nextLapIndex = state.lapIndex + 1;
            const targetTotalDist = (nextLapIndex + 1) * 400; // e.g. 800m
            
            // Ideal time at 800m
            const idealTotalTime = targetTotalDist / 400.0 * targetPace; 
            
            // Current predicted error at end of THIS lap (400m):
            const stdVal = Math.round(targetPace * 5);
            const actualLap = (stdVal * 200) / 1000;
            const error = actualLap - targetPace;
            const accError = error * (state.lapIndex + 1);
            
            const nextLapGoal = targetPace - accError;
            const newDelay = Math.round(nextLapGoal * 5);
            
            console.log(`[Calib #${p.id}] Lap ${state.lapIndex}->${nextLapIndex}. AccError: ${accError.toFixed(3)}s. AdjGoal: ${nextLapGoal.toFixed(3)}s. NewDelay: ${newDelay}ms`);
            
            // 3. Send Command
            const runnerId = race.pacers.indexOf(p) + 1;
            const adjustedPace = newDelay / 5.0;
            
            // Only send if different from base or strict accuracy needed
            // Sending every lap ensures sync.
            sendCommand(BluetoothCommunity.commandSetTimeDelay(400, adjustedPace, 400, deviceInterval, [runnerId]));

            // 4. Update State
            state.nextCheckDist += 400;
            state.lapIndex++;
        }
    });
}

// Global exports for HTML
window.connectBLE = connectBLE;
window.downloadCSV = downloadCSV;
window.importCSV = importCSV;
window.syncAllDevices = syncAllDevices;
window.fillWithDummy = fillWithDummy;
window.clearDeviceList = clearDeviceList;
window.sendStartRace = sendStartRace;
window.sendStopRace = sendStopRace;
window.sendPaceConfig = sendPaceConfig;
window.updateRaceSettings = updateRaceSettings; 
window.openDeviceActionMenu = openDeviceActionMenu; 
window.deviceList = deviceList; 

window.checkDirtyAndSync = checkDirtyAndSync; 
window.updateDeviceStatusUI = updateDeviceStatusUI; 
window.initCalibration = initCalibration; 
window.checkAndCalibrate = checkAndCalibrate;
window.triggerStartReplace = startReplaceMode; // For modal direct calls if needed
window.triggerStartSwap = startSwapMode;

// Define helper trigger functions for window scope if called from string-based onclick
// (Already defined inside openDeviceActionMenu, but adding here just in case)
window.triggerBlink = (i) => testBlinkDevice(i);
window.triggerDummy = (i) => setDeviceToDummy(i);
window.triggerRemove = (i) => removeDeviceFromList(i);
window.triggerMoveUp = (i) => moveDeviceUp(i);
window.triggerMoveDown = (i) => moveDeviceDown(i);

Object.defineProperty(window, 'isListDirty', { get: () => isListDirty });

// Auto-load on startup
loadDeviceList();