/*
 * BLE Command Protocol for Glow-Rabbit System
 * Ported from community.dart
 */

const DeviceCommand = {
    getGlow: { cmd: [0x00, 0x01], cat: 0x01 },
    makeLightUp: { cmd: [0x00, 0x02], cat: 0x12 },
    setTimeDelay: { cmd: [0x00, 0x03], cat: 0x12 },
    setColor: { cmd: [0x00, 0x04], cat: 0x12 },
    changeTimeDelay: { cmd: [0x00, 0x05], cat: 0x12 },
    startRunner: { cmd: [0x00, 0x07], cat: 0x12 },
    stopRunner: { cmd: [0x00, 0x08], cat: 0x02 },
    pauseRunner: { cmd: [0x00, 0x09], cat: 0x02 },
    reStartRunner: { cmd: [0x00, 0x0A], cat: 0x02 },
    removeDevice: { cmd: [0x00, 0x10], cat: 0x12 },
    insertDevice: { cmd: [0x00, 0x11], cat: 0x12 },
    deviceOverride: { cmd: [0x00, 0x12], cat: 0x12 },
    deviceSwap: { cmd: [0x00, 0x13], cat: 0x12 },
    addDevice: { cmd: [0x00, 0x14], cat: 0x12 },
    reset: { cmd: [0x00, 0x15], cat: 0x12 },
    setRepeater: { cmd: [0x00, 0x17], cat: 0x12 },
    disableRepeater: { cmd: [0x00, 0x18], cat: 0x12 },
    addTwoDevice: { cmd: [0x00, 0x19], cat: 0x12 },
    addDummy: { cmd: [0x00, 0x1A], cat: 0x12 }
};

export class BluetoothCommunity {

    static _calculatorSumCheck(data) {
        let total = 0;
        for (let i = 0; i < data.length; i++) {
            total = total + data[i];
        }
        return total & 0xFF;
    }

    static _convertDeviceNumber(deviceNumber) {
        const n1 = (deviceNumber >> 8) & 0xFF;
        const n2 = deviceNumber & 0xFF;
        return [n1, n2];
    }

    static _convertRunnerPosition(positions) {
        let position = 0;
        if (positions && positions.length > 0) {
            for (let i = 0; i < positions.length; i++) {
                if (positions[i] > 0) {
                    position = position + Math.round(Math.pow(2, positions[i] - 1));
                }
            }
        }
        return position;
    }

    static _convertDelayTime(totalDistance, time, lengthOfYard, ledSpacing) {
        const val = Math.round( (((lengthOfYard / totalDistance) * time) / (lengthOfYard / ledSpacing)) * 1000 );
        const d1 = (val >> 8) & 0xFF;
        const d2 = val & 0xFF;
        return [d1, d2];
    }

    static _parseMac(macStr) {
        if (!macStr) return [0,0,0,0,0,0];
        return macStr.split(':').map(h => parseInt(h, 16));
    }

    // --- Commands ---

    static commandReset() {
        let data = [
            ...DeviceCommand.reset.cmd,
            0x00,
            DeviceCommand.reset.cat,
            0xAA, 0x55, 0xCC, 0x33,
            0,0,0,0,0,0,0,0,0,0
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandMakeLightUp(deviceNumber, macAddress, color = [255, 255, 255], pattern = 0x0A) {
        let data = [
            ...DeviceCommand.makeLightUp.cmd,
            0x00,
            DeviceCommand.makeLightUp.cat,
            ...this._convertDeviceNumber(deviceNumber),
            ...this._parseMac(macAddress),
            0x00, 
            ...color, 
            pattern, 
            0x00
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandSetColor(positions, color = [0, 0, 0], pattern = 0x0A) {
        let posMask = Array.isArray(positions) ? this._convertRunnerPosition(positions) : positions;
        
        let data = [
            ...DeviceCommand.setColor.cmd,
            0x00,
            DeviceCommand.setColor.cat,
            posMask,
            0x00, 
            0,0,0,0,0,0,0, 
            ...color, 
            pattern,
            0x00
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandAddDevice(macAddress, glowType = 0) {
        let data = [
            ...DeviceCommand.addDevice.cmd,
            0x00,
            DeviceCommand.addDevice.cat,
            0x00, 0x00
        ];
        data.push(...this._parseMac(macAddress));
        data.push(glowType, 0,0,0,0,0);
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandRemoveDevice(macAddress, deviceNumber = 1, glowType = 0) {
        let data = [
            ...DeviceCommand.removeDevice.cmd,
            0x00,
            DeviceCommand.removeDevice.cat,
            ...this._convertDeviceNumber(deviceNumber)
        ];
        data.push(...this._parseMac(macAddress));
        data.push(glowType, 0,0,0,0,0);
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandAddDummyDevice(count) {
        let data = [
            ...DeviceCommand.addDummy.cmd,
            0x00,
            DeviceCommand.addDummy.cat,
            0x00, 0x00,
            ...this._convertDeviceNumber(count),
            0,0,0,0,0,0,0,0,0,0
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }
    
    static commandSetTimeDelay(totalDistance, time, lengthOfYard = 400, ledSpacing = 1, positions = [1]) {
        let header = [
            ...DeviceCommand.setTimeDelay.cmd,
            0x00,
            DeviceCommand.setTimeDelay.cat,
            0,0,0,0,0,0,0,0,0
        ]; 

        const delayTime = this._convertDelayTime(totalDistance, time, lengthOfYard, ledSpacing);
        const pos = this._convertRunnerPosition(positions);

        let payload = [...header, ...delayTime, pos, 0, 0];
        payload.push(this._calculatorSumCheck(payload));
        payload.push(0x00);
        return new Uint8Array(payload);
    }

    static commandStartRunner(positions = [1], deviceNumber = 1, macAddress = '') {
        let data = [
            ...DeviceCommand.startRunner.cmd,
            0x00,
            DeviceCommand.startRunner.cat,
            ...this._convertDeviceNumber(deviceNumber)
        ]; 
        data.push(...this._parseMac(macAddress)); 
        data.push(0,0,0);
        data.push(this._convertRunnerPosition(positions));
        data.push(0,0);
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }
    
    static commandStopRunner() {
         let data = [
            ...DeviceCommand.stopRunner.cmd,
            0x00,
            DeviceCommand.stopRunner.cat,
            0,0,0,0,0,0,0,0,0,0,0,0,0,0
        ]; 
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }
}
