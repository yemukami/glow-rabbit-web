# Glow-Rabbit Web App - Refactoring Status Report
Date: 2025-11-28
Status: v2.1.0-beta.2 (Feature: Advanced Pacing / Modal Fix)

## 1. Overview
To improve maintainability and scalability for future app variations, we transitioned the monolithic `app.js` architecture to a modular ES Modules structure.
Major feature update: "Advanced Pacing Plan" implemented.

## 2. Architecture Changes
*   **Root:** `index.html` (Loads `main.js` via `<script type="module">`)
*   **Entry:** `main.js` (Imports and runs `initUI` from `ui-controller.js`)
*   **Modules (`js/`):**
    *   `ble/protocol.js`: Binary command generation.
    *   `ble/controller.js`: BLE connection, Queue.
    *   `core/device-manager.js`: Device list state.
    *   `core/race-manager.js`: Race data.
    *   `core/pace-calculator.js`: **NEW** Pacing logic (Target Time / Segments).
    *   `ui/ui-controller.js`: UI rendering, Modal Logic (Tabbed).

## 3. Recent Updates (v2.1.0)
*   **Pace Calculator:** Added logic to calculate split times based on Target Time or Segments.
*   **Tabbed Modal:** "Simple" (Target Time) and "Advanced" (Segments) modes for pacer settings.
*   **Run Plan:** Race execution now follows a calculated `runPlan` array, sending commands at specific distance intervals.
*   **Fixes:** Resolved ReferenceError in modal state handling.

## 4. Next Steps
1.  **Verify Pacing:** Test if commands are sent correctly at 400m intervals during a race.
2.  **Refinement:** Polish UI for segment input (validation, sorting).
