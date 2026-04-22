'use client';

import React, { useState } from 'react';
import { PDFViewer } from './PDFViewer';
import { FileContextMenu } from './FileContextMenu';
import { RenameFileDialog } from '../Dialog/RenameFileDialog';
import { FileOverwriteDialog } from '../Dialog/FileOverwriteDialog';
import { Button } from '@/components/ui/button';
import { handleApiError, showSuccessToast } from '@/lib/apiErrorHandler';
import {
  File,
  FileText,
  Image,
  Video,
  Archive,
  FileCode,
  Upload,
  Grid,
  List,
} from 'lucide-react';

interface TaskFile {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType: string;
  localPath: string;
  oneDrivePath?: string;
  uploadedBy: number;
  createdAt: Date | string;
  uploadedByUser?: {
    username: string;
    realName?: string;
  };
}

interface FileManagerProps {
  taskId: number;
  files: TaskFile[];
  onFileUpload: (file: File) => Promise<void>;
  onFileRename: (fileId: number, newName: string) => Promise<void>;
  onFileDelete: (fileId: number) => Promise<void>;
  onFileDownload: (fileId: number) => Promise<void>;
}

type ViewMode = 'grid' | 'list';

export function FileManager({
  taskId,
  files,
  onFileUpload,
  onFileRename,
  onFileDelete,
  onFileDownload,
}: FileManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedFile, setSelectedFile] = useState<TaskFile | null>(null);
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null);

  // 重命名对话框状态
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState<TaskFile | null>(null);

  // 文件覆盖对话框状态
  const [overwriteDialogOpen, setOverwriteDialogOpen] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<{
    file: File;
    existingFile: TaskFile;
  } | null>(null);

  // 获取文件图标
  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <Video className="h-8 w-8 text-purple-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return <Archive className="h-8 w-8 text-yellow-500" />;
    } else if (mimeType.includes('code') || fileName.match(/\.(js|ts|py|java|cpp)$/)) {
      return <FileCode className="h-8 w-8 text-green-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // 处理文件上传
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查是否有同名文件
    const existingFile = files.find(f => f.fileName === file.name);
    if (existingFile) {
      // 显示覆盖确认对话框
      setPendingUpload({ file, existingFile });
      setOverwriteDialogOpen(true);
    } else {
      // 直接上传
      try {
        await onFileUpload(file);
        showSuccessToast('上传成功', `文件 "${file.name}" 已成功上传`);
      } catch (error) {
        handleApiError(error);
      }
    }

    // 重置 input
    event.target.value = '';
  };

  // 确认覆盖上传
  const handleConfirmOverwrite = async () => {
    if (!pendingUpload) return;

    try {
      // 先删除旧文件
      await onFileDelete(pendingUpload.existingFile.id);
      // 上传新文件
      await onFileUpload(pendingUpload.file);
      showSuccessToast('文件已覆盖', `文件 "${pendingUpload.file.name}" 已成功覆盖`);
    } catch (error) {
      handleApiError(error);
    } finally {
      setOverwriteDialogOpen(false);
      setPendingUpload(null);
    }
  };

  // 处理重命名
  const handleRenameFile = async (fileId: number, newName: string) => {
    try {
      await onFileRename(fileId, newName);
      showSuccessToast('重命名成功', `文件已重命名为 "${newName}"`);
    } catch (error) {
      handleApiError(error);
      throw error;
    }
  };

  // 处理下载
  const handleDownloadFile = async (file: TaskFile) => {
    try {
      await onFileDownload(file.id);
      showSuccessToast('下载开始', `正在下载 "${file.fileName}"`);
    } catch (error) {
      handleApiError(error);
    }
  };

  // 处理删除
  const handleDeleteFile = async (file: TaskFile) => {
    if (confirm(`确定要删除文件 "${file.fileName}" 吗？`)) {
      try {
        await onFileDelete(file.id);
        showSuccessToast('删除成功', `文件 "${file.fileName}" 已删除`);
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  // 复制路径
  const handleCopyPath = (file: TaskFile) => {
    const path = file.oneDrivePath || file.localPath;
    navigator.clipboard.writeText(path);
    showSuccessToast('已复制', '文件路径已复制到剪贴板');
  };

  // 打开 PDF 预览
  const handlePreviewPDF = (file: TaskFile) => {
    if (file.mimeType === 'application/pdf') {
      setPreviewFile(file);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">文件管理 ({files.length})</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* 视图切换 */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* 上传按钮 */}
          <label className="cursor-pointer">
            <Button asChild>
              <span>
                <Upload className="mr-2 h-4 w-4" />
                上传文件
              </span>
            </Button>
            <input
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-auto p-4">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <File className="h-16 w-16 mb-4" />
            <p>暂无文件</p>
            <p className="text-sm">点击"上传文件"按钮添加文件</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <FileContextMenu
                key={file.id}
                file={file}
                onRename={() => {
                  setFileToRename(file);
                  setRenameDialogOpen(true);
                }}
                onDownload={() => handleDownloadFile(file)}
                onDelete={() => handleDeleteFile(file)}
                onCopy={() => handleCopyPath(file)}
              >
                <div
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handlePreviewPDF(file)}
                >
                  {getFileIcon(file.mimeType, file.fileName)}
                  <p className="mt-2 text-sm text-center line-clamp-2 w-full" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
              </FileContextMenu>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <FileContextMenu
                key={file.id}
                file={file}
                onRename={() => {
                  setFileToRename(file);
                  setRenameDialogOpen(true);
                }}
                onDownload={() => handleDownloadFile(file)}
                onDelete={() => handleDeleteFile(file)}
                onCopy={() => handleCopyPath(file)}
              >
                <div
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handlePreviewPDF(file)}
                >
                  {getFileIcon(file.mimeType, file.fileName)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.fileSize)} · {file.uploadedByUser?.realName || file.uploadedByUser?.username}
                    </p>
                  </div>
                </div>
              </FileContextMenu>
            ))}
          </div>
        )}
      </div>

      {/* PDF 预览对话框 */}
      {previewFile && previewFile.mimeType === 'application/pdf' && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
              <h3 className="text-white font-medium">{previewFile.fileName}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewFile(null)}
                className="text-white hover:bg-gray-800"
              >
                关闭
              </Button>
            </div>
            <div className="flex-1">
              <PDFViewer
                fileUrl={`/api/files/${previewFile.id}/download`}
                fileName={previewFile.fileName}
              />
            </div>
          </div>
        </div>
      )}

      {/* 重命名对话框 */}
      <RenameFileDialog
        open={renameDialogOpen}
        file={fileToRename}
        onOpenChange={setRenameDialogOpen}
        onRename={handleRenameFile}
      />

      {/* 文件覆盖确认对话框 */}
      <FileOverwriteDialog
        open={overwriteDialogOpen}
        existingFile={pendingUpload?.existingFile ? {
          fileName: pendingUpload.existingFile.fileName,
          fileSize: pendingUpload.existingFile.fileSize,
          uploadedAt: pendingUpload.existingFile.createdAt,
          uploadedBy: pendingUpload.existingFile.uploadedByUser?.realName || pendingUpload.existingFile.uploadedByUser?.username,
        } : null}
        newFile={pendingUpload?.file ? {
          name: pendingUpload.file.name,
          size: pendingUpload.file.size,
        } : undefined}
        onOpenChange={setOverwriteDialogOpen}
        onConfirm={handleConfirmOverwrite}
        onCancel={() => {
          setOverwriteDialogOpen(false);
          setPendingUpload(null);
        }}
      />
    </div>
  );
}
