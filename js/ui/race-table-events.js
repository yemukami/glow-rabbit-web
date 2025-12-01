export function attachRaceTableHandlers(tbody, handlers = {}) {
    if (!tbody || tbody.__raceHandlersAttached) return;
    tbody.__raceHandlersAttached = true;

    const {
        onToggleRow,
        onConnect,
        onSync,
        onStart,
        onStop,
        onFinalize,
        onReset,
        onUpdateStartPos
    } = handlers;

    tbody.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-action]');
        const raceEl = event.target.closest('[data-race-id]');
        const stopToggle = event.target.closest('[data-stop-toggle="true"]');
        const raceId = raceEl ? parseInt(raceEl.dataset.raceId, 10) : null;

        if (actionEl) {
            event.stopPropagation();
            const action = actionEl.dataset.action;
            const actionRaceId = actionEl.dataset.raceId ? parseInt(actionEl.dataset.raceId, 10) : raceId;
            handleRaceAction(action, actionRaceId, handlers);
            return;
        }

        if (stopToggle) return;
        if (raceId !== null && !Number.isNaN(raceId) && typeof onToggleRow === 'function') {
            onToggleRow(raceId, event);
        }
    });

    tbody.addEventListener('change', (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        const raceId = actionEl.dataset.raceId ? parseInt(actionEl.dataset.raceId, 10) : null;
        if (action === 'startPos' && raceId !== null && !Number.isNaN(raceId) && typeof onUpdateStartPos === 'function') {
            onUpdateStartPos(raceId, event.target.value);
        }
    });

    function handleRaceAction(action, raceId, h) {
        if (!action) return;
        if (action === 'connect') { h.onConnect && h.onConnect(); return; }
        if (raceId === null || Number.isNaN(raceId)) return;
        if (action === 'toggle') { h.onToggleRow && h.onToggleRow(raceId); return; }
        if (action === 'sync') { h.onSync && h.onSync(raceId); return; }
        if (action === 'start') { h.onStart && h.onStart(raceId); return; }
        if (action === 'stop') { h.onStop && h.onStop(raceId); return; }
        if (action === 'finalize') { h.onFinalize && h.onFinalize(raceId); return; }
        if (action === 'reset') { h.onReset && h.onReset(raceId); }
    }
}
