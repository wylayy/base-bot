export function toNumber(value, fallback = 0) {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
}
export function toBoolean(value) {
    if (typeof value === 'boolean')
        return value;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return ['true', '1', 'yes', 'y', 'on'].includes(lower);
    }
    if (typeof value === 'number')
        return value > 0;
    return !!value;
}
export function parseMs(timeStr) {
    if (!timeStr)
        return 0;
    const regex = /(\d+)\s*(d|h|m|s)/gi;
    let totalMs = 0;
    let match;
    while ((match = regex.exec(timeStr)) !== null) {
        const val = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'd')
            totalMs += val * 24 * 60 * 60 * 1000;
        if (unit === 'h')
            totalMs += val * 60 * 60 * 1000;
        if (unit === 'm')
            totalMs += val * 60 * 1000;
        if (unit === 's')
            totalMs += val * 1000;
    }
    return totalMs;
}
export function msToTime(ms) {
    if (ms <= 0)
        return '0 detik';
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const parts = [];
    if (days > 0)
        parts.push(`${days} hari`);
    if (hours > 0)
        parts.push(`${hours} jam`);
    if (minutes > 0)
        parts.push(`${minutes} menit`);
    if (seconds > 0)
        parts.push(`${seconds} detik`);
    return parts.join(' ');
}
export function toBase64(data) {
    return Buffer.isBuffer(data)
        ? data.toString('base64')
        : Buffer.from(String(data)).toString('base64');
}
export function fromBase64(base64) {
    return Buffer.from(base64, 'base64').toString('utf8');
}
