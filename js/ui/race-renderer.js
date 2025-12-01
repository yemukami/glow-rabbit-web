import { formatDistanceMeters, formatPaceLabel, formatTime } from '../utils/render-utils.js';
import { buildRaceRowClass, buildRaceViewModel, computeLeadAndFill } from './race-view-model.js';

export function buildCollapsedRaceContent(vm) {
    const { safeTime, safeName, safeGroup, safeDistance, badge, race } = vm;
    const chips = buildCollapsedPacerChips(race.pacers);
    return `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong style="font-size:16px;">${safeTime} ${safeName}</strong> 
                <span style="color:#8E8E93; margin-left:10px;">${safeGroup}組 (${safeDistance}m)</span>
                ${badge}
                <div style="margin-top:8px;">${chips}</div>
            </div>
            <div style="color:#C6C6C8; font-size:20px;">▼</div>
        </div>`;
}

export function buildExpandedRaceContent(vm, elapsedTime, editingPaces = {}) {
    const { race, safeTime, safeName, safeGroup, safeDistance, safeStartPos, badge, progress } = vm;

    const pacerRows = buildPacerRows(race, elapsedTime, editingPaces);
    const headsHtml = buildProgressHeads(race, progress.totalScale);
    const marksHtml = buildMarkers(race, progress.totalScale);

    const btnArea = buildActionArea(race.id, race.status);
    const infoHeader = buildInfoHeader(race, progress.maxDist, safeStartPos, elapsedTime);

    return `
        <div style="border-bottom:1px solid #F0F0F0; padding-bottom:15px; margin-bottom:15px; display:flex; align-items:center; justify-content:space-between;">
                <div>
                <span style="font-size:20px; font-weight:bold;">${safeTime} ${safeName}</span>
                <span style="color:#8E8E93; margin-left:10px;">${safeGroup}組 (${safeDistance}m)</span>
                    ${badge}
                </div>
                <button style="border:none; background:none; color:#CCC; font-size:18px;">▲</button>
        </div>
        <div class="race-control-layout" onclick="event.stopPropagation()">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:8px;">
                    ${infoHeader}
                    <div id="lead-dist-display">先頭: <strong>${formatDistanceMeters(progress.maxDist)}</strong></div>
                </div>
                <div class="progress-container">
                    <div class="progress-fill" id="progress-fill-${race.id}" style="width:${progress.fillPct}%"></div>
                    ${headsHtml} ${marksHtml}
                </div>
                <div class="inline-controller">${pacerRows}</div>
            </div>
            <div>${btnArea}</div>
        </div>`;
}

export function renderRaceTable(races, expandedRaceId, elapsedTime, editingPaces = {}) {
    if (!races || races.length === 0) return '';
    return races.map(race => {
        const vm = buildRaceViewModel(race, expandedRaceId);
        const rowClass = buildRaceRowClass(race, expandedRaceId);
        const content = vm.isExpanded
            ? buildExpandedRaceContent(vm, elapsedTime, editingPaces)
            : buildCollapsedRaceContent(vm);
        return `<tr class="${rowClass}" onclick="toggleRow(${race.id}, event)"><td>${content}</td></tr>`;
    }).join('');
}

export function updateRunningDisplays(race, elapsedTime) {
    if (!race) return;
    const { totalScale, maxDist, fillPct } = computeLeadAndFill(race);

    const timerEl = document.getElementById('timer-display');
    if (timerEl) timerEl.innerText = formatTime(elapsedTime || 0);

    updatePacerHeadsAndEstimates(race, totalScale);

    const fillEl = document.getElementById(`progress-fill-${race.id}`);
    if (fillEl) fillEl.style.width = `${fillPct}%`;

    const leadEl = document.getElementById('lead-dist-display');
    if (leadEl) {
        leadEl.innerHTML = `先頭: <strong>${formatDistanceMeters(maxDist)}</strong>`;
    }
}

// --- Renderer-local helpers (DOM-free string builders) ---

function buildActionArea(raceId, status) {
    if (status === 'ready') {
        return `<div class="action-btn-col"><button class="btn-reconnect" onclick="event.stopPropagation(); connectBLE();">📡 BLE接続</button><button class="btn-big-start" onclick="event.stopPropagation(); startRaceWrapper(${raceId})">START</button></div>`;
    }
    if (status === 'running') {
        return `<button class="btn-big-stop" onclick="event.stopPropagation(); stopRaceWrapper(${raceId})">STOP</button>`;
    }
    if (status === 'review') {
        return `<button class="btn-big-close" onclick="event.stopPropagation(); finalizeRace(${raceId})">閉じる</button>`;
    }
    if (status === 'finished') {
        return `<button class="btn-big-reset" onclick="event.stopPropagation(); resetRace(${raceId})">リセット</button>`;
    }
    return '';
}

function buildInfoHeader(race, maxDist, safeStartPos, elapsedTime) {
    if (race.status === 'ready') {
        const syncTag = race.syncNeeded ? `<span class="status-badge status-warning">要同期</span>` : '';
        return `<div style="display:flex; gap:10px; align-items:center;"><div class="timer-big" style="color:#DDD;">00:00.0</div><input type="number" value="${safeStartPos}" style="width:50px;" onchange="updateStartPos(${race.id},this.value)">${syncTag}</div>`;
    }
    if (race.status === 'running') {
        return `<div class="timer-big" id="timer-display">${formatTime(elapsedTime || 0)}</div>`;
    }
    if (race.status === 'review') {
        return `<div class="timer-big">${formatTime(elapsedTime || 0)}</div>`;
    }
    if (race.status === 'finished') {
        return `<div>記録済み</div>`;
    }
    return `<div>先頭: <strong>${formatDistanceMeters(maxDist)}</strong></div>`;
}

function buildPacerRows(r, elapsedTime, editingPaces) {
    if(!r.pacers || !Array.isArray(r.pacers)) return "";
    return r.pacers.map(p => {
        const paceValue = editingPaces && editingPaces[p.id] !== undefined ? editingPaces[p.id] : p.pace;
        let estStr = "--:--";
        let avgPace = 0;
        const safePace = formatPaceLabel(paceValue);
        if (p.finishTime !== null) {
            estStr = `Goal (${formatTime(p.finishTime)})`;
            avgPace = (p.finishTime / r.distance) * 400; 
        } else if (r.status === 'ready') {
            let speed = 400 / (paceValue || 72); 
            let estSec = r.distance / speed;
            estStr = `Est (${formatTime(estSec)})`;
        } else {
            const speed = 400 / (paceValue || 72); 
            const remDist = r.distance - (p.currentDist || 0);
            const remSec = remDist / speed;
            estStr = formatTime((elapsedTime || 0) + remSec);
            if(p.currentDist > 0) avgPace = ((elapsedTime || 0) / p.currentDist) * 400;
        }
        let avgLabel = (avgPace > 0 && r.status !== 'ready') ? `<span class="avg-pace-label">Avg: ${formatPaceLabel(avgPace)}</span>` : "";

        return `
        <div class="pacer-control-row" onclick="event.stopPropagation()">
            <div class="pacer-info"><span class="dot-large bg-${p.color}"></span></div>
            <div class="pacer-adjust">
                <div style="font-size:24px; font-weight:bold; margin-left:10px;">${safePace}</div>
                <div style="margin-left:10px;">${avgLabel}</div>
            </div>
            <div class="pacer-est-time" id="pacer-est-${p.id}">${estStr}</div>
        </div>`;
    }).join('');
}

function buildProgressHeads(r, totalScale) {
    if(!r.pacers || !Array.isArray(r.pacers)) return "";
    return r.pacers.map(p => {
        let cDist = p.currentDist || 0;
        let leftPct = Math.min((cDist / totalScale) * 100, 100);
        return `<div class="pacer-head bg-${p.color||'red'}" id="pacer-head-${p.id}" style="left:${leftPct}%"><div class="pacer-head-label" style="color:${p.color==='yellow'?'black':'var(--primary-color)'}">${formatDistanceMeters(cDist)}</div></div>`;
    }).join('');
}

function buildMarkers(r, totalScale) {
    if(!r.markers || !Array.isArray(r.markers)) return "";
    return r.markers.map(m => {
        let leftPct = (m.dist / totalScale) * 100;
        return `<div class="history-tick bg-${m.color||'gray'}" style="left:${leftPct}%"><div class="history-tick-label text-${m.color||'gray'}">${m.pace || ''}</div></div>`;
    }).join('');
}

function buildCollapsedPacerChips(pacers) {
    if(!pacers || !Array.isArray(pacers)) return '';
    return pacers
        .map(p => `<span class="pacer-chip"><span class="dot bg-${p.color||'red'}"></span>${formatPaceLabel(p.pace || 72)}</span>`)
        .join(' ');
}

function updatePacerHeadsAndEstimates(race, totalScale) {
    if (!race.pacers || !Array.isArray(race.pacers)) return;
    race.pacers.forEach(p => {
        const headEl = document.getElementById(`pacer-head-${p.id}`);
        if (headEl) {
            const cDist = p.currentDist || 0;
            const leftPct = Math.min((cDist / totalScale) * 100, 100);
            headEl.style.left = `${leftPct}%`;
            const labelEl = headEl.querySelector('.pacer-head-label');
            if (labelEl) labelEl.innerText = formatDistanceMeters(cDist);
        }
        const estEl = document.getElementById(`pacer-est-${p.id}`);
        if (estEl) {
            let estStr = "";
            if (p.finishTime !== null) {
                estStr = `Goal (${formatTime(p.finishTime)})`;
            } else if (p.runPlan) {
                const lastSeg = p.runPlan[p.runPlan.length - 1];
                if (lastSeg) estStr = `Goal (${formatTime(lastSeg.endTime)})`;
            }
            estEl.innerText = estStr;
        }
    });
}
