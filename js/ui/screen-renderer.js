export function renderScreenMode(mode) {
    const screen = document.getElementById(`screen-${mode}`);
    const button = document.getElementById(`btn-mode-${mode}`);
    if (!screen || !button) return false;

    document.querySelectorAll('.screen').forEach(e => e.classList.remove('active'));
    document.querySelectorAll('.mode-btn').forEach(e => e.classList.remove('active'));
    screen.classList.add('active');
    button.classList.add('active');
    return true;
}

export function syncRaceTitle(inputId, titleId) {
    const input = document.getElementById(inputId);
    const titleEl = document.getElementById(titleId);
    if (input && titleEl) {
        titleEl.innerText = input.value;
    }
}
