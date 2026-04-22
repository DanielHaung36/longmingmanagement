'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Download,
  Maximize2
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  fileName?: string;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function PDFViewer({ fileUrl, fileName, onContextMenu }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('PDF 加载失败:', error);
    setLoading(false);
  }

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName || 'document.pdf';
    link.click();
  };

  const fullscreen = () => {
    const element = document.getElementById('pdf-container');
    if (element) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50" onContextMenu={onContextMenu}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {fileName || 'PDF 文档'}
          </span>
          {numPages > 0 && (
            <span className="text-xs text-gray-500">
              ({numPages} 页)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 翻页控制 */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 缩放控制 */}
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="h-7 w-7 p-0"
              title="缩小"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="h-7 w-7 p-0"
              title="放大"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          {/* 其他工具 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={rotate}
            className="h-8 w-8 p-0"
            title="旋转"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fullscreen}
            className="h-8 w-8 p-0"
            title="全屏"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={downloadPDF}
            className="h-8 w-8 p-0"
            title="下载"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF 内容区域 */}
      <div
        id="pdf-container"
        className="flex-1 overflow-auto flex items-start justify-center p-4 bg-gray-100"
      >
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">加载 PDF 中...</p>
            </div>
          </div>
        )}

        <div className="bg-white shadow-lg">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}
