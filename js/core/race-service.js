import { sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';
import { PaceCalculator } from './pace-calculator.js';
import { deviceSettings, deviceList } from './device-manager.js';
import { setActiveRaceId } from './race-manager.js';
import { estimateStartLatencyMs } from '../ble/latency.js';
import { BleCommandQueue } from '../ble/send-queue.js';

const UI_CONSTANTS = {
    FINISH_MARGIN_METERS: 50,
    PRESEND_MARGIN_METERS: 10
};

export function advanceRaceTick(race, currentElapsed, intervalMeters) {
    let elapsed = currentElapsed + 0.1;
    let allFinished = true;
    const limit = race.distance + UI_CONSTANTS.FINISH_MARGIN_METERS;

    race.pacers.forEach((p, idx) => {
        const runnerId = idx + 1;
        if (!p.runPlan) return;

        let currentSeg = findActiveSegment(p.runPlan, p.currentDist);
        const nextSeg = p.runPlan[p.currentSegmentIdx + 1];

        if (currentSeg) {
            const speed = 400.0 / currentSeg.paceFor400m;
            p.currentDist += (speed * 0.1);

            if (nextSeg && !p.nextCommandPrepared && p.currentDist >= (nextSeg.startDist - UI_CONSTANTS.PRESEND_MARGIN_METERS)) {
                sendCommand(
                    BluetoothCommunity.commandSetTimeDelay(
                        400,
                        nextSeg.paceFor400m,
                        400,
                        intervalMeters,
                        [runnerId]
                    )
                );
                p.nextCommandPrepared = true;
            }

            if (p.currentDist >= currentSeg.endDist) {
                p.currentSegmentIdx++;
                p.nextCommandPrepared = false;
            }
        }

        if (p.currentDist < limit) {
            allFinished = false;
            if (p.currentDist >= race.distance && p.finishTime === null) p.finishTime = elapsed;
        } else if (p.finishTime === null) {
            p.finishTime = elapsed;
        }
    });

    return { elapsedTime: elapsed, allFinished };
}

export async function startRaceService(race, id, startPosRaw, onBusy, queueOptions = {}) {
    if (race === undefined || race === null) return { ok: false, reason: 'not_found' };
    if (race.pacers?.length === 0) return { ok: false, reason: 'no_pacers' };
    if (onBusy && onBusy()) return { ok: false, reason: 'busy' };

    setActiveRaceId(id);
    const startPos = sanitizeNumberInput(startPosRaw, 0);
    if (startPos < 0) race.startPos = 0;

    await sendStopRunner();

    prepareRacePlans(race);
    const queue = new BleCommandQueue(queueOptions);
    if (!race.initialConfigSent) {
        await sendInitialConfigs(race, deviceSettings.interval, queue);
    }
    await sendStartWithPrelight(race, deviceSettings.interval, queue);

    race.status = 'running';
    race.markers = [];
    race.pacers.forEach(p => { p.currentDist=0; p.finishTime=null; });
    const estMs = estimateStartLatencyMs(race.pacers.length);
    console.log("[startRaceService] Estimated start lag(ms):", estMs, "commands approx:", 1 + (2 * race.pacers.length) + 2);
    return { ok: true, estMs, records: queue.records };
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
    race.initialConfigSent = true;
    for (let i = 0; i < race.pacers.length; i++) {
        const p = race.pacers[i];
        const firstSeg = p.runPlan[0];
        const runnerId = i + 1; 
        const colorRgb = getColorRGB(p.color);
        console.log("[pace:init]", { runnerId, pace400: firstSeg?.paceFor400m || p.pace, interval: intervalMeters });
        
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

export async function sendStartWithPrelight(race, intervalMeters, queue = new BleCommandQueue()) {
    const runnerIndices = race.pacers.map((_, i) => i + 1);
    const startDevIdx = Math.floor((race.startPos || 0) / intervalMeters) + 1;

    const startDevice = deviceList[startDevIdx - 1];
    if (startDevice && startDevice.mac) {
        const p0 = race.pacers[0];
        const startColorRgb = p0 ? getColorRGB(p0.color) : [0xFF, 0xFF, 0xFF];
        await queue.enqueue(
            BluetoothCommunity.commandMakeLightUp(startDevIdx, startDevice.mac, startColorRgb, 0x0A)
        );
    }
    
    await queue.enqueue(
        BluetoothCommunity.commandStartRunner(runnerIndices, startDevIdx, "00:00:00:00:00:00"), 
        true 
    );
}

export async function sendStopRunner() {
    await sendCommand(BluetoothCommunity.commandStopRunner(), true);
}

export function findActiveSegment(runPlan, currentDist) {
    if (!runPlan || runPlan.length === 0) return null;
    return runPlan.find((seg) => currentDist < seg.endDist) || runPlan[runPlan.length - 1];
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

function sanitizeNumberInput(raw, fallback = 0) {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return fallback;
    return n;
}
