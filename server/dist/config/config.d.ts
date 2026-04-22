export declare const config: {
    nodeEnv: string;
    port: number;
    clientUrl: string;
    isDevelopment: boolean;
    devAutoLogin: boolean;
    database: {
        url: string;
    };
    storage: {
        localRoot: string;
        templateRoot: string;
        excelPath: string;
        logPath: string;
        oneDriveBase: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
    };
    smtp: {
        host: string;
        port: number;
        user: string;
        pass: string;
        fromEmail: string;
        fromName: string;
    };
    cookie: {
        name: string;
        maxAge: number;
        httpOnly: boolean;
        secure: boolean;
        sameSite: "lax";
        path: string;
    };
    cors: {
        origin: string;
        credentials: boolean;
    };
    temporal: {
        address: string;
        namespace: string;
        startWorker: boolean;
    };
    neo4j: {
        uri: string;
        username: string;
        password: string;
        database: string;
    };
    pagination: {
        defaultPage: number;
        defaultLimit: number;
        maxLimit: number;
    };
};
export declare function validateConfig(): void;
export declare function printConfig(): void;
export default config;
//# sourceMappingURL=config.d.ts.map