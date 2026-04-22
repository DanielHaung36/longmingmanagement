import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 缓存开发模式用户，避免每次请求都查询数据库
let cachedAdminUser: any = null;
let cachedDevUser: any = null;

/**
 * 获取开发模式管理员用户（从数据库查询）
 */
export async function getDevAdmin() {
  if (cachedAdminUser) return cachedAdminUser;

  try {
    // 查找 username='admin' 的用户
    cachedAdminUser = await prisma.users.findUnique({
      where: { username: 'admin' }
    });

    if (!cachedAdminUser) {
      console.error('❌ 未找到 username=admin 的用户！请运行: npm run create-dev-user');
      throw new Error('开发模式管理员用户不存在');
    }

    console.log('✅ 加载开发模式管理员:', cachedAdminUser.username, 'ID:', cachedAdminUser.id);
    return cachedAdminUser;
  } catch (error) {
    console.error('❌ 获取开发用户失败:', error);
    throw error;
  }
}

/**
 * 获取开发模式普通用户（从数据库查询）
 */
export async function getDevDeveloper() {
  if (cachedDevUser) return cachedDevUser;

  try {
    cachedDevUser = await prisma.users.findUnique({
      where: { username: 'developer' }
    });

    if (!cachedDevUser) {
      console.error('❌ 未找到 username=developer 的用户！');
      // 回退到管理员用户
      return getDevAdmin();
    }

    return cachedDevUser;
  } catch (error) {
    console.error('❌ 获取开发用户失败:', error);
    return getDevAdmin(); // 回退到管理员
  }
}

// 向后兼容：导出同步版本（但不推荐使用）
// 这些只是占位符，实际使用时应该调用异步版本
export const DevAdmin = {
  id: 0, // 占位符，实际ID从数据库获取
  username: "admin",
  email: "admin@longi.com",
  realName: "系统管理员",
}

export const DevUser = {
  id: 0, // 占位符
  username: "developer",
  email: "dev@longi.com",
  realName: "开发者",
}

// 开发模式用户映射
export const DevUsers = {
  'admin': DevAdmin,
  'developer': DevUser,
  'test': DevUser,
}

// 获取开发模式用户
export function getDevUser(username?: string) {
  if (!username) return DevAdmin
  const key = username.toLowerCase() as keyof typeof DevUsers
  return DevUsers[key] || DevUser
}

// 根据cookie获取用户
export function getUserFromCookie(cookie: string) {
  if (cookie === 'dev_admin_token') return DevAdmin
  return DevUser
}