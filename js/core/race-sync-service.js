import { BluetoothCommunity } from '../ble/protocol.js';
import { PaceCalculator } from './pace-calculator.js';
import { deviceSettings } from './device-manager.js';
import { BleCommandQueue } from '../ble/send-queue.js';
import { getColorRGB } from '../utils/color-utils.js';

export async function syncRaceConfigs(race, queueOptions = {}) {
    if (!race || !race.pacers || race.pacers.length === 0) return { ok: false, reason: 'no_pacers' };
    prepareRacePlans(race);
    const queue = new BleCommandQueue(queueOptions);
    await sendInitialConfigs(race, deviceSettings.interval, queue);
    race.initialConfigSent = true;
    race.syncNeeded = false;
    const summary = summarizeRecords(queue.records);
    console.log("[syncRaceConfigs] Sent initial configs", { commands: summary.total, highPriority: summary.highPriority, pacers: race.pacers.length, interval: deviceSettings.interval });
    return { ok: true, records: queue.records };
}

export function prepareRacePlans(race) {
    race.pacers.forEach(p => {
        if (!p.runPlan) {
            const targetTime = (race.distance / 400) * (p.pace || 72);
            p.runPlan = PaceCalculator.createPlanFromTargetTime(race.distance, targetTime, 400);
        }
        p.currentSegmentIdx = 0;
        p.nextCommandPrepared = false;
    });
}

export async function sendInitialConfigs(race, intervalMeters, queue = new BleCommandQueue()) {
    for (let i = 0; i < race.pacers.length; i++) {
        const p = race.pacers[i];
        const firstSeg = p.runPlan[0];
        const runnerId = i + 1; 
        const colorRgb = getColorRGB(p.color);
        await queue.enqueue(BluetoothCommunity.commandSetColor([runnerId], colorRgb));
        
        if (firstSeg) {
            await queue.enqueue(
                BluetoothCommunity.commandSetTimeDelay(
                    400,
                    firstSeg.paceFor400m,
                    400,
                    intervalMeters,
                    [runnerId]
                )
            );
        }
    }
}

function summarizeRecords(records) {
    const total = records?.length || 0;
    const highPriority = records?.filter(r => r?.opts?.highPriority).length || 0;
    return { total, highPriority };
}
