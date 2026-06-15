export function random(arr) {
    if (!Array.isArray(arr) || arr.length === 0)
        return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}
export function shuffle(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
export function wrap(value) {
    if (value === null || value === undefined)
        return [];
    return Array.isArray(value) ? value : [value];
}
export function pluck(arr, key) {
    if (!Array.isArray(arr))
        return [];
    return arr.map((item) => item?.[key]);
}
export function chunk(arr, size) {
    if (!Array.isArray(arr) || size <= 0)
        return [];
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}
