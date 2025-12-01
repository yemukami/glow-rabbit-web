export function createModalState() {
    return {
        target: {},
        selectedColor: 'red',
        activeTab: 'simple'
    };
}

export function setModalTarget(state, target) {
    state.target = target;
}

export function setSelectedColor(state, color) {
    state.selectedColor = color;
}

export function setActiveTab(state, tab) {
    state.activeTab = tab;
}
