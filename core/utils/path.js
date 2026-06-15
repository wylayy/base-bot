import path from 'path';
import fs from 'fs';
const ROOT = process.cwd();
const joinPath = (base, subPath = '') => {
    return path.join(base, subPath);
};
export const dirRoot = (sub = '') => joinPath(ROOT, sub);
export const dirCore = (sub = '') => joinPath(ROOT, `core/${sub}`);
export const dirPlugins = (sub = '') => joinPath(ROOT, `plugins/${sub}`);
export const dirWorkspace = (sub = '') => joinPath(ROOT, `workspace/${sub}`);
export const dirStorage = (sub = '') => joinPath(ROOT, `storage/${sub}`);
export const dirTemp = (sub = '') => joinPath(ROOT, `storage/tmp/${sub}`);
export const initDirectories = () => {
    const essentialDirs = [dirStorage(), dirTemp(), dirPlugins(), dirWorkspace()];
    essentialDirs.forEach((dir) => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
