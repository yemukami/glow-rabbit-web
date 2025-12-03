export function markOtherRacesUnsynced(races, targetRaceId) {
    if (!Array.isArray(races)) return;
    races.forEach(r => {
        if (!r || r.id === targetRaceId) return;
        markRaceUnsynced(r);
    });
}

export function markRaceUnsynced(race) {
    if (!race) return;
    race.initialConfigSent = false;
    race.syncNeeded = true;
}

export function resetRaceSyncState(race) {
    if (!race) return;
    race.initialConfigSent = true;
    race.syncNeeded = false;
}
