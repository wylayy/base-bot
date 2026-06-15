import logger from './logger.js';
export function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function isUrl(text) {
    try {
        new URL(text);
        return true;
    }
    catch (e) {
        return false;
    }
}
export async function retry(fn, retries = 3, delayMs = 1000) {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            logger.warn(`[RETRY] Attempt ${i + 1}/${retries} failed. Retrying in ${delayMs}ms...`);
            if (i < retries - 1) {
                await delay(delayMs);
            }
        }
    }
    throw lastError;
}
