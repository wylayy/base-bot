declare class PluginManager {
    pluginDir: string;
    workspaceDir: string;
    plugins: Map<string, any>;
    pluginPaths: Map<string, string>;
    commands: Map<string, any>;
    commandsIndex: Map<string, any>;
    middlewares: Map<string, any>;
    events: Map<string, any>;
    configs: Map<string, any>;
    languages: Map<string, any>;
    loadedPlugins: Set<string>;
    failedPlugins: Set<string>;
    private _cachedMiddlewares;
    private _cachedEvents;
    constructor();
    private getLogPrefix;
    load(isReload?: boolean): Promise<void>;
    reloadPlugin(pluginKey: string): Promise<void>;
    private cleanupPluginData;
    private checkDependencies;
    private loadPlugin;
    runMigrations(pluginKey: string, options?: {
        rollback?: boolean;
        fresh?: boolean;
        customPath?: string;
    }): Promise<{
        rolledBack?: string[];
        migrated?: string[];
    } | undefined>;
    private loadJsDir;
    private loadJsonDir;
    private updateMiddlewareCache;
    private updateEventCache;
    runEvents(eventName: string, eventData: any, sock: any): Promise<void>;
    runMiddlewares(eventName: string, payload: any, sock: any): Promise<boolean>;
    getConfig(pluginKey: string, configPath: string): any;
    setConfig(pluginKey: string, configPath: string, newData: any): Promise<boolean>;
}
declare const pluginManager: PluginManager;
export default pluginManager;
