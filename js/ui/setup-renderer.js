import { escapeHTML } from '../utils/data-utils.js';
import { buildSetupPacerChips } from './race-view-model.js';

function buildSetupRow(race) {
    const pacerHtml = buildSetupPacerChips(race);
    const timeVal = escapeHTML(race.time);
    const nameVal = escapeHTML(race.name);
    const groupVal = escapeHTML(race.group);
    const distanceVal = escapeHTML(race.distance);
    const startPosVal = escapeHTML(race.startPos);
    const countVal = escapeHTML(race.count);

    return `
            <td><input type="time" class="input-cell" value="${timeVal}" data-action="update-field" data-field="time" data-race-id="${race.id}"></td>
            <td><input type="text" class="input-cell" value="${nameVal}" data-action="update-field" data-field="name" data-race-id="${race.id}"></td>
            <td><input type="number" class="input-cell" min="1" value="${groupVal}" data-action="update-field" data-field="group" data-race-id="${race.id}"></td>
            <td><input type="number" class="input-cell" min="0" value="${distanceVal}" data-action="update-field" data-field="distance" data-race-id="${race.id}"></td>
            <td><input type="number" class="input-cell input-start" min="0" value="${startPosVal}" data-action="update-field" data-field="startPos" data-race-id="${race.id}" step="any"></td>
            <td><input type="number" class="input-cell" min="0" value="${countVal}" data-action="update-field" data-field="count" data-race-id="${race.id}"></td>
            <td>${pacerHtml} <button class="btn-sm btn-outline" data-action="open-modal" data-race-id="${race.id}">＋</button></td>
            <td><button class="btn-sm btn-danger" style="border:none; background:#FFF0F0;" data-action="delete-race" data-race-id="${race.id}">削除</button></td>
    `;
}

export function buildSetupTableHTML(races = []) {
    if (!races || races.length === 0) return '';
    return races.map(race => `<tr>${buildSetupRow(race)}</tr>`).join('');
}

export function renderSetupTable(tbody, races = []) {
    if (!tbody) return;
    tbody.innerHTML = buildSetupTableHTML(races);
}
