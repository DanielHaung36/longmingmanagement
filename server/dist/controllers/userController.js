"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOneDrivePath = exports.saveOneDrivePath = exports.updateUserStatus = exports.searchUsers = exports.getUserStats = exports.bulkCreateUsers = exports.hardDeleteUser = exports.deleteUser = exports.updateUser = exports.getUserByEmail = exports.getUserByUsername = exports.getUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const userService_1 = require("../services/userService");
/**
 * 创建用户
 */
const createUser = async (req, res) => {
    try {
        const userData = req.body;
        const user = await userService_1.UserService.createUser(userData);
        res.status(201).json({
            success: true,
            message: '用户创建成功',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.createUser = createUser;
/**
 * 获取所有用户（带分页）
 */
const getUsers = async (req, res) => {
    try {
        const { page, limit, pageSize, status, departmentId, teamId, search } = req.query;
        const result = await userService_1.UserService.getAllUsers({
            page: page ? parseInt(page) : undefined,
            limit: limit ? parseInt(limit) : pageSize ? parseInt(pageSize) : undefined,
            status: status,
            departmentId: departmentId ? parseInt(departmentId) : undefined,
            teamId: teamId ? parseInt(teamId) : undefined,
            search: search
        });
        res.json({
            success: true,
            message: '获取用户列表成功',
            data: {
                data: result.users,
                pagination: result.pagination
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUsers = getUsers;
/**
 * 根据ID获取用户
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService_1.UserService.getUserById(parseInt(id));
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(404).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserById = getUserById;
/**
 * 根据Cognito ID获取用户（兼容旧接口）
 */
const getUser = async (req, res) => {
    try {
        const { cognitoId } = req.params;
        const user = await userService_1.UserService.getUserByUsername(cognitoId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUser = getUser;
/**
 * 根据用户名获取用户
 */
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await userService_1.UserService.getUserByUsername(username);
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserByUsername = getUserByUsername;
/**
 * 根据邮箱获取用户
 */
const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const user = await userService_1.UserService.getUserByEmail(email);
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户不存在'
            });
            return;
        }
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserByEmail = getUserByEmail;
/**
 * 更新用户
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const user = await userService_1.UserService.updateUser(parseInt(id), updateData);
        res.json({
            success: true,
            message: '用户更新成功',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateUser = updateUser;
/**
 * 删除用户（软删除）
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userService_1.UserService.deleteUser(parseInt(id));
        res.json({
            success: true,
            message: '用户已删除',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteUser = deleteUser;
/**
 * 硬删除用户
 */
const hardDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await userService_1.UserService.hardDeleteUser(parseInt(id));
        res.json({
            success: true,
            message: result.message
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.hardDeleteUser = hardDeleteUser;
/**
 * 批量创建用户
 */
const bulkCreateUsers = async (req, res) => {
    try {
        const { users } = req.body;
        if (!Array.isArray(users)) {
            res.status(400).json({
                success: false,
                message: '请提供用户数组'
            });
            return;
        }
        const result = await userService_1.UserService.bulkCreateUsers(users);
        res.status(201).json({
            success: true,
            message: `成功创建 ${result.count} 个用户`,
            data: result
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.bulkCreateUsers = bulkCreateUsers;
/**
 * 获取用户统计
 */
const getUserStats = async (req, res) => {
    try {
        const stats = await userService_1.UserService.getUserStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getUserStats = getUserStats;
/**
 * 搜索用户（用于@功能）
 * GET /api/users/search
 */
const searchUsers = async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        if (!q || q.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: '搜索关键词不能为空'
            });
            return;
        }
        const result = await userService_1.UserService.getAllUsers({
            search: q,
            limit: parseInt(limit),
            page: 1,
            status: 'ACTIVE' // 只搜索活跃用户
        });
        res.json({
            success: true,
            data: result.users.map(user => ({
                id: user.id,
                username: user.username,
                realName: user.realName,
                email: user.email,
                profilePictureUrl: user.profilePictureUrl
            }))
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.searchUsers = searchUsers;
/**
 * 更新用户状态
 * PATCH /api/users/:id/status
 */
const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            res.status(400).json({
                success: false,
                message: '无效的状态值，必须为 ACTIVE, INACTIVE 或 SUSPENDED'
            });
            return;
        }
        const user = await userService_1.UserService.updateUser(parseInt(id), { status });
        res.json({
            success: true,
            message: '用户状态更新成功',
            data: user
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.updateUserStatus = updateUserStatus;
/**
 * 保存用户的 OneDrive 本地路径配置
 */
const saveOneDrivePath = async (req, res) => {
    try {
        const userId = parseInt(req.body.userId || req.user?.id);
        const { oneDriveLocalPath } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: '用户 ID 缺失'
            });
            return;
        }
        if (!oneDriveLocalPath || typeof oneDriveLocalPath !== 'string') {
            res.status(400).json({
                success: false,
                message: 'OneDrive 路径无效'
            });
            return;
        }
        const user = await userService_1.UserService.updateUser(userId, { oneDriveLocalPath });
        res.json({
            success: true,
            message: 'OneDrive 路径保存成功',
            data: {
                oneDriveLocalPath: user.oneDriveLocalPath
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.saveOneDrivePath = saveOneDrivePath;
/**
 * 获取用户的 OneDrive 本地路径配置
 */
const getOneDrivePath = async (req, res) => {
    try {
        const userIdValue = req.params.userId || req.user?.id;
        const userId = typeof userIdValue === 'number' ? userIdValue : parseInt(userIdValue || '0');
        if (!userId) {
            res.status(400).json({
                success: false,
                message: '用户 ID 缺失'
            });
            return;
        }
        const user = await userService_1.UserService.getUserById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: '用户未找到'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                oneDriveLocalPath: user.oneDriveLocalPath || ''
            }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getOneDrivePath = getOneDrivePath;
//# sourceMappingURL=userController.js.map