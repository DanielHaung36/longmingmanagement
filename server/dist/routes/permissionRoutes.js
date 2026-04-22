"use strict";
/**
 * 权限管理路由 - Permission Management Routes
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const permissionService_1 = require("../services/permissionService");
const cookieAuth_1 = require("../middleware/cookieAuth");
const permissionMiddleware_1 = require("../middleware/permissionMiddleware");
const client_1 = require("@prisma/client");
const ApiError_1 = require("../utils/ApiError");
const router = express_1.default.Router();
/**
 * GET /permissions/me
 * 获取当前用户的所有权限
 */
router.get('/me', cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            throw new ApiError_1.ApiError(401, 'Unauthorized');
        }
        const permissions = await (0, permissionService_1.getUserPermissions)(userId);
        const response = {
            success: true,
            data: permissions,
            message: 'User permissions retrieved successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /permissions/user/:userId
 * 获取指定用户的所有权限（需要管理员权限）
 */
router.get('/user/:userId', cookieAuth_1.cookieAuth, (0, permissionMiddleware_1.requirePermission)('USER_MANAGE'), async (req, res) => {
    try {
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw new ApiError_1.ApiError(400, 'Invalid user ID');
        }
        const permissions = await (0, permissionService_1.getUserPermissions)(userId);
        const response = {
            success: true,
            data: permissions,
            message: 'User permissions retrieved successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /permissions/role/:role
 * 获取角色的默认权限
 */
router.get('/role/:role', cookieAuth_1.cookieAuth, async (req, res) => {
    try {
        const role = req.params.role.toUpperCase();
        if (!Object.values(client_1.UserRole).includes(role)) {
            throw new ApiError_1.ApiError(400, `Invalid role: ${role}`);
        }
        const permissions = (0, permissionService_1.getRolePermissions)(role);
        const response = {
            success: true,
            data: permissions,
            message: 'Role permissions retrieved successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * GET /permissions/all
 * 获取所有可用权限
 */
router.get('/all', cookieAuth_1.cookieAuth, (0, permissionMiddleware_1.requirePermission)('ROLE_MANAGE'), async (req, res) => {
    try {
        const permissions = (0, permissionService_1.getAllPermissions)();
        const response = {
            success: true,
            data: permissions,
            message: 'All permissions retrieved successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * POST /permissions/grant
 * 授予用户权限（需要角色管理权限）
 */
router.post('/grant', cookieAuth_1.cookieAuth, (0, permissionMiddleware_1.requirePermission)('ROLE_MANAGE'), async (req, res) => {
    try {
        const assignedBy = req.user?.id;
        if (!assignedBy) {
            throw new ApiError_1.ApiError(401, 'Unauthorized');
        }
        const { userId, permissionCode, scope, resourceType, resourceId, expiresAt, reason, } = req.body;
        if (!userId || !permissionCode || !scope) {
            throw new ApiError_1.ApiError(400, 'Missing required fields: userId, permissionCode, scope');
        }
        await (0, permissionService_1.grantUserPermission)(userId, permissionCode, scope, assignedBy, resourceType, resourceId, expiresAt ? new Date(expiresAt) : undefined, reason);
        const response = {
            success: true,
            data: null,
            message: 'Permission granted successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * POST /permissions/revoke
 * 撤销用户权限（需要角色管理权限）
 */
router.post('/revoke', cookieAuth_1.cookieAuth, (0, permissionMiddleware_1.requirePermission)('ROLE_MANAGE'), async (req, res) => {
    try {
        const { userId, permissionCode, scope, resourceType, resourceId } = req.body;
        if (!userId || !permissionCode || !scope) {
            throw new ApiError_1.ApiError(400, 'Missing required fields: userId, permissionCode, scope');
        }
        await (0, permissionService_1.revokeUserPermission)(userId, permissionCode, scope, resourceType, resourceId);
        const response = {
            success: true,
            data: null,
            message: 'Permission revoked successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
/**
 * PUT /permissions/user/:userId/role
 * 更新用户角色（需要角色管理权限）
 */
router.put('/user/:userId/role', cookieAuth_1.cookieAuth, (0, permissionMiddleware_1.requirePermission)('ROLE_MANAGE'), async (req, res) => {
    try {
        const updatedBy = req.user?.id;
        if (!updatedBy) {
            throw new ApiError_1.ApiError(401, 'Unauthorized');
        }
        const userId = parseInt(req.params.userId, 10);
        if (isNaN(userId)) {
            throw new ApiError_1.ApiError(400, 'Invalid user ID');
        }
        const { role } = req.body;
        if (!role || !Object.values(client_1.UserRole).includes(role)) {
            throw new ApiError_1.ApiError(400, 'Invalid role');
        }
        await (0, permissionService_1.updateUserRole)(userId, role, updatedBy);
        const response = {
            success: true,
            data: null,
            message: 'User role updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        const err = error;
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=permissionRoutes.js.map