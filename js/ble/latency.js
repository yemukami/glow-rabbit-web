const WRITE_GAP_MS = 50;      // queue throttle
const WRITE_TIME_MS = 20;     // nominal write time

/**
 * Estimate BLE latency for N commands in the queue.
 * @param {number} commandCount - number of commands enqueued
 * @returns {number} milliseconds
 */
export function estimateQueueLatencyMs(commandCount) {
    const count = Math.max(0, commandCount);
    return count * (WRITE_GAP_MS + WRITE_TIME_MS);
}

export function estimateStartLatencyMs(pacerCount) {
    // stop + (color + pace) * pacer + prelight + start
    const cmds = 1 + (2 * pacerCount) + 2;
    return estimateQueueLatencyMs(cmds);
}
