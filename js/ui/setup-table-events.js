export function attachSetupTableHandlers(tbody, handlers = {}) {
    if (!tbody || tbody.__setupHandlersAttached) return;
    tbody.__setupHandlersAttached = true;

    const {
        onOpenModal,
        onOpenPacerModal,
        onDeleteRace,
        onUpdateField
    } = handlers;

    tbody.addEventListener('click', (event) => {
        const actionEl = event.target.closest('[data-action]');
        if (!actionEl) return;
        const action = actionEl.dataset.action;
        const raceId = parseInt(actionEl.dataset.raceId || '', 10);
        if (action === 'open-modal' && !Number.isNaN(raceId)) {
            onOpenModal && onOpenModal(raceId, null);
            return;
        }
        if (action === 'open-pacer-modal') {
            const pacerId = parseInt(actionEl.dataset.pacerId || '', 10);
            if (!Number.isNaN(raceId) && !Number.isNaN(pacerId)) {
                onOpenPacerModal && onOpenPacerModal(raceId, pacerId);
            }
            return;
        }
        if (action === 'delete-race' && !Number.isNaN(raceId)) {
            onDeleteRace && onDeleteRace(raceId);
        }
    });

    tbody.addEventListener('change', (event) => {
        const fieldEl = event.target.closest('[data-action="update-field"]');
        if (!fieldEl) return;
        const raceId = parseInt(fieldEl.dataset.raceId || '', 10);
        const field = fieldEl.dataset.field;
        if (Number.isNaN(raceId) || !field) return;
        onUpdateField && onUpdateField(raceId, field, fieldEl.value);
    });
}
