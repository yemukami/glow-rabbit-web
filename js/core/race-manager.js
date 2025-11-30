import { sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';
import { deviceSettings } from './device-manager.js';

export let races = [];
export let activeRaceId = null;

export function setActiveRaceId(id) {
    activeRaceId = id;
}

export function loadRaces() {
    const saved = localStorage.getItem('glow_races');
    if (saved) {
        try {
            races = JSON.parse(saved);
            if(!Array.isArray(races)) races = [];
            // Data Sanitization
            races = races.filter(r => r && typeof r === 'object').map(r => {
                if(!r.id) r.id = Date.now() + Math.random();
                if(!r.status) r.status = 'ready';
                if(r.status === 'running') r.status = 'ready'; // Reset running state on reload
                if(!Array.isArray(r.pacers)) r.pacers = [];
                if(!Array.isArray(r.markers)) r.markers = [];
                
                r.pacers.forEach(p => {
                     if(typeof p.pace !== 'number') p.pace = 72.0;
                     if(typeof p.currentDist !== 'number') p.currentDist = 0;
                     if(p.finishTime === undefined) p.finishTime = null;
                });
                return r;
            });
        } catch(e) { console.error("Load Error:", e); races = []; }
    } else {
        races = [];
    }
}

export function saveRaces() {
    localStorage.setItem('glow_races', JSON.stringify(races));
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

export async function sendRaceConfig(race) {
    for (let i = 0; i < race.pacers.length; i++) {
        const p = race.pacers[i];
        const runnerId = i + 1; 
        const colorRgb = getColorRGB(p.color);
        await sendCommand(BluetoothCommunity.commandSetColor([runnerId], colorRgb));
        await sendCommand(
            BluetoothCommunity.commandSetTimeDelay(
                deviceSettings.totalDistance,
                p.pace,
                deviceSettings.totalDistance,
                deviceSettings.interval,
                [runnerId]
            )
        ); 
    }
}

export async function sendStartRace(race, startDevIndex, targetMac) {
    let runnerIndices = [];
    race.pacers.forEach((p, i) => runnerIndices.push(i + 1));
    
    await sendCommand(
        BluetoothCommunity.commandStartRunner(runnerIndices, startDevIndex + 1, targetMac), 
        true 
    );
}

export async function sendStopRace() {
    await sendCommand(BluetoothCommunity.commandStopRunner(), true);
}
