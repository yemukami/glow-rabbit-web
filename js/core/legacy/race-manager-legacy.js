// README (legacy):
// - This file retains the old race-manager BLE APIs (sendRaceConfig / sendStartRace / sendStopRace)
//   for historical reference. Do NOT import in new code. Current flows use race-service/race-sync-service.
// - If you ever need to compare or temporarily restore old behavior, copy from here intentionally
//   and add tests + human review. Blind reintroductionは禁止。

import { sendCommand } from '../../ble/controller.js';
import { BluetoothCommunity } from '../../ble/protocol.js';
import { deviceSettings } from '../device-manager.js';

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
                400,                   // reference distance (pace per 400m)
                p.pace,                // seconds per 400m
                400,                   // lengthOfYard per protocol expectation
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
