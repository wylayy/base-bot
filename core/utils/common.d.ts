export declare function delay(ms: number): Promise<void>;
export declare function isUrl(text: string): boolean;
export declare function retry<T>(fn: () => Promise<T>, retries?: number, delayMs?: number): Promise<T>;
