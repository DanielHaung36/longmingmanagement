"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const folderController_1 = require("../controllers/folderController");
const folderPreviewController_1 = require("../controllers/folderPreviewController");
const cookieAuth_1 = require("../middleware/cookieAuth");
const router = express_1.default.Router();
router.use(cookieAuth_1.cookieAuth);
// 配置multer用于文件上传
const upload = (0, multer_1.default)({
    dest: "uploads/temp/",
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
    },
});
// 获取配置
router.get('/config', folderController_1.getFolderPaths);
// 文件夹操作（旧API）
router.post('/create-local', folderController_1.createLocalFolder);
router.post('/copy-template', folderController_1.copyTemplate);
router.get('/exists', folderController_1.checkFolderExists);
router.get('/size', folderController_1.getFolderSize);
router.get('/contents', folderController_1.listFolderContents);
router.delete('/delete', folderController_1.deleteFolder);
// 文件夹预览（新API）
router.get('/task/:taskId', folderPreviewController_1.getTaskFolderContents);
router.get('/project/:projectId', folderPreviewController_1.getProjectFolderContents);
router.get('/browse', folderPreviewController_1.browseFolderContents);
router.get('/download', folderPreviewController_1.downloadFile);
router.post('/upload', upload.single("file"), folderPreviewController_1.uploadFileToFolder);
router.post('/request-delete', folderPreviewController_1.requestFileDelete);
router.post('/approve-delete', folderPreviewController_1.approveFileDelete);
router.post('/create-folder', folderPreviewController_1.createFolder);
router.post('/share-link', folderPreviewController_1.createShareLink);
exports.default = router;
//# sourceMappingURL=folders.js.map