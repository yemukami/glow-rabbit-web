export function sanitizeNumberInput(raw, fallback = 0) {
    const n = parseFloat(raw);
    if (Number.isNaN(n)) return fallback;
    return n;
}

export function sanitizePositiveInt(raw, fallback = 0) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n) || n < 0) return fallback;
    return n;
}

export function resolvePaceValue(raw, fallback = 72) {
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n;
}

export function parseTimeInput(raw, fallbackSeconds = null) {
    if (!raw) return fallbackSeconds;
    const parts = String(raw).split(':').map(p => p.trim());
    if (parts.length === 1) {
        const sec = sanitizeNumberInput(parts[0], NaN);
        return Number.isNaN(sec) ? fallbackSeconds : sec;
    }
    if (parts.length === 2) {
        const min = sanitizeNumberInput(parts[0], NaN);
        const sec = sanitizeNumberInput(parts[1], NaN);
        if (Number.isNaN(min) || Number.isNaN(sec)) return fallbackSeconds;
        return min * 60 + sec;
    }
    return fallbackSeconds;
}
