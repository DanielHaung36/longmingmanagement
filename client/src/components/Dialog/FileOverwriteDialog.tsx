'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, File, Calendar, HardDrive } from 'lucide-react';

interface FileInfo {
  fileName: string;
  fileSize?: number;
  uploadedAt?: Date | string;
  uploadedBy?: string;
}

interface FileOverwriteDialogProps {
  open: boolean;
  existingFile: FileInfo | null;
  newFile?: {
    name: string;
    size?: number;
  };
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

// 格式化文件大小
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 格式化日期
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FileOverwriteDialog({
  open,
  existingFile,
  newFile,
  onOpenChange,
  onConfirm,
  onCancel,
}: FileOverwriteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[600px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle className="text-amber-600">
              文件已存在，是否覆盖？
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            系统检测到已存在同名文件。如果继续操作，原文件将被新文件替换，此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {existingFile && (
          <div className="grid gap-4 py-4">
            {/* 现有文件信息 */}
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <File className="h-5 w-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-red-900 mb-2">
                    现有文件（将被覆盖）
                  </h4>
                  <div className="space-y-1 text-sm text-red-800">
                    <div className="flex items-center gap-2">
                      <File className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="font-medium truncate" title={existingFile.fileName}>
                        {existingFile.fileName}
                      </span>
                    </div>
                    {existingFile.fileSize !== undefined && (
                      <div className="flex items-center gap-2 text-red-700">
                        <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{formatFileSize(existingFile.fileSize)}</span>
                      </div>
                    )}
                    {existingFile.uploadedAt && (
                      <div className="flex items-center gap-2 text-red-700">
                        <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {formatDate(existingFile.uploadedAt)}
                          {existingFile.uploadedBy && ` · ${existingFile.uploadedBy}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 新文件信息 */}
            {newFile && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <File className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-green-900 mb-2">
                      新文件（准备上传）
                    </h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <File className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="font-medium truncate" title={newFile.name}>
                          {newFile.name}
                        </span>
                      </div>
                      {newFile.size !== undefined && (
                        <div className="flex items-center gap-2 text-green-700">
                          <HardDrive className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{formatFileSize(newFile.size)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 警告提示 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">⚠️ 警告：</span>
                覆盖操作将永久删除原文件，无法恢复。请确认您要继续此操作。
              </p>
            </div>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            取消上传
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            确认覆盖
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
