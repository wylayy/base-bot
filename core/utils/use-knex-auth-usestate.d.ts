interface useKnexAuthStateParams {
    session: string;
    tableName?: string;
}
declare const useKnexAuthState: (params: useKnexAuthStateParams) => Promise<{
    state: {
        creds: any;
        keys: {
            get: (type: any, ids: any) => Promise<any>;
            set: (data: any) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
    clear: () => Promise<void>;
    removeCreds: () => Promise<void>;
    query: (sql: any, values: any) => Promise<null>;
}>;
export default useKnexAuthState;
