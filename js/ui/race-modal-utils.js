export function parseTimeStr(str) {
    if (!str) return 0;
    const parts = str.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseFloat(parts[1]);
        if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
        return (minutes * 60) + seconds;
    }
    const sec = parseFloat(str);
    return Number.isNaN(sec) ? 0 : sec;
}

export function computePaceFromTarget(raceDistance, targetStr) {
    const sec = parseTimeStr(targetStr);
    if (sec <= 0 || !raceDistance) return null;
    return (sec / raceDistance) * 400;
}
