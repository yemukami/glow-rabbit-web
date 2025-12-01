function getModalRoot() {
    return document.getElementById('modal-settings');
}

function getTargetTimeInput() {
    return document.getElementById('modal-target-time');
}

function getCalcPaceEl() {
    return document.getElementById('modal-calc-pace');
}

export function setTargetTimeValue(value) {
    const input = getTargetTimeInput();
    if (input) input.value = value || '';
}

export function setCalcPaceText(text) {
    const el = getCalcPaceEl();
    if (el) el.innerText = text;
}

export function openModalUI() {
    const root = getModalRoot();
    if (root) root.classList.add('open');
}

export function closeModalUI() {
    const root = getModalRoot();
    if (root) root.classList.remove('open');
}

export function setColorSelection(color) {
    document.querySelectorAll('.color-option').forEach(e => e.classList.remove('selected'));
    const target = document.querySelector('.bg-' + color);
    if (target) target.classList.add('selected');
}

export function setActiveTabUI(tab) {
    document.querySelectorAll('.modal-tab').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(e => e.classList.remove('active'));
    const btn = document.getElementById('tab-btn-' + tab);
    const content = document.getElementById('tab-content-' + tab);
    if (btn) btn.classList.add('active');
    if (content) content.classList.add('active');
}
