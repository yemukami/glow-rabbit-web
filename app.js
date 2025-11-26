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
    try {
        console.log('Requesting Bluetooth Device...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: 'Glow' }],
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
}

function updateConnectionStatus(connected) {
    const el = document.querySelector('.ble-status');
    if (connected) {
        el.innerHTML = '● 接続完了';
        el.style.color = 'var(--success-color)';
    } else {
        el.innerHTML = '● 未接続';
        el.style.color = '#999';
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
        html += `
        <div class="device-item">
            <div style="display:flex; align-items:center; gap:15px;">
                <div style="font-weight:bold; width:30px;">#${i+1}</div>
                <div class="device-dist">${dist}m</div>
                <div class="device-mac">${d.mac}</div>
            </div>
            <div style="display:flex; gap:5px;">
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

async function sendCommand(data) {
    if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
        alert("デバイスに接続されていません");
        return;
    }
    try {
        await glowCharacteristic.writeValue(data);
        console.log("Command Sent", data);
    } catch (error) {
        console.error("Write Error:", error);
        alert("送信エラー: " + error);
    }
}

async function syncAllDevices() {
    if(!confirm("現在のリストをGlow-Cに上書き登録しますか？\n(一度リセットしてから順番に追加します)")) return;
    
    // 1. Reset
    await sendCommand(BluetoothCommunity.commandReset());
    await new Promise(r => setTimeout(r, 500));
    
    // 2. Add each
    for (let d of deviceList) {
        await sendCommand(BluetoothCommunity.commandAddDevice(d.mac));
        await new Promise(r => setTimeout(r, 200)); // Wait for Ack?
    }
    
    alert("同期完了");
}

// --- Race Control Bindings ---
async function sendStartRace() {
    if(deviceList.length === 0) {
        // Fallback or Manual Mode?
        // Let's use "All Start" logic or just start assuming config is done.
        // Using commandStartRunner with devNum 1 and valid MAC if possible?
        // Actually, commandReStartRunner might be safer if we don't want to specify MAC.
        // But let's try standard Start.
        alert("デバイスリストが空です");
        return;
    }
    
    const topDevice = deviceList[0];
    // Start command to the first device (Master?)
    await sendCommand(BluetoothCommunity.commandStartRunner([1], 1, topDevice.mac));
}

async function sendStopRace() {
    await sendCommand(BluetoothCommunity.commandStopRunner());
}

async function sendPaceConfig(distance, pace) {
    await sendCommand(BluetoothCommunity.commandSetTimeDelay(distance, pace));
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
