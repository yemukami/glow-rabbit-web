export function ensureNonNegativeNumber(val, defaultValue = 0) {
    const num = parseFloat(val);
    if (Number.isNaN(num) || num < 0) return defaultValue;
    return num;
}

export function ensurePositiveInt(val, defaultValue = 0) {
    const num = parseInt(val, 10);
    if (Number.isNaN(num) || num < 0) return defaultValue;
    return num;
}
