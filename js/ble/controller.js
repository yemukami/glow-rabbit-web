import { BluetoothCommunity } from './protocol.js';

const GLOW_SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const GLOW_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

let bluetoothDevice;
let glowCharacteristic;
let commandQueue = [];
let isWriting = false;

export let isConnected = false;

export async function connectBLE(onDisconnectedCallback, onNotificationCallback) {
    if (bluetoothDevice && bluetoothDevice.gatt.connected) {
        console.log('Disconnecting...');
        bluetoothDevice.gatt.disconnect();
        return;
    }

    try {
        console.log('Requesting Bluetooth Device...');
        bluetoothDevice = await navigator.bluetooth.requestDevice({
            filters: [{ namePrefix: "GLOW_C" }],
            optionalServices: [GLOW_SERVICE_UUID]
        });

        bluetoothDevice.addEventListener('gattserverdisconnected', (e) => {
            isConnected = false;
            if(onDisconnectedCallback) onDisconnectedCallback(e);
        });

        console.log('Connecting to GATT Server...');
        const server = await bluetoothDevice.gatt.connect();

        console.log('Getting Service...');
        const service = await server.getPrimaryService(GLOW_SERVICE_UUID);

        console.log('Getting Characteristic...');
        glowCharacteristic = await service.getCharacteristic(GLOW_CHAR_UUID);

        console.log('Starting Notifications...');
        await glowCharacteristic.startNotifications();
        if(onNotificationCallback) {
            glowCharacteristic.addEventListener('characteristicvaluechanged', onNotificationCallback);
        }

        isConnected = true;
        return true;

    } catch (error) {
        console.error('Argh! ' + error);
        throw error;
    }
}

export async function sendCommand(data, highPriority = false) {
    if (!bluetoothDevice || !bluetoothDevice.gatt.connected) {
        console.warn("Device not connected. Command ignored.");
        return;
    }

    if (highPriority && commandQueue.length > 0) {
        console.log("High Priority: Clearing queue.");
        commandQueue = []; 
    }

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
        const timeoutPromise = new Promise((_, r) => setTimeout(() => r(new Error("Write Timeout")), 2000));
        const writePromise = glowCharacteristic.writeValue(data);
        await Promise.race([writePromise, timeoutPromise]);
        console.log("Command Sent", data);
        resolve();
    } catch (error) {
        console.error("Write Error:", error);
        if(error.message.includes("Timeout")) console.warn("Command timeout");
        resolve(); 
        reject(error);
    } finally {
        isWriting = false;
        setTimeout(processQueue, 50); 
    }
}
