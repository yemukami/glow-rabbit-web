import { sendCommand } from './controller.js';

// Simple abstraction to record or send BLE commands; useful for testing/estimation.
export class BleCommandQueue {
    constructor({ dryRun = false, onRecord } = {}) {
        this.dryRun = dryRun;
        this.records = [];
        this.onRecord = onRecord;
    }

    async enqueue(cmd, opts = {}) {
        const record = { cmd, opts };
        if (this.dryRun) {
            this.records.push(record);
            if (this.onRecord) this.onRecord(record);
            return Promise.resolve();
        }
        return sendCommand(cmd, opts.highPriority || false);
    }
}
