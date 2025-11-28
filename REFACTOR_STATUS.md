# Glow-Rabbit Web App - Refactoring Status Report
Date: 2025-11-28
Status: v2.0.0-alpha.1 (Refactoring Fixed / Ready for Testing)

## 1. Overview
To improve maintainability and scalability for future app variations, we transitioned the monolithic `app.js` architecture to a modular ES Modules structure.
The startup issues reported previously have been resolved.

## 2. Architecture Changes
*   **Root:** `index.html` (Loads `main.js` via `<script type="module">`)
*   **Entry:** `main.js` (Imports and runs `initUI` from `ui-controller.js`)
*   **Modules (`js/`):**
    *   `ble/protocol.js`: Binary command generation (Ported from `ble_protocol.js`).
    *   `ble/controller.js`: BLE connection, Queue, Notifications.
    *   `core/device-manager.js`: Device list state, Swap/Replace logic.
    *   `core/race-manager.js`: Race data, Calibration logic.
    *   `ui/ui-controller.js`: UI rendering, Event binding (Ported from `index.html` script).
*   **Styles:** `css/style.css` (Extracted from `index.html`).

## 3. Resolved Issues (2025-11-28)
*   **Startup Error:** Fixed `ReferenceError` caused by missing function definitions in `ui-controller.js` (`cancelReplace`, `confirmReplace`, `updateReplaceModalUI`) and missing exports in `device-manager.js` (`setDeviceToDummy`, `checkDirtyAndSync`).
*   **Logic Fix:** Fixed `Assignment to constant variable` error for `activeRaceId` by implementing `setActiveRaceId` accessor in `race-manager.js`.
*   **UI Implementation:** Implemented missing `openDeviceActionMenu` and Replace/Swap UI flows in `ui-controller.js`.

## 4. Next Steps
1.  **Manual Verification:** Open `index.html` in a Web Bluetooth compatible browser (Chrome/Edge).
    *   Check if startup alert is gone.
    *   Verify "Setup", "Race", "Devices" tabs switch correctly.
    *   Test "Device Action Menu" (click a device cell).
2.  **BLE Testing:** Connect to actual Glow-C hardware and verify:
    *   Connection/Disconnection.
    *   Notification handling (Device Auto-Add).
    *   Start/Stop Race commands.
3.  **Refinement:** Polish the "Replace Device" UI (currently a simple overlay).

## 5. Repository State
*   **Branch:** `main` (v2.0.0-alpha refactored code)
*   **Backup Branch:** `legacy-v1.3` (Last working monolithic version)
