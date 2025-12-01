export function renderReplaceModal(targetIndex, macText) {
    const overlay = document.createElement('div');
    overlay.id = 'modal-replace-overlay';
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = `
            <div class="modal-content">
                <h3>Replace Device</h3>
                <p>Target: #${targetIndex + 1}</p>
                <p>Detected MAC: <strong id="replace-mac-display" style="font-size:1.2em; color:var(--primary-color);">${macText}</strong></p>
                <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:20px;">
                    <button class="btn-sm btn-outline" data-action="replace-cancel">Cancel</button>
                    <button class="btn-sm btn-primary" data-action="replace-confirm">Replace</button>
                </div>
            </div>
        `;
    return overlay;
}

export function updateReplaceMacText(text) {
    const display = document.getElementById('replace-mac-display');
    if (display) display.innerText = text;
}
