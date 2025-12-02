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
    if (!input) return;
    renderCompetitionTitle(input.value, inputId, titleId);
}

export function updateVersionDisplay(version) {
    const inlineEl = document.querySelector('.version-inline');
    if (inlineEl) inlineEl.textContent = version;
    const modalVersionEl = document.getElementById('modal-version-text');
    if (modalVersionEl) modalVersionEl.textContent = `Version: ${version}`;
}

export function renderCompetitionTitle(title, inputId = 'competition-title', titleId = 'race-screen-title') {
    const input = document.getElementById(inputId);
    if (input) input.value = title;
    const titleEl = document.getElementById(titleId);
    if (titleEl) titleEl.textContent = title;
}
