import { sendCommand, isConnected } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';

export let deviceList = []; 
const DUMMY_MAC = "00:00:00:00:00:00";
const BLOCKED_MACS = new Set([
    "CC:33:00:00:00:00"
]);

export let deviceSettings = {
    interval: 2,
    totalDistance: 400
};

export let deviceInteraction = {
    mode: 'normal', 
    targetIndex: -1, 
    scannedMac: null 
};

export let isListDirty = false;
export let isSyncing = false;

export function markDeviceListDirty(val = true) {
    isListDirty = val;
}

export function isDeviceListDirty() {
    return isListDirty;
}

export function loadDeviceList() {
    const savedList = localStorage.getItem('glow_device_list');
    const savedSettings = localStorage.getItem('glow_settings');
    
    if (savedSettings) {
        const s = JSON.parse(savedSettings);
        if(s.totalDistance) deviceSettings.totalDistance = parseInt(s.totalDistance);
        if(s.deviceInterval) deviceSettings.interval = parseInt(s.deviceInterval);
    }
    
    if (savedList) {
        try {
            deviceList = JSON.parse(savedList)
                .filter(d => d && typeof d.mac === 'string')
                .map((d, idx) => ({ 
                    mac: d.mac, 
                    id: idx + 1, 
                    status: d.status === 'dummy' ? 'dummy' : 'active'
                }))
                .filter(d => normalizeMac(d.mac)); // drop blocked/dummy MACs
            // reassign ids after filtering
            deviceList = deviceList.map((d, idx) => ({ ...d, id: idx + 1 }));
        } catch(e) { console.error(e); }
    }
}

export function saveDeviceList() {
    localStorage.setItem('glow_device_list', JSON.stringify(deviceList));
    localStorage.setItem('glow_settings', JSON.stringify({ 
        totalDistance: deviceSettings.totalDistance, 
        deviceInterval: deviceSettings.interval 
    }));
}

function normalizePositiveInt(value, fallback) {
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n <= 0) return fallback;
    return n;
}

function normalizeMac(mac) {
    if (!mac || typeof mac !== 'string') return null;
    const cleaned = mac.replace(/[^0-9a-fA-F]/g, '');
    if (cleaned.length !== 12) return null;
    const pairs = cleaned.match(/.{2}/g);
    if (!pairs) return null;
    const normalized = pairs.map(p => p.toUpperCase()).join(':');
    if (normalized === DUMMY_MAC) return null;
    if (BLOCKED_MACS.has(normalized)) return null;
    return normalized;
}

function resizeDeviceList(maxDevices) {
    if (deviceList.length > maxDevices) {
        console.warn("[device-manager] Truncating device list to", maxDevices);
        deviceList = deviceList.slice(0, maxDevices).map((d, idx) => ({ ...d, id: idx + 1 }));
    } else if (deviceList.length < maxDevices) {
        while (deviceList.length < maxDevices) {
            deviceList.push({ mac: DUMMY_MAC, id: deviceList.length + 1, status: 'dummy' });
        }
    }
}

export function addDeviceToList(mac) {
    const normalized = normalizeMac(mac);
    if (!normalized) return { added: false, invalid: true };

    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    const existingIndex = deviceList.findIndex(d => d.mac === normalized);
    if (existingIndex >= 0) return { added: false, index: existingIndex };

    if (deviceList.length < maxDevices) {
        deviceList.push({ mac: normalized, id: deviceList.length + 1, status: 'new' });
        saveDeviceList();
        return { added: true, index: deviceList.length - 1 };
    } else {
        return { added: false, full: true };
    }
}

export function expandListToIndex(index) {
    while(deviceList.length <= index) {
        deviceList.push({ mac: DUMMY_MAC, id: deviceList.length+1, status:'dummy' });
    }
}

export async function syncAllDevices() {
    isSyncing = true;
    try {
        await sendCommand(BluetoothCommunity.commandReset());
        let i = 0;
        while (i < deviceList.length) {
            const d = deviceList[i];
            if (d.mac === DUMMY_MAC) {
                let count = 0;
                let j = i;
                while (j < deviceList.length && deviceList[j].mac === DUMMY_MAC) { count++; j++; }
                await sendCommand(BluetoothCommunity.commandAddDummyDevice(count));
                i += count;
            } else {
                await sendCommand(BluetoothCommunity.commandAddDevice(d.mac));
                i++;
            }
            await new Promise(r => setTimeout(r, 50));
        }
        isListDirty = false;
        return true;
    } catch(e) {
        console.error(e);
        throw e;
    } finally {
        setTimeout(() => { isSyncing = false; }, 1000);
    }
}

// ... Swap/Replace logic helpers ...
export function swapDevices(idx1, idx2) {
    expandListToIndex(Math.max(idx1, idx2));
    const temp = deviceList[idx1];
    deviceList[idx1] = deviceList[idx2];
    deviceList[idx2] = temp;
    if(deviceList[idx1]) deviceList[idx1].id = idx1 + 1;
    if(deviceList[idx2]) deviceList[idx2].id = idx2 + 1;
    isListDirty = true;
    saveDeviceList();
}

export function replaceDevice(idx, mac) {
    const normalized = normalizeMac(mac);
    if (!normalized) return { ok: false, reason: 'invalid_mac' };

    const dupIndex = deviceList.findIndex((d, i) => i !== idx && d.mac === normalized);
    if (dupIndex >= 0) return { ok: false, reason: 'duplicate', index: dupIndex };

    expandListToIndex(idx);
    deviceList[idx] = { mac: normalized, id: idx + 1, status: 'replaced' };
    isListDirty = true;
    saveDeviceList();
    return { ok: true };
}

export function removeDevice(idx) {
    deviceList.splice(idx, 1);
    saveDeviceList();
}

export function updateSettings(dist, interval) {
    const newDistance = normalizePositiveInt(dist, deviceSettings.totalDistance);
    const newInterval = normalizePositiveInt(interval, deviceSettings.interval);
    deviceSettings.totalDistance = newDistance;
    deviceSettings.interval = newInterval;

    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    resizeDeviceList(maxDevices);

    isListDirty = true;
    saveDeviceList();
}

export function setDeviceToDummy(index) {
    expandListToIndex(index);
    deviceList[index] = { mac: DUMMY_MAC, id: index + 1, status: 'dummy' };
    isListDirty = true;
    saveDeviceList();
}

export function fillRemainingWithDummy() {
    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    if (deviceList.length >= maxDevices) return; // Already full

    while (deviceList.length < maxDevices) {
        deviceList.push({ mac: DUMMY_MAC, id: deviceList.length + 1, status: 'dummy' });
    }
    isListDirty = true;
    saveDeviceList();
}

export async function checkDirtyAndSync() {
    if (isListDirty) {
        if (!isConnected) {
            alert("BLE未接続です。デバイス同期前に接続してください。");
            return false;
        }
        if (confirm("Device list has changed. Sync with Glow-C now?")) {
            await syncAllDevices();
            return true;
        }
        return false;
    }
    return true;
}
