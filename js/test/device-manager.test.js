import assert from 'assert';
import { addDeviceToList, deviceList, deviceSettings, markDeviceListDirty, loadDeviceList } from '../core/device-manager.js';

function resetDeviceState() {
  deviceList.length = 0;
  deviceSettings.totalDistance = 400;
  deviceSettings.interval = 2;
  markDeviceListDirty(false);
  global.localStorage = {
    store: {},
    getItem: (k) => global.localStorage.store[k],
    setItem: (k, v) => { global.localStorage.store[k] = v; }
  };
}

function testDummyMacRejected() {
  resetDeviceState();
  const res = addDeviceToList('00:00:00:00:00:00');
  assert.strictEqual(res.invalid, true, 'Dummy MAC should be rejected');
  assert.strictEqual(deviceList.length, 0, 'List should remain empty');
}

function testNormalMacAccepted() {
  resetDeviceState();
  const res = addDeviceToList('AA:BB:CC:DD:EE:FF');
  assert.strictEqual(res.added, true, 'Valid MAC should be added');
  assert.strictEqual(deviceList.length, 1, 'List should have one entry');
}

function testLoadDeviceListSanitizes() {
  resetDeviceState();
  global.localStorage.setItem('glow_device_list', JSON.stringify([
    { mac: 'AA:BB:CC:DD:EE:FF', status: 'active' },
    { mac: 123, status: 'dummy' },
    { mac: '00:00:00:00:00:00', status: 'dummy' },
  ]));
  loadDeviceList();
  assert.strictEqual(deviceList.length, 1, 'Invalid entries should be dropped');
  assert.strictEqual(deviceList[0].mac, 'AA:BB:CC:DD:EE:FF', 'Valid MAC should remain');
  assert.strictEqual(deviceList[0].id, 1, 'ID should be re-assigned');
}

function run() {
  testDummyMacRejected();
  testNormalMacAccepted();
  testLoadDeviceListSanitizes();
  console.log('device-manager tests passed');
}

run();
