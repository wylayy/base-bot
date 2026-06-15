export function setNestedValue(target, path, value, position = null) {
    const parts = path.split('.');
    const lastKey = parts.pop();
    let current = target;
    for (const part of parts) {
        current = current[part] ??= {};
    }
    current[lastKey] = value;
    if (position === null || position === undefined)
        return;
    const keys = Object.keys(current);
    const curIndex = keys.indexOf(lastKey);
    if (curIndex === -1)
        return;
    if (curIndex === position)
        return;
    keys.splice(curIndex, 1);
    keys.splice(position, 0, lastKey);
    const snapshot = {};
    for (const k of keys)
        snapshot[k] = current[k];
    for (const k in current) {
        delete current[k];
    }
    Object.assign(current, snapshot);
}
export function getNestedValue(target, path) {
    if (!target || !path)
        return undefined;
    const parts = path.split('.');
    let current = target;
    for (const part of parts) {
        if (current === null || current === undefined) {
            return undefined;
        }
        current = current[part];
    }
    return current;
}
