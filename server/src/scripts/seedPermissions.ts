#!/usr/bin/env ts-node

/**
 * 权限定义种子数据脚本
 * Seed Permission Definitions
 *
 * 功能：初始化 permission_definitions 表
 * 用法：npm run seed:permissions
 */

import { PrismaClient, Permission, ResourceType, ActionType, PermissionScope } from '@prisma/client';

const prisma = new PrismaClient();

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
    resource: 'SYSTEM' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 用户管理权限 =====
  {
    code: 'USER_MANAGE',
    name: '用户管理',
    description: '创建、编辑、删除用户',
    resource: 'USER' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 角色管理权限 =====
  {
    code: 'ROLE_MANAGE',
    name: '角色管理',
    description: '管理角色和权限分配',
    resource: 'SYSTEM' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 团队管理权限 =====
  {
    code: 'TEAM_MANAGE',
    name: '团队管理',
    description: '创建和管理团队',
    resource: 'TEAM' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 项目权限 =====
  {
    code: 'PROJECT_CREATE',
    name: '创建项目',
    description: '创建新项目',
    resource: 'PROJECT' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'PROJECT_READ',
    name: '查看项目',
    description: '查看项目信息',
    resource: 'PROJECT' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'PROJECT_UPDATE',
    name: '编辑项目',
    description: '编辑项目信息',
    resource: 'PROJECT' as ResourceType,
    action: 'UPDATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'PROJECT_DELETE',
    name: '删除项目',
    description: '删除项目',
    resource: 'PROJECT' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'PROJECT_MEMBER_MANAGE',
    name: '管理项目成员',
    description: '添加或移除项目成员',
    resource: 'PROJECT' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 任务权限 =====
  {
    code: 'TASK_CREATE',
    name: '创建任务',
    description: '创建新任务',
    resource: 'TASK' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TASK_READ',
    name: '查看任务',
    description: '查看任务详情',
    resource: 'TASK' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TASK_UPDATE',
    name: '编辑任务',
    description: '编辑任务信息',
    resource: 'TASK' as ResourceType,
    action: 'UPDATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TASK_DELETE',
    name: '删除任务',
    description: '删除任务',
    resource: 'TASK' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TASK_ASSIGN',
    name: '分配任务',
    description: '分配任务给团队成员',
    resource: 'TASK' as ResourceType,
    action: 'ASSIGN' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 测试工作权限 =====
  {
    code: 'TESTWORK_CREATE',
    name: '创建测试工作',
    description: '创建新的测试工作项目',
    resource: 'TESTWORK' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_READ',
    name: '查看测试工作',
    description: '查看测试工作详情',
    resource: 'TESTWORK' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_UPDATE',
    name: '编辑测试工作',
    description: '编辑测试工作信息',
    resource: 'TESTWORK' as ResourceType,
    action: 'UPDATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_DELETE',
    name: '删除测试工作',
    description: '删除测试工作',
    resource: 'TESTWORK' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_EXECUTE',
    name: '执行测试',
    description: '执行测试步骤',
    resource: 'TESTWORK' as ResourceType,
    action: 'EXECUTE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_MONITOR',
    name: '监控测试',
    description: '监控测试进度和数据',
    resource: 'TESTWORK' as ResourceType,
    action: 'MONITOR' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'TESTWORK_ANALYZE',
    name: '分析测试数据',
    description: '分析测试结果数据',
    resource: 'TESTWORK' as ResourceType,
    action: 'ANALYZE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 工作流权限 =====
  {
    code: 'WORKFLOW_CREATE',
    name: '创建工作流',
    description: '创建新的工作流模板',
    resource: 'WORKFLOW' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'WORKFLOW_APPROVE',
    name: '审批工作流',
    description: '审批工作流任务',
    resource: 'WORKFLOW' as ResourceType,
    action: 'APPROVE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'WORKFLOW_DELEGATE',
    name: '委派工作流',
    description: '委派工作流任务',
    resource: 'WORKFLOW' as ResourceType,
    action: 'ASSIGN' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'WORKFLOW_MANAGE',
    name: '管理工作流',
    description: '管理工作流模板和实例',
    resource: 'WORKFLOW' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 文件权限 =====
  {
    code: 'FILE_UPLOAD',
    name: '上传文件',
    description: '上传文件到项目或任务',
    resource: 'FILE' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'FILE_DOWNLOAD',
    name: '下载文件',
    description: '下载项目或任务文件',
    resource: 'FILE' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'FILE_DELETE',
    name: '删除文件',
    description: '删除项目或任务文件',
    resource: 'FILE' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'FILE_SHARE',
    name: '分享文件',
    description: '分享文件给其他用户',
    resource: 'FILE' as ResourceType,
    action: 'SHARE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 评论权限 =====
  {
    code: 'COMMENT_CREATE',
    name: '发表评论',
    description: '在项目或任务中发表评论',
    resource: 'COMMENT' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'COMMENT_READ',
    name: '查看评论',
    description: '查看项目或任务评论',
    resource: 'COMMENT' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'COMMENT_DELETE',
    name: '删除评论',
    description: '删除任何用户的评论',
    resource: 'COMMENT' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 聊天权限 =====
  {
    code: 'CHAT_PARTICIPATE',
    name: '参与聊天',
    description: '在聊天室中发送消息',
    resource: 'CHAT' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'CHAT_MANAGE',
    name: '管理聊天室',
    description: '创建、编辑、删除聊天室',
    resource: 'CHAT' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },

  // ===== 通知权限 =====
  {
    code: 'NOTIFICATION_SEND',
    name: '发送通知',
    description: '向用户发送通知',
    resource: 'NOTIFICATION' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'NOTIFICATION_MANAGE',
    name: '管理通知',
    description: '管理自己的通知设置',
    resource: 'NOTIFICATION' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'PERSONAL' as PermissionScope,
  },

  // ===== 报表权限 =====
  {
    code: 'REPORT_VIEW',
    name: '查看报表',
    description: '查看各类统计报表',
    resource: 'REPORT' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'REPORT_EXPORT',
    name: '导出报表',
    description: '导出报表数据',
    resource: 'REPORT' as ResourceType,
    action: 'EXPORT' as ActionType,
    scope: 'PROJECT' as PermissionScope,
  },
  {
    code: 'REPORT_MANAGE',
    name: '管理报表',
    description: '创建和编辑报表模板',
    resource: 'REPORT' as ResourceType,
    action: 'MANAGE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },

  // ===== 矿区管理权限 =====
  {
    code: 'MINE_ZONE_CREATE',
    name: '创建矿区',
    description: '创建新的矿区',
    resource: 'MINE_ZONE' as ResourceType,
    action: 'CREATE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'MINE_ZONE_READ',
    name: '查看矿区',
    description: '查看矿区信息',
    resource: 'MINE_ZONE' as ResourceType,
    action: 'READ' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'MINE_ZONE_UPDATE',
    name: '编辑矿区',
    description: '编辑矿区信息',
    resource: 'MINE_ZONE' as ResourceType,
    action: 'UPDATE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
  },
  {
    code: 'MINE_ZONE_DELETE',
    name: '删除矿区',
    description: '删除矿区',
    resource: 'MINE_ZONE' as ResourceType,
    action: 'DELETE' as ActionType,
    scope: 'SYSTEM' as PermissionScope,
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
        } else {
          // 创建新权限
          await prisma.permission_definitions.create({
            data: perm,
          });
          console.log(`   ✅ Created: ${perm.code} - ${perm.name}`);
          created++;
        }
      } catch (error) {
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
  } catch (error) {
    console.error('\n❌ 初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 执行
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
