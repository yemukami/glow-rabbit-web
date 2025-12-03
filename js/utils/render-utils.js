export function roundToTenth(value, fallback = 0) {
    if (!Number.isFinite(value)) return fallback;
    return Math.round(value * 10) / 10;
}

export function formatPace(value, fallback = '--.-') {
    if (!Number.isFinite(value)) return fallback;
    return roundToTenth(value).toFixed(1);
}

export function formatPaceLabel(value, fallback = '--.-s') {
    const formatted = formatPace(value, null);
    if (formatted === null) return fallback;
    return `${formatted}s`;
}

export function formatDistanceMeters(value, fallback = '0m') {
    if (!Number.isFinite(value)) return fallback;
    return `${Math.floor(value)}m`;
}

export function formatTime(s) {
    if(s<0) return "00:00.0";
    let m=Math.floor(s/60), sec=Math.floor(s%60), ms=Math.floor((s*10)%10);
    return `${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms}`;
}

export function buildRaceBadge(status, syncNeeded = false) {
    let badge = '';
    if(status === 'ready') badge = '<span class="status-badge status-ready">待機</span>';
    if(status === 'running') badge = '<span class="status-badge status-running">実行中</span>';
    if(status === 'review') badge = '<span class="status-badge status-review">記録確認</span>';
    if(status === 'finished') badge = '<span class="status-badge status-finished">完了</span>';
    if (syncNeeded) badge += ' <span class="status-badge status-warning" title="レース設定（色/ペース）を送信してください">要レース設定送信</span>';
    return badge;
}
