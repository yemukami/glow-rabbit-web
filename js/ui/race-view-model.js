import { formatDistanceMeters, buildRaceBadge, formatPaceLabel } from '../utils/render-utils.js';
import { resolvePaceValue, escapeHTML } from '../utils/data-utils.js';

export function buildRaceRowClass(race, expandedRaceId) {
    let rowClass = 'race-row';
    if (race.id === expandedRaceId) rowClass += ' expanded';
    if (race.status === 'running') rowClass += ' active-running';
    if (race.status === 'review') rowClass += ' active-review';
    if (race.status === 'finished') rowClass += ' finished';
    return rowClass;
}

export function buildRaceViewModel(race, expandedRaceId) {
    return {
        race,
        id: race.id,
        status: race.status,
        isExpanded: race.id === expandedRaceId,
        safeTime: escapeHTML(race.time),
        safeName: escapeHTML(race.name),
        safeGroup: escapeHTML(race.group),
        safeDistance: escapeHTML(race.distance),
        safeStartPos: escapeHTML(race.startPos),
        badge: buildRaceBadge(race.status, race.syncNeeded),
        progress: computeLeadAndFill(race)
    };
}

export function buildCollapsedPacerChips(pacers) {
    if(!pacers || !Array.isArray(pacers)) return '';
    return pacers
        .map(p => `<span class="pacer-chip"><span class="dot bg-${p.color||'red'}"></span>${formatDisplayPaceLabel(p.pace)}</span>`)
        .join(' ');
}

export function buildSetupPacerChips(race) {
    if (!race.pacers || !Array.isArray(race.pacers)) return '';
    return race.pacers
        .map(p => {
            const paceLabel = formatDisplayPaceLabel(p.pace);
            return `<span class="pacer-chip" data-action="open-pacer-modal" data-race-id="${race.id}" data-pacer-id="${p.id}"><span class="dot bg-${p.color}"></span>${paceLabel}</span>`;
        })
        .join(' ');
}

export function buildRaceViewModels(races, expandedRaceId) {
    return races.map(race => ({
        vm: buildRaceViewModel(race, expandedRaceId),
        rowClass: buildRaceRowClass(race, expandedRaceId)
    }));
}

export function computeLeadAndFill(r) {
    const totalScale = (r.distance || 400) + 50; // PROGRESS_BAR_PADDING_METERS default
    let maxDist = 0;
    if(r.pacers && r.pacers.length > 0) maxDist = Math.max(0, ...r.pacers.map(p=>p.currentDist||0));
    let fillPct = Math.min((maxDist / totalScale) * 100, 100);
    return { totalScale, maxDist, fillPct };
}

// Helpers copied from ui-controller to keep this module pure; they will be consolidated later.
function formatDisplayPaceLabel(rawPace) {
    const pace = resolvePaceValue(rawPace);
    return formatPaceLabel(pace);
}
