import { sendCommand } from '../ble/controller.js';
import { BluetoothCommunity } from '../ble/protocol.js';
import { deviceSettings, deviceList } from './device-manager.js';
import { setActiveRaceId } from './race-manager.js';
import { estimateStartLatencyMs } from '../ble/latency.js';
import { BleCommandQueue } from '../ble/send-queue.js';
import { prepareRacePlans, sendInitialConfigs } from './race-sync-service.js';
import { sanitizeNumberInput } from '../utils/data-utils.js';
import { getColorRGB } from '../utils/color-utils.js';
export { prepareRacePlans, sendInitialConfigs } from './race-sync-service.js';

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
                console.log("[advanceRaceTick] Presend next segment", { runnerId, nextPace400: nextSeg.paceFor400m, atDist: p.currentDist.toFixed(1) });
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

export async function startRaceService(race, id, startPosRaw, onBusy, queueOptions = {}, options = { sendStop: false, resendConfig: false }) {
    if (race === undefined || race === null) return { ok: false, reason: 'not_found' };
    if (race.pacers?.length === 0) return { ok: false, reason: 'no_pacers' };
    if (onBusy && onBusy()) return { ok: false, reason: 'busy' };

    setActiveRaceId(id);
    const startPos = sanitizeNumberInput(startPosRaw, 0);
    if (startPos < 0) race.startPos = 0;
    const queue = new BleCommandQueue(queueOptions);
    if (options.sendStop) {
        await sendStopRunner(queue);
    }

    prepareRacePlans(race);
    const shouldSendConfig = options.resendConfig || !race.initialConfigSent;
    if (shouldSendConfig) {
        await sendInitialConfigs(race, deviceSettings.interval, queue);
        race.syncNeeded = false;
    }
    await sendStartWithPrelight(race, deviceSettings.interval, queue);

    race.status = 'running';
    race.markers = [];
    race.pacers.forEach(p => { p.currentDist=0; p.finishTime=null; });
    const estMs = estimateStartLatencyMs(race.pacers.length);
    console.log("[startRaceService] sendStop:", options.sendStop, "resendConfig:", options.resendConfig, "commands:", queue.records.length);
    console.log("[startRaceService] Estimated start lag(ms):", estMs, "commands approx:", queue.records.length);
    return { ok: true, estMs, records: queue.records };
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
        { highPriority: true }
    );
}

export async function sendStopRunner(queue = new BleCommandQueue()) {
    await queue.enqueue(BluetoothCommunity.commandStopRunner(), { highPriority: true });
}

export async function stopRaceService(race, queueOptions = {}) {
    const queue = new BleCommandQueue(queueOptions);
    await sendStopRunner(queue);
    if (race) transitionToReview(race);
    return { ok: true, records: queue.records };
}

export function findActiveSegment(runPlan, currentDist) {
    if (!runPlan || runPlan.length === 0) return null;
    return runPlan.find((seg) => currentDist < seg.endDist) || runPlan[runPlan.length - 1];
}

export function markSyncNeeded(race) {
    if (!race) return;
    race.syncNeeded = true;
}

export function transitionToReview(race) {
    if (!race) return;
    race.status = 'review';
}

export function finalizeRaceState(race) {
    if (!race) return;
    race.status = 'finished';
}

export function resetRaceState(race) {
    if (!race) return;
    race.status = 'ready';
    race.initialConfigSent = false;
    race.pacers?.forEach(p => { p.currentDist = 0; p.finishTime = null; });
    race.syncNeeded = true;
}
