export function renderConnectionStatus(connected) {
    const el = document.querySelector('.ble-status');
    const btn = document.querySelector('.btn-connect');
    if (connected) {
        if (el) {
            el.innerHTML = '● 接続完了';
            el.style.color = 'var(--success-color)';
        }
        if (btn) {
            btn.innerHTML = '🔌 切断';
            btn.style.background = '#EEE';
            btn.style.color = '#555';
        }
        return;
    }
    if (el) {
        el.innerHTML = '● 未接続';
        el.style.color = '#999';
    }
    if (btn) {
        btn.innerHTML = '📡 接続';
        btn.style.background = '#EEF2F5';
        btn.style.color = 'var(--info-color)';
    }
}
