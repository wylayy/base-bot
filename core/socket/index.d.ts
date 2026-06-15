interface InitSessionOptions {
    sessionId: string;
    phoneNumber?: string;
    usePairingCode?: boolean;
    reconnecting?: boolean;
}
export declare class WASocketManager {
    private readonly MAX_RECONNECT_ATTEMPTS;
    private readonly CONNECTION_TIMEOUT_SECONDS;
    private readonly PAIRING_CODE_DELAY_SECONDS;
    private readonly PATH_SESSION;
    private readonly DRIVER_AUTH_STATE;
    private SESSIONS;
    SESSION_STATUS: Map<string, string>;
    private SESSION_ATTEMPTS;
    private SESSION_CONNECTION_TIMEOUTS;
    private SESSION_PAIRING_TIMEOUTS;
    private SESSION_LOCKS;
    WEB_SOCKET: Map<string, Set<any>>;
    private cachedWAVersion;
    constructor();
    private getWAVersion;
    private clearAllTimeouts;
    private setConnectionTimeout;
    private WebSocketEmit;
    private useAuthState;
    private clearGroupCache;
    private setupGroupCache;
    getSession(sessionId: string): any;
    initSession({ sessionId, phoneNumber, usePairingCode, reconnecting, }: InitSessionOptions): Promise<any>;
    stopSession(sessionId: string): Promise<void>;
    removeSession(sessionId: string): Promise<void>;
    autoStart(): Promise<{
        length: number;
        loaded: number;
        failed: number;
        message: string;
    } | undefined>;
    healthCheck(id: string): any;
    shutdown(): Promise<void>;
}
declare const instance: WASocketManager;
export default instance;
