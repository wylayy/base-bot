export declare class RedisDriver {
    private client;
    constructor();
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl?: number): Promise<"OK">;
    del(key: string): Promise<number>;
    has(key: string): Promise<boolean>;
}
