import { renderRaceTableDom, updateRunningDisplays } from './race-renderer.js';
import { getRaceTableBody } from './table-hooks.js';

export function renderRaceScreen(races, expandedRaceId, editingPaces, elapsedTime) {
    const tbody = getRaceTableBody();
    if (!tbody) {
        console.error("[renderRaceScreen] No race tbody found!");
        return;
    }
    renderRaceTableDom(tbody, races, expandedRaceId, elapsedTime, editingPaces);
}

export function updateRunningRaceView(race, elapsedTime) {
    updateRunningDisplays(race, elapsedTime);
}
