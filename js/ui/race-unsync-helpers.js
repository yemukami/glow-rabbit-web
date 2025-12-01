export function markOtherRacesUnsynced(races, targetRaceId) {
    if (!Array.isArray(races)) return;
    races.forEach(r => {
        if (!r || r.id === targetRaceId) return;
        r.initialConfigSent = false;
        r.syncNeeded = true;
    });
}

export function markRaceUnsynced(race) {
    if (!race) return;
    race.initialConfigSent = false;
    race.syncNeeded = true;
}
