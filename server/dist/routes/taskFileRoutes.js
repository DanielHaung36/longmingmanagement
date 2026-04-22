"use strict";
/**
 * Task文件路由
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskFileController_1 = require("../controllers/taskFileController");
const multer_1 = __importDefault(require("multer"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const router = (0, express_1.Router)();
// 配置multer存储
const storage = multer_1.default.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
        await fs.ensureDir(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
});
// ==================== Task 文件上传专用路由 ====================
// 说明：只处理文件上传和移动操作
// 文件查询、下载、删除等操作请使用 /api/files 路由
// 上传文件到Task（需要multer中间件）
router.post('/tasks/:taskId/files', upload.single('file'), taskFileController_1.TaskFileController.uploadFile);
// 移动文件到其他子文件夹（Task专用功能）
router.put('/files/:fileId/move', taskFileController_1.TaskFileController.moveFile);
// 重命名文件（仅文件名，不含文件夹路径）
router.put('/files/:fileId/rename', taskFileController_1.TaskFileController.renameFile);
// 获取文件的 OneDrive 路径
router.get('/files/:fileId/onedrive-path', taskFileController_1.TaskFileController.getOneDrivePath);
// 以下路由已整合到 fileRoutes.ts，避免重复定义
// GET /api/tasks/:taskId/files -> 使用 /api/files/task/:taskId
// GET /api/files/:fileId -> 使用 /api/files/:fileId
// GET /api/files/:fileId/download -> 使用 /api/files/:fileId/download
// DELETE /api/files/:fileId -> 使用 /api/files/:fileId
exports.default = router;
//# sourceMappingURL=taskFileRoutes.js.map