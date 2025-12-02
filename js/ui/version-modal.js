export function openVersionModal() {
    const modal = document.getElementById('modal-version');
    if (modal) modal.classList.add('open');
}

export function closeVersionModal() {
    const modal = document.getElementById('modal-version');
    if (modal) modal.classList.remove('open');
}
