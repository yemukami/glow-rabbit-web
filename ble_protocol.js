/*
 * BLE Command Protocol for Glow-Rabbit System
 * Ported from community.dart
 */

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

const LightColor = {
    white: [0xFF, 0xFF, 0xFF],
    red: [0xFF, 0x00, 0x00],
    blue: [0x00, 0x00, 0xFF],
    green: [0x00, 0xFF, 0x00],
    yellow: [0xFF, 0xFF, 0x00],
    purple: [0xA0, 0x20, 0xF0]
};

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
    insertDevice: { cmd: [0x00, 0x11], cat: 0x12 }, // inferred from code
    deviceOverride: { cmd: [0x00, 0x12], cat: 0x12 }, // inferred
    deviceSwap: { cmd: [0x00, 0x13], cat: 0x12 }, // inferred
    addDevice: { cmd: [0x00, 0x14], cat: 0x12 },
    reset: { cmd: [0x00, 0x15], cat: 0x12 },
    getMacFromDevNo: { cmd: [0x00, 0x16], cat: 0x12 }, // inferred
    setRepeater: { cmd: [0x00, 0x17], cat: 0x12 },
    disableRepeater: { cmd: [0x00, 0x18], cat: 0x12 },
    addTwoDevice: { cmd: [0x00, 0x19], cat: 0x12 },
    addDummy: { cmd: [0x00, 0x1A], cat: 0x12 }
};

class BluetoothCommunity {

    static _calculatorSumCheck(data) {
        let total = 0;
        for (let i = 0; i < data.length; i++) {
            total = total + data[i];
        }
        return total & 0xFF;
    }

    static _convertDeviceNumber(deviceNumber) {
        // deviceNumber (int) -> [byte1, byte2] (Big Endian based on Dart code logic)
        // Dart: hexString -> split -> parse.
        // Simply:
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
        // Dart: (((lengthOfYard / totalDistance) * time) / (lengthOfYard / ledSpacing) * 1000).round()
        // Simplified: (time / totalDistance * ledSpacing * 1000) ??
        // Let's follow Dart logic exactly:
        // val = ( (lengthOfYard/totalDistance)*time ) / (lengthOfYard/ledSpacing) * 1000
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

    static commandMakeLightUp(deviceNumber, macAddress, color = [255, 255, 255], pattern = 1) {
        // Command 0x0002: Make specific device glow
        // Based on Firmware Command.ino
        let data = [
            ...DeviceCommand.makeLightUp.cmd,
            0x00,
            DeviceCommand.makeLightUp.cat,
            ...this._convertDeviceNumber(deviceNumber),
            ...this._parseMac(macAddress),
            0x00, // Byte 12: Torc?
            ...color, // Byte 13,14,15: R,G,B
            pattern,  // Byte 16: Pattern
            0x00      // Byte 17: Padding
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    static commandSetColor(positions, color = [0, 0, 0], pattern = 1) {
        // Command 0x0004: Set Color for Runner(s)
        let posMask = Array.isArray(positions) ? this._convertRunnerPosition(positions) : positions;
        
        let data = [
            ...DeviceCommand.setColor.cmd,
            0x00,
            DeviceCommand.setColor.cat,
            posMask, // Byte 4: Runner Mask
            0x00,    // Byte 5: Read/Write? (0=Write usually)
            0,0,0,0,0,0,0, // Bytes 6-12: Padding
            ...color, // Byte 13,14,15: R,G,B
            pattern,  // Byte 16: Pattern
            0x00      // Byte 17: Padding
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

    static commandAddDummyDevice(deviceNumber) {
        let data = [
            ...DeviceCommand.addDummy.cmd,
            0x00,
            DeviceCommand.addDummy.cat,
            0x00, 0x00,
            ...this._convertDeviceNumber(deviceNumber),
            0,0,0,0,0,0,0,0,0,0 // Padding
        ];
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }
    
    // New: Swap (0x13) - inferred from Command.ino
    // case 0x0013: devNo(4,5), devNo2(6,7)
    static commandSwapDevice(devNo1, devNo2) {
        let data = [
            ...DeviceCommand.deviceSwap.cmd,
            0x00,
            DeviceCommand.deviceSwap.cat,
            ...this._convertDeviceNumber(devNo1),
            ...this._convertDeviceNumber(devNo2),
            0,0,0,0,0,0,0,0,0,0 // Padding
        ];
        // Adjust padding if needed to reach length before checksum
        // Command.ino uses dt[4]..dt[7] for args.
        // We need 20 bytes total including checksum?
        // Standard packet seems to be header(4) + payload(14) + cksum(1) + footer(1) = 20
        // Current: 4 + 2 + 2 + 10 = 18 bytes. OK.
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }

    // New: Override (0x12) - Replace Mac at DevNo
    static commandOverrideDevice(deviceNumber, newMacAddress) {
         let data = [
            ...DeviceCommand.deviceOverride.cmd,
            0x00,
            DeviceCommand.deviceOverride.cat,
            ...this._convertDeviceNumber(deviceNumber),
            ...this._parseMac(newMacAddress),
            0,0,0,0,0,0,0,0 // Padding
        ];
        // 4 + 2 + 6 + 8 = 20 bytes... too long.
        // Command.ino: case 0x0012: for(i=0;i<6;i++) MacAdd[i]=dt[i+6]; devNo not read from packet?
        // Wait, Command.ino OVERRIDE:
        // case 0x0012:
        //   for(int i=0;i<6;i++){ MacAdd[i]=dt[i+6]; }
        //   DeviceOverride(devNo, MacAdd, 6);
        // BUT where does 'devNo' come from in this case? It is NOT initialized in case 0x0012 block!
        // It might rely on 'devNo' being set earlier or reusing the variable... which is dangerous in C.
        // Looking at 'receive_commend' start:
        // devNo = (int)(((dt[4]<<8) + dt[5])&0xffff);
        // This is inside case 0x0002, 0x0006, 0x0007 etc.
        // It is NOT set at the top level scope of function before switch, only declared.
        // CRITICAL BUG in Firmware? Or I missed something.
        //
        // Let's look at 'receive_commend' again.
        // ...
        // switch(command){
        //   case 0x0002: devNo = ...
        //   ...
        //   case 0x0012: ... DeviceOverride(devNo, ...
        //
        // 'devNo' is a local variable in 'receive_commend'. If it's not set in case 0x0012, it's uninitialized garbage.
        // However, usually these protocols follow a pattern.
        // Let's assume dt[4], dt[5] IS device number, even if C code missed explicit assignment in that specific case block
        // (or maybe it relies on the compiler not clearing it if it was set in a previous loop? No, it's a function call).
        //
        // WAIT. receive_commend function declares `int devNo`.
        // In case 0x0012: `DeviceOverride(devNo,MacAdd,6);`
        // It is definitely using uninitialized `devNo` unless I missed a line in the shared code.
        //
        // Ah, let's look at `case 0x0013` (Swap).
        // `devNo = (int)(((dt[4]<<8) + dt[5])&0xffff);` IS there.
        //
        // If 0x0012 is indeed broken in FW, we might use `removeDevice` (0x10) then `insertDevice` (0x11)?
        // `case 0x0011` (Insert): `dt[0]=0x01; ... InsertDevice(devNo, ...)` -> Again, devNo uninitialized in case block!
        //
        // Only `0x0010` (Delete) has `devNo = ...`.
        //
        // If the FW is buggy, "Replace" might be hard.
        // But wait, maybe `devNo` is extracted globally?
        // `int command; ... int devNo; ... for ... dt[i]=data[i]; ... command = ...`
        // No.
        //
        // Let's assume standard packing: Bytes 4-5 are ALWAYS Device Number.
        // And maybe I missed the line in your provided snippet where devNo is extracted globally?
        // No, I see `devNo = ...` inside specific cases.
        //
        // HYPOTHESIS: The snippet provided might be slightly incomplete or the FW relies on luck/undefined behavior.
        // SAFEST BET for "Replace": Delete (0x10) then Add (0x14)?
        // Or Delete (0x10) then Insert (0x11) if we want specific position?
        // But Insert also has the `devNo` issue in the code I saw.
        //
        // Let's stick to `AddDevice` (0x14) which just appends to end.
        // If we want to "Replace" a device at index N:
        // 1. We probably need to re-upload the WHOLE list? Reset -> Add, Add, Add...
        // 2. Or we try to use 0x12 assuming standard packing (Bytes 4,5 = Index) and hope FW reads it.
        //
        // Let's implement `commandOverrideDevice` assuming Bytes 4,5 are index.
        
        let dataOverride = [
            ...DeviceCommand.deviceOverride.cmd,
            0x00,
            DeviceCommand.deviceOverride.cat,
            ...this._convertDeviceNumber(deviceNumber),
            ...this._parseMac(newMacAddress),
            0,0,0,0,0,0,0,0
        ];
        dataOverride.push(this._calculatorSumCheck(dataOverride));
        dataOverride.push(0x00);
        return new Uint8Array(dataOverride);
    }

    static commandSetTimeDelay(totalDistance, time, lengthOfYard = 400, ledSpacing = 1, positions = [1]) {
        let data = [
            ...DeviceCommand.setTimeDelay.cmd,
            0x00,
            DeviceCommand.setTimeDelay.cat,
            0,0,0,0,0,0,0,0,0,0
        ];
        // data is now length 14.
        // Dart code:
        // data = [ ...data (12 bytes header?), ...delayTime(2), pos(1), 0, 0 ] -> Total 17?
        // Dart:
        // header: cmd(2), 0, cat(1), 0,0,0,0,0,0,0,0,0 (8 bytes of zeros) -> Total 12 bytes.
        // + delay(2) + pos(1) + 0 + 0 = 17 bytes.
        // + sum(1) + 0 = 19 bytes?
        //
        // Let's check Command.ino case 0x0003:
        // dtime = dt[13]<<8 + dt[14]
        // runner = dt[15]
        //
        // So Bytes 0-12 are header/padding.
        // 0: cmdH, 1: cmdL, 2: id, 3: cat
        // 4..12: padding (9 bytes).
        // 13: dtimeH, 14: dtimeL
        // 15: runner
        //
        // Dart code:
        // header = [cmd, 0, cat, 0,0,0,0,0,0,0,0,0] -> 3 + 9 = 12 items. Indices 0..11.
        // So index 12 is next.
        // WE NEED 13 to be dtimeH.
        // So we need 1 more byte of padding in Dart code?
        // Dart: `0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00` (9 zeros).
        // Yes.
        
        let header = [
            ...DeviceCommand.setTimeDelay.cmd,
            0x00,
            DeviceCommand.setTimeDelay.cat,
            0,0,0,0,0,0,0,0,0
        ]; // 2+1+1+9 = 13 bytes. Indices 0..12.
        // Wait.
        // 0,1: Command
        // 2: 0x00
        // 3: Category
        // 4,5,6,7,8,9,10,11,12: Zeros (9 bytes)
        // 13: dtimeH
        // Correct.

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
        ]; // 2+1+1+2 = 6 bytes.
        
        // Mac Address (6 bytes)
        data.push(...this._parseMac(macAddress)); // +6 = 12 bytes. (Indices 6..11)
        
        // Padding?
        // Command.ino case 0x0006 (Start 1 - All Runner?):
        // devNo = dt[4]..dt[5]
        // dtime = dt[13]..dt[14]
        // Mac = dt[6]..dt[11]
        //
        // case 0x0007 (Start 2 - Specific Runner):
        // devNo = dt[4]..dt[5]
        // runner = dt[15]
        // Mac = dt[6]..dt[11] (Actually loop i+6)
        //
        // Dart code for startRunner:
        // header..devNo (6 bytes)
        // mac (6 bytes) -> Ends at index 11.
        // 0, 0, 0 (3 bytes) -> Indices 12, 13, 14.
        // pos (1 byte) -> Index 15.
        // 0, 0
        //
        // Consistent with FW case 0x0007 where runner is at dt[15].
        
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
        ]; // Fill to match length?
        // Dart: 14 zeros.
        // 2+1+1 + 14 = 18 bytes.
        data.push(this._calculatorSumCheck(data));
        data.push(0x00);
        return new Uint8Array(data);
    }
}
