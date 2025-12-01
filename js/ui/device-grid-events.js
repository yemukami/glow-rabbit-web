export function attachDeviceGridHandlers(grid, handlers = {}) {
    if (!grid || grid.__deviceHandlersAttached) return;
    grid.__deviceHandlersAttached = true;

    const { onOpenDevice, onSwapMode, getMode } = handlers;

    grid.addEventListener('click', (event) => {
        const cell = event.target.closest('[data-action="open-device"]');
        if (!cell) return;
        const idx = parseInt(cell.dataset.deviceIdx || '', 10);
        if (Number.isNaN(idx)) return;
        if (typeof getMode === 'function' && getMode() === 'swapping') {
            onSwapMode && onSwapMode(idx);
            return;
        }
        onOpenDevice && onOpenDevice(idx);
    });
}
