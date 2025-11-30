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
