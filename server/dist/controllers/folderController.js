"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFolderPaths = exports.deleteFolder = exports.listFolderContents = exports.getFolderSize = exports.checkFolderExists = exports.copyTemplate = exports.createLocalFolder = void 0;
const folderService_1 = require("../services/folderService");
/**
 * 创建本地项目文件夹
 */
const createLocalFolder = async (req, res) => {
    try {
        const { projectCode, clientName, mineSite } = req.body;
        if (!projectCode) {
            res.status(400).json({
                success: false,
                message: '项目编号不能为空'
            });
            return;
        }
        const folderPath = await folderService_1.FolderService.createLocalProjectFolder(projectCode, clientName, mineSite);
        res.status(201).json({
            success: true,
            message: '本地文件夹创建成功',
            data: { folderPath }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.createLocalFolder = createLocalFolder;
/**
 * 复制模板文件夹
 */
const copyTemplate = async (req, res) => {
    try {
        const { jobType, clientName, mineSite, projectCode, projectName } = req.body;
        if (!jobType || !projectCode) {
            res.status(400).json({
                success: false,
                message: 'jobType和projectCode不能为空'
            });
            return;
        }
        const { localPath, oneDrivePath } = await folderService_1.FolderService.copyTemplateFolder(jobType, clientName || 'Default', mineSite || 'Default', projectCode, projectName || 'Project');
        res.status(201).json({
            success: true,
            message: '模板文件夹复制成功',
            data: { localPath, oneDrivePath }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.copyTemplate = copyTemplate;
/**
 * 检查文件夹是否存在
 */
const checkFolderExists = async (req, res) => {
    try {
        const { folderPath } = req.query;
        if (!folderPath) {
            res.status(400).json({
                success: false,
                message: '文件夹路径不能为空'
            });
            return;
        }
        const exists = await folderService_1.FolderService.folderExists(folderPath);
        res.json({
            success: true,
            data: { exists }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.checkFolderExists = checkFolderExists;
/**
 * 获取文件夹大小
 */
const getFolderSize = async (req, res) => {
    try {
        const { folderPath } = req.query;
        if (!folderPath) {
            res.status(400).json({
                success: false,
                message: '文件夹路径不能为空'
            });
            return;
        }
        const size = await folderService_1.FolderService.getFolderSize(folderPath);
        res.json({
            success: true,
            data: { size, sizeInMB: (size / 1024 / 1024).toFixed(2) }
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getFolderSize = getFolderSize;
/**
 * 列出文件夹内容
 */
const listFolderContents = async (req, res) => {
    try {
        const { folderPath } = req.query;
        if (!folderPath) {
            res.status(400).json({
                success: false,
                message: '文件夹路径不能为空'
            });
            return;
        }
        const contents = await folderService_1.FolderService.listFolderContents(folderPath);
        res.json({
            success: true,
            data: contents
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.listFolderContents = listFolderContents;
/**
 * 删除项目文件夹
 */
const deleteFolder = async (req, res) => {
    try {
        const { folderPath } = req.body;
        if (!folderPath) {
            res.status(400).json({
                success: false,
                message: '文件夹路径不能为空'
            });
            return;
        }
        await folderService_1.FolderService.deleteProjectFolder(folderPath);
        res.json({
            success: true,
            message: '文件夹删除成功'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.deleteFolder = deleteFolder;
/**
 * 获取文件夹配置路径
 */
const getFolderPaths = async (req, res) => {
    try {
        const paths = folderService_1.FolderService.getPaths();
        res.json({
            success: true,
            data: paths
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
exports.getFolderPaths = getFolderPaths;
//# sourceMappingURL=folderController.js.map