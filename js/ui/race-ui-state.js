const raceUIState = {
    expandedRaceId: null,
    editingPaces: {},
    elapsedTime: 0,
    raceInterval: null
};

export function getExpandedRaceId() {
    return raceUIState.expandedRaceId;
}

export function setExpandedRaceId(id) {
    raceUIState.expandedRaceId = id;
}

export function toggleExpandedRace(id) {
    raceUIState.expandedRaceId = raceUIState.expandedRaceId === id ? null : id;
    return raceUIState.expandedRaceId;
}

export function getEditingPaces() {
    return raceUIState.editingPaces;
}

export function setEditingPace(pacerId, value) {
    raceUIState.editingPaces[pacerId] = value;
}

export function clearEditingPace(pacerId) {
    delete raceUIState.editingPaces[pacerId];
}

export function resetEditingPaces() {
    raceUIState.editingPaces = {};
}

export function getElapsedTime() {
    return raceUIState.elapsedTime;
}

export function setElapsedTime(value) {
    raceUIState.elapsedTime = value;
}

export function resetElapsedTime() {
    raceUIState.elapsedTime = 0;
}

export function getRaceInterval() {
    return raceUIState.raceInterval;
}

export function setRaceInterval(handle) {
    if (raceUIState.raceInterval) {
        clearInterval(raceUIState.raceInterval);
    }
    raceUIState.raceInterval = handle;
}

export function clearRaceInterval() {
    if (raceUIState.raceInterval) {
        clearInterval(raceUIState.raceInterval);
        raceUIState.raceInterval = null;
    }
}

export function resetRaceUiState() {
    clearRaceInterval();
    resetElapsedTime();
    resetEditingPaces();
    raceUIState.expandedRaceId = null;
}
