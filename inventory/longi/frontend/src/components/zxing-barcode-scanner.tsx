"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Flashlight, FlashlightOff, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import successMp3 from "@/assets/success.mp3";
import failedMp3  from "@/assets/failed.mp3";

interface ZxingBarcodeScannerProps {
  onScan: (result: string, format: string) => void
  onError?: (error: string) => void
  isActive: boolean
  autoStart?: boolean
}

export default function ZxingBarcodeScanner({ onScan, onError, isActive, autoStart = true }: ZxingBarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
    // —— 把音频实例挂 refs —— 
  const successAudio = useRef<HTMLAudioElement>(null)
  const failedAudio  = useRef<HTMLAudioElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState<string>("")
  const [hasFlash, setHasFlash] = useState(false)
  const [flashOn, setFlashOn] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment")
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)


useEffect(() => {
    // 第一次挂载时创建并 preload
    successAudio.current = new Audio(successMp3)
    failedAudio .current = new Audio(failedMp3)
    successAudio.current.preload = "auto"
    failedAudio .current.preload = "auto"
  }, [])

  // 启动扫码
  const startScanning = async () => {
    if (!videoRef.current) return

    try {
      setError("")
      setIsScanning(true)

      // 创建扫码器
      const codeReader = new BrowserMultiFormatReader()
      codeReaderRef.current = codeReader

      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("浏览器不支持摄像头访问")
      }

      // 摄像头约束
      const constraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
      }
  // 播放成功音效
        const playSuccess = () => {
        if (!successAudio.current) return
        successAudio.current.currentTime = 0      // 从头开始
        successAudio.current.play().catch()
      }
      const playFailed = () => {
        if (!failedAudio.current) return
        failedAudio.current.currentTime = 0
        failedAudio.current.play().catch(console.error)
      }
      // 开始扫码
      await codeReader.decodeFromConstraints(constraints, videoRef.current, (scanResult, scanError) => {
        if (scanResult) {
          const now = Date.now()
          // 防止重复扫描（1秒内不重复）
          if (now - lastScanTime > 1000) {
            setLastScanTime(now)
            setScanned(true)
            const text = scanResult.getText()
            const format = scanResult.getBarcodeFormat().toString()
            setScannedText(text)
            playSuccess();

            onScan(text, format)
          }
        }

        // 忽略 NotFoundException（表示本次帧没有检测到条码）
        if (scanError && !(scanError instanceof NotFoundException)) {
          console.error("扫码错误:", scanError)
          playFailed()
        }
      })
    
      // 获取视频流以检查闪光灯支持
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      const track = stream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      setHasFlash("torch" in capabilities)
    } catch (e: any) {
      console.error("启动扫码失败:", e)
      let errorMsg = "启动扫码失败"

      if (e.name === "NotAllowedError") {
        errorMsg = "摄像头权限被拒绝，请在浏览器设置中允许摄像头访问"
      } else if (e.name === "NotFoundError") {
        errorMsg = "未找到摄像头设备"
      } else if (e.name === "NotReadableError") {
        errorMsg = "摄像头被其他应用占用"
      } else if (e.message) {
        errorMsg = e.message
      }

      setError(errorMsg)
      onError?.(errorMsg)
      setIsScanning(false)
    }
  }

  // 停止扫码
  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
      codeReaderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    setIsScanning(false)
    setFlashOn(false)
  }

  // 切换摄像头
  const switchCamera = () => {
    stopScanning()
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  // 切换闪光灯
  const toggleFlash = async () => {
    if (streamRef.current && hasFlash) {
      const track = streamRef.current.getVideoTracks()[0]
      try {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn }],
        })
        setFlashOn(!flashOn)
      } catch (err) {
        console.error("闪光灯控制失败:", err)
      }
    }
  }
     const [scanned, setScanned] = useState(false)
     const [scannedText, setScannedText] = useState("")
  // 自动启动扫码
  useEffect(() => {
    if (isActive && autoStart) {
      startScanning()
    } else if (!isActive) {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isActive, autoStart])

  // 摄像头切换后重新启动
  useEffect(() => {
    if (isActive && isScanning) {
      setTimeout(() => {
        startScanning()
      }, 100)
    }
  }, [facingMode])

  if (!isActive) {
    return null
  }


  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* 视频预览 */}
          <video
            ref={videoRef}
            className="w-full h-80 object-cover bg-black"
            muted
            playsInline
            style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
          />
          {/* 扫描框覆盖层 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* 扫描框 */}
              <div
                className={`
                  w-72 h-48 border-2 border-white rounded-lg relative
                  ${!isScanning ? "bg-black bg-opacity-10" : ""}
                `}
              >
                {/* 四个角的装饰 */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>

                {/* 扫描线动画 */}
                {isScanning && (
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse absolute top-1/2 transform -translate-y-1/2"></div>
                  </div>
                )}
              </div>

              {/* 提示文字 */}
                 {/* 提示文字 */}
              <div
                className={`
                  text-center mt-4 px-4 py-2 rounded-lg
                  ${scanned ? "bg-green-600 text-white" : "bg-black bg-opacity-60 text-white"}
                `}
              >
                {!scanned ? (
                  <>
                    <p className="text-sm font-medium">
                      {isScanning ? "正在扫描中…" : "将条形码或二维码对准扫描框"}
                    </p>
                    <p className="text-xs opacity-80 mt-1">支持各种条形码和二维码格式</p>
                  </>
                ) : (
                  <p className="text-sm font-medium">扫描成功：{scannedText}</p>
                )}
              </div>
            </div>
          </div>
              {/* 控制按钮 */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button variant="outline" size="sm" onClick={switchCamera} className="bg-black bg-opacity-50 text-white">
                  <RotateCcw className="w-4 h-4" />
                </Button>

                {hasFlash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlash}
                    className="bg-black bg-opacity-50 text-white border-white hover:bg-black hover:bg-opacity-70"
                  >
                    {flashOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                  </Button>
                )}
              </div>

              {/* 扫描状态指示器 */}
              <div className="absolute top-4 left-4">
                <div
                  className={`w-3 h-3 rounded-full ${isScanning ? "bg-green-400 animate-pulse" : "bg-red-400"
                    } border-2 border-white`}
                ></div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="m-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* 支持的码制说明 */}
            <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t">
              <p className="font-medium mb-1">支持格式：</p>
              <div className="grid grid-cols-3 gap-1 text-xs">
                <span>• QR码</span>
                <span>• EAN-13</span>
                <span>• EAN-8</span>
                <span>• Code-128</span>
                <span>• Code-39</span>
                <span>• Code-93</span>
                <span>• ITF</span>
                <span>• Codabar</span>
                <span>• UPC-A</span>
              </div>
            </div>
          </CardContent>
        </Card>
     )
}
