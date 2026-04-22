'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileEdit } from 'lucide-react';

interface FileInfo {
  id: number;
  fileName: string;
  fileType?: string;
}

interface RenameFileDialogProps {
  open: boolean;
  file: FileInfo | null;
  onOpenChange: (open: boolean) => void;
  onRename: (fileId: number, newName: string) => Promise<void>;
}

export function RenameFileDialog({
  open,
  file,
  onOpenChange,
  onRename,
}: RenameFileDialogProps) {
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 当对话框打开或文件变化时，初始化文件名
  useEffect(() => {
    if (file && open) {
      // 移除扩展名，只显示文件名
      const nameWithoutExt = file.fileName.replace(/\.[^/.]+$/, '');
      setNewName(nameWithoutExt);
      setError(null);
    }
  }, [file, open]);

  // 获取文件扩展名
  const getFileExtension = (fileName: string) => {
    const match = fileName.match(/\.[^/.]+$/);
    return match ? match[0] : '';
  };

  // 验证文件名
  const validateFileName = (name: string): string | null => {
    if (!name.trim()) {
      return '文件名不能为空';
    }

    // 检查非法字符（Windows 文件名）
    const illegalChars = /[<>:"/\\|?*]/g;
    if (illegalChars.test(name)) {
      return '文件名不能包含以下字符: < > : " / \\ | ? *';
    }

    // 检查文件名长度
    if (name.length > 255) {
      return '文件名不能超过 255 个字符';
    }

    return null;
  };

  const handleRename = async () => {
    if (!file) return;

    const validationError = validateFileName(newName);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 添加原始扩展名
    const extension = getFileExtension(file.fileName);
    const fullNewName = newName.trim() + extension;

    // 如果文件名没有变化，直接关闭
    if (fullNewName === file.fileName) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onRename(file.id, fullNewName);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || '重命名失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRename();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileEdit className="h-5 w-5 text-blue-600" />
            <DialogTitle>重命名文件</DialogTitle>
          </div>
          <DialogDescription>
            请输入新的文件名（扩展名将自动保留）
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 原文件名显示 */}
          <div className="grid gap-2">
            <Label className="text-gray-600">原文件名</Label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700 border">
              {file?.fileName}
            </div>
          </div>

          {/* 新文件名输入 */}
          <div className="grid gap-2">
            <Label htmlFor="new-name">
              新文件名 <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => {
                  setNewName(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入新文件名"
                disabled={isLoading}
                autoFocus
                className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">
                {file && getFileExtension(file.fileName)}
              </span>
            </div>

            {/* 错误提示 */}
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span className="font-semibold">⚠</span>
                {error}
              </p>
            )}

            {/* 提示信息 */}
            <p className="text-xs text-gray-500">
              提示：文件扩展名将自动保留，无需手动输入
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            onClick={handleRename}
            disabled={isLoading || !newName.trim()}
          >
            {isLoading ? '重命名中...' : '确认重命名'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
