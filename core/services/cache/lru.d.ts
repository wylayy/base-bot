import { LRUCache } from 'lru-cache';
export declare class LruDriver {
    private client;
    constructor();
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<LRUCache<string, any, unknown>>;
    del(key: string): Promise<boolean>;
    has(key: string): Promise<boolean>;
}
