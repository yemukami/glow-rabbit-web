export function buildDeviceGridHtml(deviceList, deviceSettings, deviceInteraction) {
    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    let html = `<div class="device-grid ${deviceInteraction.mode === 'swapping' ? 'mode-swapping' : ''}" id="device-grid">`;
    for (let i = 0; i < maxDevices; i++) {
        const d = deviceList[i];
        const dist = i * deviceSettings.interval;
        let cellClass = 'device-cell';
        if (deviceInteraction.mode === 'swapping' && deviceInteraction.targetIndex === i) cellClass += ' swap-source';
        let macDisplay = '';
        if (d) {
            if(d.status==='dummy') { cellClass += ' cell-dummy'; macDisplay='(DUMMY)'; }
            else { cellClass += ' cell-active'; macDisplay=d.mac.slice(-5); }
        } else { cellClass += ' cell-empty'; }
        html += `<div class="${cellClass}" data-device-idx="${i}" data-action="open-device"><span>#${i+1} ${dist}m</span><br><small>${macDisplay}</small></div>`;
    }
    html += `</div>`;
    return html;
}

export function buildDeviceOverlayHtml(idx, dist, device) {
    return `
        <div class="modal-content" style="width:320px;">
            <h3 style="margin-top:0;">Device #${idx + 1} (${dist}m)</h3>
            <p style="color:#888; margin-bottom:20px;">MAC: ${device ? device.mac : 'None'} <br> Status: ${device ? device.status : 'Empty'}</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
                <button class="btn-sm btn-outline" data-action="device-blink" data-idx="${idx}">💡 Test Blink</button>
                <button class="btn-sm btn-outline" data-action="device-swap" data-idx="${idx}">⇄ Swap Position</button>
                <button class="btn-sm btn-outline" data-action="device-replace-scan" data-idx="${idx}">🔄 Replace (Scan)</button>
                <button class="btn-sm btn-outline" data-action="device-replace-manual" data-idx="${idx}">✏️ Edit MAC Manually</button>
                <button class="btn-sm btn-outline" data-action="device-dummy" data-idx="${idx}">👻 Set to Dummy</button>
                <button class="btn-sm btn-danger" data-action="device-remove" data-idx="${idx}">🗑 Remove</button>
            </div>
            <div style="margin-top:20px; text-align:right;">
                <button class="btn-sm" data-action="modal-close">Close</button>
            </div>
        </div>
    `;
}

export function renderDeviceGridView(
    deviceList,
    deviceSettings,
    deviceInteraction,
    handlers = {},
    { containerId = 'device-list-container', countDisplayId = 'device-count-display' } = {}
) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const maxDevices = Math.ceil(deviceSettings.totalDistance / deviceSettings.interval);
    const countEl = document.getElementById(countDisplayId);
    if (countEl) {
        countEl.innerText = `${deviceList.length} / ${maxDevices}`;
    }

    container.innerHTML = buildDeviceGridHtml(deviceList, deviceSettings, deviceInteraction);
    const grid = container.querySelector('#device-grid');
    if (grid) {
        attachDeviceGridHandlers(grid, handlers);
    }
}

export function renderDeviceOverlayView(idx, dist, device, handlers = {}) {
    const overlay = createDeviceOverlay(buildDeviceOverlayHtml(idx, dist, device));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            return;
        }
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        const parsedIdx = parseInt(actionEl.dataset.idx || '', 10);
        if (action === 'modal-close') {
            overlay.remove();
            return;
        }
        if (Number.isNaN(parsedIdx)) return;
        const handler = handlers[action];
        if (typeof handler === 'function') {
            handler(parsedIdx, overlay);
        }
    });
    appendOverlay(overlay);
    return overlay;
}
import { attachDeviceGridHandlers } from './device-grid-events.js';
import { createDeviceOverlay, appendOverlay } from './overlay-renderer.js';
