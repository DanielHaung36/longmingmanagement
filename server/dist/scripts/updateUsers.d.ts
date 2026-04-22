#!/usr/bin/env ts-node
/**
 * 更新用户数据脚本
 *
 * 功能：
 * 1. 更新现有用户的邮箱
 * 2. 添加新用户
 * 3. 禁用不在列表中的用户
 */
import { PrismaClient } from '@prisma/client';
/**
 * 更新用户数据的主逻辑
 * @param prisma PrismaClient实例
 * @param silent 静默模式，减少输出
 */
export declare function updateUsersData(prisma: PrismaClient, silent?: boolean): Promise<void>;
//# sourceMappingURL=updateUsers.d.ts.map