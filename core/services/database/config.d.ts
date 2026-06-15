export declare const databaseConfig: {
    mysql: {
        client: string;
        connection: {
            host: string | undefined;
            port: number;
            user: string | undefined;
            password: string | undefined;
            database: string | undefined;
        };
    };
    sqlite: {
        client: string;
        connection: {
            filename: string;
        };
        useNullAsDefault: boolean;
    };
};
