#!/usr/bin/env ts-node
"use strict";
/**
 * 权限定义种子数据脚本
 * Seed Permission Definitions
 *
 * 功能：初始化 permission_definitions 表
 * 用法：npm run seed:permissions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
/**
 * 权限定义映射
 * 格式：{ code, name, description, resource, action, scope }
 */
const PERMISSION_DEFINITIONS = [
    // ===== 系统管理权限 =====
    {
        code: 'SYSTEM_ADMIN',
        name: '系统管理',
        description: '完整的系统管理权限',
        resource: 'SYSTEM',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 用户管理权限 =====
    {
        code: 'USER_MANAGE',
        name: '用户管理',
        description: '创建、编辑、删除用户',
        resource: 'USER',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 角色管理权限 =====
    {
        code: 'ROLE_MANAGE',
        name: '角色管理',
        description: '管理角色和权限分配',
        resource: 'SYSTEM',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 团队管理权限 =====
    {
        code: 'TEAM_MANAGE',
        name: '团队管理',
        description: '创建和管理团队',
        resource: 'TEAM',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 项目权限 =====
    {
        code: 'PROJECT_CREATE',
        name: '创建项目',
        description: '创建新项目',
        resource: 'PROJECT',
        action: 'CREATE',
        scope: 'SYSTEM',
    },
    {
        code: 'PROJECT_READ',
        name: '查看项目',
        description: '查看项目信息',
        resource: 'PROJECT',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'PROJECT_UPDATE',
        name: '编辑项目',
        description: '编辑项目信息',
        resource: 'PROJECT',
        action: 'UPDATE',
        scope: 'PROJECT',
    },
    {
        code: 'PROJECT_DELETE',
        name: '删除项目',
        description: '删除项目',
        resource: 'PROJECT',
        action: 'DELETE',
        scope: 'PROJECT',
    },
    {
        code: 'PROJECT_MEMBER_MANAGE',
        name: '管理项目成员',
        description: '添加或移除项目成员',
        resource: 'PROJECT',
        action: 'MANAGE',
        scope: 'PROJECT',
    },
    // ===== 任务权限 =====
    {
        code: 'TASK_CREATE',
        name: '创建任务',
        description: '创建新任务',
        resource: 'TASK',
        action: 'CREATE',
        scope: 'PROJECT',
    },
    {
        code: 'TASK_READ',
        name: '查看任务',
        description: '查看任务详情',
        resource: 'TASK',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'TASK_UPDATE',
        name: '编辑任务',
        description: '编辑任务信息',
        resource: 'TASK',
        action: 'UPDATE',
        scope: 'PROJECT',
    },
    {
        code: 'TASK_DELETE',
        name: '删除任务',
        description: '删除任务',
        resource: 'TASK',
        action: 'DELETE',
        scope: 'PROJECT',
    },
    {
        code: 'TASK_ASSIGN',
        name: '分配任务',
        description: '分配任务给团队成员',
        resource: 'TASK',
        action: 'ASSIGN',
        scope: 'PROJECT',
    },
    // ===== 测试工作权限 =====
    {
        code: 'TESTWORK_CREATE',
        name: '创建测试工作',
        description: '创建新的测试工作项目',
        resource: 'TESTWORK',
        action: 'CREATE',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_READ',
        name: '查看测试工作',
        description: '查看测试工作详情',
        resource: 'TESTWORK',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_UPDATE',
        name: '编辑测试工作',
        description: '编辑测试工作信息',
        resource: 'TESTWORK',
        action: 'UPDATE',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_DELETE',
        name: '删除测试工作',
        description: '删除测试工作',
        resource: 'TESTWORK',
        action: 'DELETE',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_EXECUTE',
        name: '执行测试',
        description: '执行测试步骤',
        resource: 'TESTWORK',
        action: 'EXECUTE',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_MONITOR',
        name: '监控测试',
        description: '监控测试进度和数据',
        resource: 'TESTWORK',
        action: 'MONITOR',
        scope: 'PROJECT',
    },
    {
        code: 'TESTWORK_ANALYZE',
        name: '分析测试数据',
        description: '分析测试结果数据',
        resource: 'TESTWORK',
        action: 'ANALYZE',
        scope: 'PROJECT',
    },
    // ===== 工作流权限 =====
    {
        code: 'WORKFLOW_CREATE',
        name: '创建工作流',
        description: '创建新的工作流模板',
        resource: 'WORKFLOW',
        action: 'CREATE',
        scope: 'SYSTEM',
    },
    {
        code: 'WORKFLOW_APPROVE',
        name: '审批工作流',
        description: '审批工作流任务',
        resource: 'WORKFLOW',
        action: 'APPROVE',
        scope: 'PROJECT',
    },
    {
        code: 'WORKFLOW_DELEGATE',
        name: '委派工作流',
        description: '委派工作流任务',
        resource: 'WORKFLOW',
        action: 'ASSIGN',
        scope: 'PROJECT',
    },
    {
        code: 'WORKFLOW_MANAGE',
        name: '管理工作流',
        description: '管理工作流模板和实例',
        resource: 'WORKFLOW',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 文件权限 =====
    {
        code: 'FILE_UPLOAD',
        name: '上传文件',
        description: '上传文件到项目或任务',
        resource: 'FILE',
        action: 'CREATE',
        scope: 'PROJECT',
    },
    {
        code: 'FILE_DOWNLOAD',
        name: '下载文件',
        description: '下载项目或任务文件',
        resource: 'FILE',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'FILE_DELETE',
        name: '删除文件',
        description: '删除项目或任务文件',
        resource: 'FILE',
        action: 'DELETE',
        scope: 'PROJECT',
    },
    {
        code: 'FILE_SHARE',
        name: '分享文件',
        description: '分享文件给其他用户',
        resource: 'FILE',
        action: 'SHARE',
        scope: 'PROJECT',
    },
    // ===== 评论权限 =====
    {
        code: 'COMMENT_CREATE',
        name: '发表评论',
        description: '在项目或任务中发表评论',
        resource: 'COMMENT',
        action: 'CREATE',
        scope: 'PROJECT',
    },
    {
        code: 'COMMENT_READ',
        name: '查看评论',
        description: '查看项目或任务评论',
        resource: 'COMMENT',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'COMMENT_DELETE',
        name: '删除评论',
        description: '删除任何用户的评论',
        resource: 'COMMENT',
        action: 'DELETE',
        scope: 'PROJECT',
    },
    // ===== 聊天权限 =====
    {
        code: 'CHAT_PARTICIPATE',
        name: '参与聊天',
        description: '在聊天室中发送消息',
        resource: 'CHAT',
        action: 'CREATE',
        scope: 'PROJECT',
    },
    {
        code: 'CHAT_MANAGE',
        name: '管理聊天室',
        description: '创建、编辑、删除聊天室',
        resource: 'CHAT',
        action: 'MANAGE',
        scope: 'PROJECT',
    },
    // ===== 通知权限 =====
    {
        code: 'NOTIFICATION_SEND',
        name: '发送通知',
        description: '向用户发送通知',
        resource: 'NOTIFICATION',
        action: 'CREATE',
        scope: 'SYSTEM',
    },
    {
        code: 'NOTIFICATION_MANAGE',
        name: '管理通知',
        description: '管理自己的通知设置',
        resource: 'NOTIFICATION',
        action: 'MANAGE',
        scope: 'PERSONAL',
    },
    // ===== 报表权限 =====
    {
        code: 'REPORT_VIEW',
        name: '查看报表',
        description: '查看各类统计报表',
        resource: 'REPORT',
        action: 'READ',
        scope: 'PROJECT',
    },
    {
        code: 'REPORT_EXPORT',
        name: '导出报表',
        description: '导出报表数据',
        resource: 'REPORT',
        action: 'EXPORT',
        scope: 'PROJECT',
    },
    {
        code: 'REPORT_MANAGE',
        name: '管理报表',
        description: '创建和编辑报表模板',
        resource: 'REPORT',
        action: 'MANAGE',
        scope: 'SYSTEM',
    },
    // ===== 矿区管理权限 =====
    {
        code: 'MINE_ZONE_CREATE',
        name: '创建矿区',
        description: '创建新的矿区',
        resource: 'MINE_ZONE',
        action: 'CREATE',
        scope: 'SYSTEM',
    },
    {
        code: 'MINE_ZONE_READ',
        name: '查看矿区',
        description: '查看矿区信息',
        resource: 'MINE_ZONE',
        action: 'READ',
        scope: 'SYSTEM',
    },
    {
        code: 'MINE_ZONE_UPDATE',
        name: '编辑矿区',
        description: '编辑矿区信息',
        resource: 'MINE_ZONE',
        action: 'UPDATE',
        scope: 'SYSTEM',
    },
    {
        code: 'MINE_ZONE_DELETE',
        name: '删除矿区',
        description: '删除矿区',
        resource: 'MINE_ZONE',
        action: 'DELETE',
        scope: 'SYSTEM',
    },
];
async function main() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║         权限定义初始化 - Permission Seed          ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    try {
        console.log(`📝 准备创建 ${PERMISSION_DEFINITIONS.length} 个权限定义...\n`);
        let created = 0;
        let updated = 0;
        let skipped = 0;
        for (const perm of PERMISSION_DEFINITIONS) {
            try {
                const existing = await prisma.permission_definitions.findUnique({
                    where: { code: perm.code },
                });
                if (existing) {
                    // 更新现有权限
                    await prisma.permission_definitions.update({
                        where: { code: perm.code },
                        data: {
                            name: perm.name,
                            description: perm.description,
                            resource: perm.resource,
                            action: perm.action,
                            scope: perm.scope,
                        },
                    });
                    console.log(`   🔄 Updated: ${perm.code} - ${perm.name}`);
                    updated++;
                }
                else {
                    // 创建新权限
                    await prisma.permission_definitions.create({
                        data: perm,
                    });
                    console.log(`   ✅ Created: ${perm.code} - ${perm.name}`);
                    created++;
                }
            }
            catch (error) {
                console.error(`   ❌ Error processing ${perm.code}:`, error);
                skipped++;
            }
        }
        console.log('\n📊 统计结果:');
        console.log(`   • 新创建: ${created}`);
        console.log(`   • 已更新: ${updated}`);
        console.log(`   • 跳过/失败: ${skipped}`);
        console.log(`   • 总计: ${PERMISSION_DEFINITIONS.length}\n`);
        // 验证数据库中的权限数量
        const totalInDb = await prisma.permission_definitions.count();
        console.log(`✅ 数据库中共有 ${totalInDb} 个权限定义\n`);
        console.log('╔════════════════════════════════════════════════════╗');
        console.log('║                ✅ 初始化完成                       ║');
        console.log('╚════════════════════════════════════════════════════╝\n');
    }
    catch (error) {
        console.error('\n❌ 初始化失败:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
// 执行
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=seedPermissions.js.map