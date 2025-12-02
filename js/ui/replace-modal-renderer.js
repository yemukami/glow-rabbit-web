import { appendReplaceOverlay } from './overlay-renderer.js';

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

export function getReplaceOverlay() {
    return document.getElementById('modal-replace-overlay');
}

export function showReplaceOverlay(targetIndex, macText, handlers = {}) {
    const overlay = renderReplaceModal(targetIndex, macText);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.remove();
            handlers.onCancel && handlers.onCancel();
            return;
        }
        const actionEl = e.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        if (action === 'replace-cancel') {
            overlay.remove();
            handlers.onCancel && handlers.onCancel();
            return;
        }
        if (action === 'replace-confirm') {
            handlers.onConfirm && handlers.onConfirm();
        }
    });
    appendReplaceOverlay(overlay);
    return overlay;
}
