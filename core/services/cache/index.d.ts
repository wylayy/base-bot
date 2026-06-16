import { LruDriver } from '@lazy-bot/core/services/cache/lru';
import { RedisDriver } from '@lazy-bot/core/services/cache/redis';
declare let cacheInstance: LruDriver | RedisDriver;
export declare const initCache: () => void;
export declare class CacheService {
    private prefix;
    constructor(pluginKey: string);
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<import("lru-cache/raw").LRUCache<string, any, unknown> | "OK">;
    del(key: string): Promise<number | boolean>;
    has(key: string): Promise<boolean>;
    remember<T>(key: string, ttl: number, callback: () => Promise<T> | T): Promise<T>;
}
export { cacheInstance as cache };
