'use client';

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  FileEdit,
  Download,
  Trash2,
  Copy,
  Info,
  FolderOpen,
} from 'lucide-react';

interface FileInfo {
  id: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  localPath?: string;
  oneDrivePath?: string;
}

interface FileContextMenuProps {
  file: FileInfo;
  children: React.ReactNode;
  onRename?: (file: FileInfo) => void;
  onDownload?: (file: FileInfo) => void;
  onDelete?: (file: FileInfo) => void;
  onCopy?: (file: FileInfo) => void;
  onViewInfo?: (file: FileInfo) => void;
  onOpenFolder?: (file: FileInfo) => void;
}

export function FileContextMenu({
  file,
  children,
  onRename,
  onDownload,
  onDelete,
  onCopy,
  onViewInfo,
  onOpenFolder,
}: FileContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-56">
        {onRename && (
          <ContextMenuItem
            onClick={() => onRename(file)}
            className="cursor-pointer"
          >
            <FileEdit className="mr-2 h-4 w-4" />
            <span>重命名</span>
          </ContextMenuItem>
        )}

        {onDownload && (
          <ContextMenuItem
            onClick={() => onDownload(file)}
            className="cursor-pointer"
          >
            <Download className="mr-2 h-4 w-4" />
            <span>下载</span>
          </ContextMenuItem>
        )}

        {onCopy && (
          <ContextMenuItem
            onClick={() => onCopy(file)}
            className="cursor-pointer"
          >
            <Copy className="mr-2 h-4 w-4" />
            <span>复制路径</span>
          </ContextMenuItem>
        )}

        {onOpenFolder && (
          <ContextMenuItem
            onClick={() => onOpenFolder(file)}
            className="cursor-pointer"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            <span>打开文件位置</span>
          </ContextMenuItem>
        )}

        {onViewInfo && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onViewInfo(file)}
              className="cursor-pointer"
            >
              <Info className="mr-2 h-4 w-4" />
              <span>文件信息</span>
            </ContextMenuItem>
          </>
        )}

        {onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(file)}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>删除</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
