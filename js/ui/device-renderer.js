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
