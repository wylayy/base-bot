declare class PluginWatcher {
    private watchers;
    private debounceTimer;
    private changedPlugins;
    isWatching(): boolean;
    init(options?: {
        watchAll?: boolean;
    }): void;
    stop(): void;
}
declare const _default: PluginWatcher;
export default _default;
