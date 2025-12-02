export function appendReplaceOverlay(el) {
    if (!el) return;
    document.body.appendChild(el);
}

export function createDeviceOverlay(html) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay open';
    overlay.innerHTML = html;
    return overlay;
}

export function appendOverlay(overlay) {
    if (!overlay) return;
    document.body.appendChild(overlay);
}
