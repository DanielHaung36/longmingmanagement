"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface FilePreviewDialogProps {
  open: boolean
  onClose: () => void
  file: {
    id: number
    fileName: string
    fileType: string
    fileSize: number
    localPath?: string
    oneDrivePath?: string
  } | null
  onDownload?: () => void
}

export function FilePreviewDialog({
  open,
  onClose,
  file,
  onDownload,
}: FilePreviewDialogProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)

  if (!file) return null

  const fileUrl = `/api/files/${file.id}/download`
  const isPDF = file.fileType.toLowerCase().includes('pdf')
  const isImage = file.fileType.toLowerCase().includes('image')
  const isVideo = file.fileType.toLowerCase().includes('video')
  const isAudio = file.fileType.toLowerCase().includes('audio')
  const isText = file.fileType.toLowerCase().includes('text')

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50))
  const handleRotate = () => setRotation(prev => (prev + 90) % 360)

  const renderPreview = () => {
    // PDF 预览
    if (isPDF) {
      return (
        <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={file.fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("无法加载 PDF 文件")
              setLoading(false)
            }}
          />
        </div>
      )
    }

    // 图片预览
    if (isImage) {
      return (
        <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg p-4">
          <img
            src={fileUrl}
            alt={file.fileName}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease',
            }}
            className="max-w-full max-h-[600px] object-contain"
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("无法加载图片")
              setLoading(false)
            }}
          />
        </div>
      )
    }

    // 视频预览
    if (isVideo) {
      return (
        <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
          <video
            controls
            className="w-full max-h-[600px]"
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setError("无法加载视频")
              setLoading(false)
            }}
          >
            <source src={fileUrl} type={file.fileType} />
            您的浏览器不支持视频播放
          </video>
        </div>
      )
    }

    // 音频预览
    if (isAudio) {
      return (
        <div className="w-full bg-gray-100 rounded-lg p-8 flex items-center justify-center">
          <audio
            controls
            className="w-full max-w-md"
            onLoadedData={() => setLoading(false)}
            onError={() => {
              setError("无法加载音频")
              setLoading(false)
            }}
          >
            <source src={fileUrl} type={file.fileType} />
            您的浏览器不支持音频播放
          </audio>
        </div>
      )
    }

    // 文本预览
    if (isText) {
      return (
        <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-auto">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0"
            title={file.fileName}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("无法加载文本文件")
              setLoading(false)
            }}
          />
        </div>
      )
    }

    // 不支持的文件类型
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📄</div>
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700">无法预览此文件类型</p>
          <p className="text-sm text-gray-500 mt-2">
            文件类型: {file.fileType}
          </p>
          <p className="text-sm text-gray-500">
            请下载后使用相应程序打开
          </p>
        </div>
        {onDownload && (
          <Button onClick={onDownload} className="mt-4">
            <Download className="w-4 h-4 mr-2" />
            下载文件
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <DialogTitle className="text-xl font-semibold truncate">
                {file.fileName}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* 图片/PDF控制按钮 */}
              {(isImage || isPDF) && (
                <>
                  <Button variant="outline" size="sm" onClick={handleZoomOut}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <Button variant="outline" size="sm" onClick={handleZoomIn}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </>
              )}
              {isImage && (
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  <RotateCw className="w-4 h-4" />
                </Button>
              )}
              {onDownload && (
                <Button variant="outline" size="sm" onClick={onDownload}>
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4">
          {loading && (
            <Skeleton className="w-full h-[600px] rounded-lg" />
          )}
          {error ? (
            <div className="w-full h-[400px] bg-red-50 rounded-lg flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">⚠️</div>
              <div className="text-center">
                <p className="text-lg font-semibold text-red-700">加载失败</p>
                <p className="text-sm text-red-600 mt-2">{error}</p>
              </div>
              {onDownload && (
                <Button onClick={onDownload} variant="outline" className="mt-4">
                  <Download className="w-4 h-4 mr-2" />
                  下载文件
                </Button>
              )}
            </div>
          ) : (
            <div className={loading ? "hidden" : ""}>
              {renderPreview()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
