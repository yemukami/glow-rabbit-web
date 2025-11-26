// App Logic for Glow-Rabbit Web
// Handles BLE connectivity, Device List Management, and Race Control

const GLOW_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const GLOW_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice;
let glowCharacteristic;
let isConnected = false;

// Device List Management
let deviceList = []; // { mac: "AA:BB:..", id: 1, status: "ok" }

// Race State
let raceState = {
    distance: 1600,
    pace: 72.0,
    isRunning: false
};

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
        // Debug: acceptAllDevices: true to find the device even if name/UUID differs
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
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
    
    // Check for MAC Address in the packet (Index 6..11 usually)
    // But let's be careful. Some packets are Ack.
    // Ack packet: 01 (Cmd), 02 (Original Cmd ID)...
    // If it's an ACK for AddDevice (0x14), it might contain the assigned ID?
    // Command.ino:
    // case 0x0014: dt[17]=0x01 (OK), dt[4,5] = devNo.
    //
    // If it's a general "I found a device" notification (not in current FW?), we might not see it.
    // BUT, user requirement says: "Click Glow-R button -> Glow-C sends MAC -> App adds to list".
    // This implies Glow-C FW has a mechanism to notify unexpected MACs.
    // Or maybe the "GetGlow" command (0x01) response?
    //
    // Let's assume the packet contains a MAC address at offset 6.
    // And we just naively check if it looks like a MAC.
    
    if (data.length >= 12) {
        let macBytes = data.slice(6, 12);
        // Check if valid (not all zeros)
        if (macBytes.some(b => b !== 0)) {
            let macStr = macBytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(':');
            console.log("Received MAC:", macStr);
            
            // Add to list if not exists
            addDeviceToList(macStr);
        }
    }
}

// --- Device List Logic ---

function addDeviceToList(mac) {
    const exists = deviceList.find(d => d.mac === mac);
    if (!exists) {
        deviceList.push({
            mac: mac,
            id: deviceList.length + 1, // Temporary ID until synced
            status: 'new'
        });
        renderDeviceList();
        saveDeviceList();
        // Also highlight the newly added device
        setTimeout(() => highlightDevice(mac), 100);
    } else {
        // If exists, just highlight it to show "I heard you"
        highlightDevice(mac);
    }
}

function highlightDevice(mac) {
    // Escape colons for CSS selector or just use getElementById with a safe ID
    // Using safe ID by stripping colons
    const safeId = 'device-row-' + mac.replace(/:/g, '');
    const row = document.getElementById(safeId);
    
    if (row) {
        // Scroll into view if needed
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight class
        row.style.transition = "background-color 0.2s";
        row.style.backgroundColor = "#FFF3CD"; // Yellowish highlight
        
        // Remove after 1 second
        setTimeout(() => {
            row.style.backgroundColor = "";
        }, 1000);
    }
}

function removeDeviceFromList(index) {
    deviceList.splice(index, 1);
    renderDeviceList();
    saveDeviceList();
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
        
        // Optionally send Override command immediately?
        // For now, let's rely on "Sync/Register" button to push changes.
    } else if (newMac) {
        alert("MACアドレスの形式が正しくありません");
    }
}

function renderDeviceList() {
    const container = document.getElementById('device-list-container');
    if (!container) return;
    
    let html = '';
    deviceList.forEach((d, i) => {
        let dist = i * 2; // Assuming 2m interval for simplicity
        const safeId = 'device-row-' + d.mac.replace(/:/g, '');
        html += `
        <div class="device-item" id="${safeId}" onclick="testBlinkDevice(${i})" style="cursor:pointer;">
            <div style="display:flex; align-items:center; gap:15px; flex:1;">
                <div style="font-weight:bold; width:30px;">#${i+1}</div>
                <div class="device-dist">${dist}m</div>
                <div class="device-mac">${d.mac}</div>
            </div>
            <div style="display:flex; gap:5px;" onclick="event.stopPropagation()">
                <button class="btn-sm" onclick="moveDeviceUp(${i})">↑</button>
                <button class="btn-sm" onclick="moveDeviceDown(${i})">↓</button>
                <button class="btn-sm btn-outline" onclick="replaceDevice(${i})">交換</button>
                <button class="btn-sm btn-danger" onclick="removeDeviceFromList(${i})">削除</button>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// --- CSV I/O ---

function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,Index,Distance,MAC\n";
    deviceList.forEach((d, i) => {
        csvContent += `${i+1},${i*2},${d.mac}\n`;
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
    if(!d) return;
    
    console.log("Blinking Device:", d.mac);
    
    // Visual feedback on UI
    highlightDevice(d.mac);
    
    // Send Command: White Flash (Pattern 1?)
    // Color: White [255, 255, 255], Pattern: 1
    await sendCommand(BluetoothCommunity.commandMakeLightUp(index + 1, d.mac, [255, 255, 255], 1));
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
}

function loadDeviceList() {
    const saved = localStorage.getItem('glow_device_list');
    if (saved) {
        try {
            deviceList = JSON.parse(saved);
            renderDeviceList();
        } catch(e) { console.error(e); }
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
        // Actually, we should verify connection if error is fatal
        if(error.message.includes("Timeout")) {
            console.warn("Command timed out, proceeding to next.");
        }
        resolve(); // Resolve anyway to keep queue moving? Or reject? 
        // If we reject, the caller (await sendCommand) gets error.
        reject(error);
    } finally {
        isWriting = false;
        // Small delay to allow GATT to settle / Notify to come in
        setTimeout(processQueue, 50); 
    }
}

async function syncAllDevices() {
    if(!confirm("現在のリストをGlow-Cに上書き登録しますか？\n(一度リセットしてから順番に追加します)")) return;
    
    // 1. Reset
    await sendCommand(BluetoothCommunity.commandReset());
    
    // 2. Add each
    for (let d of deviceList) {
        // Normal priority
        await sendCommand(BluetoothCommunity.commandAddDevice(d.mac));
    }
    
    alert("同期コマンドを送信キューに入れました");
}

// --- Race Control Bindings ---

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

// Calculate Runner ID (1, 2, 4, 8...) from pacer index or ID logic
// In Mock, pacer ID is 101, 201... random.
// We need to map them to Runner 1, 2, 3, 4.
// Let's assume index in array + 1 maps to Runner ID 1, 2, 3, 4 (Bit 1, 2, 4, 8).
// Or we can assign them based on color?
// Usually Red=1, Blue=2, Green=3, Yellow=4?
// Let's use a simple mapping based on array index for now to allow multiple same colors if needed,
// OR map by color if strictly defined. 
// "Practice menu" usually implies Red Runner, Blue Runner.
// Let's map by Color for consistency with "Red Pacer".
function getRunnerBit(color) {
    switch(color) {
        case 'red': return 1;   // 0001
        case 'blue': return 2;  // 0010
        case 'green': return 4; // 0100
        case 'yellow': return 8;// 1000
        default: return 1;
    }
}

async function sendRaceConfig(distance, pacers) {
    // Send Color and Pace config for ALL pacers
    console.log("Sending Race Config...", pacers);
    
    for (let p of pacers) {
        const runnerBit = getRunnerBit(p.color);
        const colorRgb = getColorRGB(p.color);
        
        // 1. Set Color
        await sendCommand(BluetoothCommunity.commandSetColor(runnerBit, colorRgb));
        
        // 2. Set Pace (Time Delay)
        // pace is sec/400m.
        await sendCommand(BluetoothCommunity.commandSetTimeDelay(distance, p.pace, 400, 1, [runnerBit])); // 400m yard, 1m? Wait, ledSpacing.
        // In Dart code: ledSpacing = 1.
        // In FW: `dtime` is calculated.
        // If we assume standard, just pass pace as time.
    }
}

async function sendStartRace(pacers, startPos = 0) {
    if(deviceList.length === 0) {
        alert("デバイスリストが空です (開始デバイスを特定できません)");
        return;
    }

    // 1. Calculate Start Device Number
    // Assuming 2m interval between devices
    const DEVICE_INTERVAL_M = 2; 
    let startDevIndex = Math.floor(startPos / DEVICE_INTERVAL_M);
    
    // Safety check
    if (startDevIndex >= deviceList.length) {
        alert(`スタート位置(${startPos}m)がデバイス設置範囲を超えています`);
        return;
    }
    
    const targetDevice = deviceList[startDevIndex];
    const startDevNo = startDevIndex + 1; // Device Number is 1-based
    
    // 2. Calculate Runner Bitmask (Who is running?)
    let positionsMask = 0;
    pacers.forEach(p => {
        positionsMask |= getRunnerBit(p.color);
    });
    
    console.log(`Starting Race from Dev#${startDevNo} (${targetDevice.mac}) for Runners: ${positionsMask}`);
    
    // HIGH PRIORITY: Clear any pending config/sync commands and START immediately
    await sendCommand(
        BluetoothCommunity.commandStartRunner([positionsMask], startDevNo, targetDevice.mac), 
        true // High Priority
    );
}

async function sendStopRace() {
    // Stop is also high priority
    await sendCommand(BluetoothCommunity.commandStopRunner(), true);
}

// Global exports for HTML
window.connectBLE = connectBLE;
window.downloadCSV = downloadCSV;
window.importCSV = importCSV;
window.syncAllDevices = syncAllDevices;
window.sendStartRace = sendStartRace;
window.sendStopRace = sendStopRace;
window.sendPaceConfig = sendPaceConfig;
window.deviceList = deviceList; // Debug
