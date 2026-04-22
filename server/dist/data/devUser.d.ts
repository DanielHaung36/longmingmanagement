/**
 * 获取开发模式管理员用户（从数据库查询）
 */
export declare function getDevAdmin(): Promise<any>;
/**
 * 获取开发模式普通用户（从数据库查询）
 */
export declare function getDevDeveloper(): Promise<any>;
export declare const DevAdmin: {
    id: number;
    username: string;
    email: string;
    realName: string;
};
export declare const DevUser: {
    id: number;
    username: string;
    email: string;
    realName: string;
};
export declare const DevUsers: {
    admin: {
        id: number;
        username: string;
        email: string;
        realName: string;
    };
    developer: {
        id: number;
        username: string;
        email: string;
        realName: string;
    };
    test: {
        id: number;
        username: string;
        email: string;
        realName: string;
    };
};
export declare function getDevUser(username?: string): {
    id: number;
    username: string;
    email: string;
    realName: string;
};
export declare function getUserFromCookie(cookie: string): {
    id: number;
    username: string;
    email: string;
    realName: string;
};
//# sourceMappingURL=devUser.d.ts.map