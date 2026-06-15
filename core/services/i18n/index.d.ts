export declare let currentLang: string;
export declare const t: (pathKey: string, params?: Record<string, any>, customLang?: string) => string;
export declare function setGlobalLang(newLang: string): Promise<boolean>;
export declare function initI18n(): Promise<void>;
export declare const getAvailableLangs: () => string[];
