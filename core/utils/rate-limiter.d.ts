import { CacheService } from '@lazy-bot/core/services/cache/index';
export declare class RateLimiter {
    private cache;
    constructor(cache: CacheService);
    tooManyAttempts(key: string, maxAttempts: number): Promise<boolean>;
    hit(key: string, decaySeconds?: number): Promise<number>;
    attempt<T>(key: string, maxAttempts: number, callback: () => Promise<T> | T, decaySeconds?: number): Promise<T | false>;
    availableIn(key: string): Promise<number>;
    remaining(key: string, maxAttempts: number): Promise<number>;
    clear(key: string): Promise<void>;
}
