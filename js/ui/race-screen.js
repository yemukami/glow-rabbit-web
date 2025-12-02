import { renderRaceTableDom, updateRunningDisplays } from './race-renderer.js';
import { getRaceTableBody } from './table-hooks.js';
import { getElapsedTime } from './race-ui-state.js';

export function renderRaceScreen(races, expandedRaceId, editingPaces) {
    const tbody = getRaceTableBody();
    if (!tbody) {
        console.error("[renderRaceScreen] No race tbody found!");
        return;
    }
    renderRaceTableDom(tbody, races, expandedRaceId, getElapsedTime(), editingPaces);
}

export function updateRunningRaceView(race, elapsedTime) {
    updateRunningDisplays(race, elapsedTime);
}
