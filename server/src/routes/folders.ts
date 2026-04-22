import express from 'express';
import multer from "multer";
import {
  createLocalFolder,
  copyTemplate,
  checkFolderExists,
  getFolderSize,
  listFolderContents,
  deleteFolder,
  getFolderPaths
} from '../controllers/folderController';
import {
  getTaskFolderContents,
  getProjectFolderContents,
  browseFolderContents,
  downloadFile,
  uploadFileToFolder,
  requestFileDelete,
  approveFileDelete,
  createFolder,
  createShareLink,
} from "../controllers/folderPreviewController";
import { cookieAuth } from '../middleware/cookieAuth';

const router = express.Router();
router.use(cookieAuth);

// 配置multer用于文件上传
const upload = multer({
  dest: "uploads/temp/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

// 获取配置
router.get('/config', getFolderPaths);

// 文件夹操作（旧API）
router.post('/create-local', createLocalFolder);
router.post('/copy-template', copyTemplate);
router.get('/exists', checkFolderExists);
router.get('/size', getFolderSize);
router.get('/contents', listFolderContents);
router.delete('/delete', deleteFolder);

// 文件夹预览（新API）
router.get('/task/:taskId', getTaskFolderContents);
router.get('/project/:projectId', getProjectFolderContents);
router.get('/browse', browseFolderContents);
router.get('/download', downloadFile);
router.post('/upload', upload.single("file"), uploadFileToFolder);
router.post('/request-delete', requestFileDelete);
router.post('/approve-delete', approveFileDelete);
router.post('/create-folder', createFolder);
router.post('/share-link', createShareLink);

export default router;
