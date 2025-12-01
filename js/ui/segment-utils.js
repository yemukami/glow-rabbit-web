import { PaceCalculator } from '../core/pace-calculator.js';
import { roundToTenth, formatTime } from '../utils/render-utils.js';

export function readSegmentsFromDomRows(rows) {
    const segments = [];
    rows.forEach(tr => {
        const d = parseFloat(tr.querySelector('.inp-dist').value);
        const p = parseFloat(tr.querySelector('.inp-pace').value);
        if (d > 0 && p > 0) segments.push({ distance: d, pace: p });
    });
    return segments;
}

export function normalizeSegments(segments, raceDistance) {
    const clone = [...segments];
    clone.sort((a, b) => a.distance - b.distance);
    if (clone.length === 0) return clone;
    if (clone[clone.length - 1].distance < raceDistance) {
        clone.push({ distance: raceDistance, pace: clone[clone.length - 1].pace });
    }
    return clone;
}

export function buildSegmentsForSave(r, rows) {
    const segments = normalizeSegments(readSegmentsFromDomRows(rows), r.distance);
    if (segments.length === 0) return null;
    const pace = roundToTenth(segments[0].pace);
    const runPlan = PaceCalculator.createPlanFromSegments(segments, 400);
    return { type: 'segments', segments, pace, runPlan, targetTime: null };
}

export function computeSegmentSummaryText(race, rows) {
    const summary = { text: 'ゴール予想タイム: --:--.-', valid: false };
    if (!race || !race.distance) return summary;
    const segments = normalizeSegments(readSegmentsFromDomRows(rows), race.distance);
    if (segments.length === 0) return summary;
    const plan = PaceCalculator.createPlanFromSegments(segments, 400);
    const total = plan.length ? plan[plan.length - 1].endTime : 0;
    summary.text = `ゴール予想タイム: ${total > 0 ? formatTime(total) : '--:--.-'}`;
    summary.valid = total > 0;
    return summary;
}
