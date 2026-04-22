"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, ArrowLeft, Check, Plus, Minus, Upload, Paperclip, X, Camera } from "lucide-react"
import { useNavigate } from "react-router-dom"
import ZxingBarcodeScanner from "@/components/zxing-barcode-scanner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useScanInMutation, useGetInventoryByCodeQuery, useUploadTransactionAttachmentMutation } from "../inventoryApi"
import { useGetWarehousesQuery } from "../../warehouses/warehousesApi"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { useToast } from "../../../hooks/use-toast"
import { useSelector } from "react-redux"
import type { RootState } from "@/src/app/store"

export default function ScanInPage() {
  const { toast } = useToast();
  const { t } = useTranslation()
  const router = useNavigate()
  const operator = useSelector((state: RootState) => state.auth.user?.name ?? 'unknown')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const [scannedCode, setScannedCode] = useState("")
  const [scannedFormat, setScannedFormat] = useState("")
  const [data, setdata] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [scanError, setScanError] = useState("")
  const [scanHistory, setScanHistory] = useState<Array<{ code: string; format: string; time: Date }>>([])

  // 附件相关状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [lastTransactionId, setLastTransactionId] = useState<number | null>(null)
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false)

  // 仓库选择 - 默认 Perth (id=2)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("2")
  const { data: warehouses = [] } = useGetWarehousesQuery()

  const [scanIn, { isLoading }] = useScanInMutation();
  const [uploadAttachment] = useUploadTransactionAttachmentMutation();
  const { data: inventory, isLoading: ld } = useGetInventoryByCodeQuery(scannedCode, { skip: !scannedCode });
  const availableStock = ((inventory?.actualQty || 0) - (inventory?.lockedQty || 0)) || 0;

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive",
        })
        return false
      }
      return true
    })
    setSelectedFiles(prev => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 处理拍照
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const file = files[0]
      // 给拍照的文件添加时间戳命名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const renamedFile = new File([file], `photo_${timestamp}.jpg`, { type: file.type })
      setSelectedFiles(prev => [...prev, renamedFile])
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  // 移除已选文件
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleScan = (result: string, format: string) => {
    setScannedCode(result)
    setScannedFormat(format)

    setScanError("")

    // 添加到扫描历史
    const newScan = { code: result, format, time: new Date() }
    setScanHistory((prev) => [newScan, ...prev.slice(0, 4)]) // 保留最近5次


    // 播放扫码成功音效（可选）
    // try {
    //   const audio = new Audio(
    //     "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
    //   )
    //   audio.play().catch(() => {}) // 忽略音频播放错误
    // } catch (e) {}
  }

  const handleScanError = (error: string) => {
    setScanError(error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedCode) return

    setIsSubmitting(true)
    try {
      // 执行入库
      const res = await scanIn({
        code: scannedCode,
        format: scannedFormat,
        quantity,
        warehouseId: selectedWarehouse ? Number(selectedWarehouse) : undefined,
      }).unwrap();

      const transactionId = (res as any).transaction?.id
      setLastTransactionId(transactionId)
      setdata((res as any).inventory?.barcode || "")
      setIsSubmitting(false)
      setIsSuccess(true)

      // 如果有选择的附件，上传它们
      if (selectedFiles.length > 0 && transactionId) {
        setIsUploadingAttachments(true)
        for (const file of selectedFiles) {
          try {
            await uploadAttachment({
              transactionId,
              file,
              description: `Scan-in attachment for ${scannedCode}`,
              operator,
            }).unwrap()
          } catch (uploadError) {
            console.error('Failed to upload attachment:', file.name, uploadError)
          }
        }
        setIsUploadingAttachments(false)
        toast({
          title: t("inventoryscan.inboundSuccess"),
          description: `${selectedFiles.length} attachment(s) uploaded`,
        });
      } else {
        toast({
          title: t("inventoryscan.inboundSuccess"),
          description: t("inventoryscan.inboundSuccessInfo"),
        });
      }
    } catch (error: any) {
      setIsSubmitting(false)
      const msg = error?.data?.error || t("dialog.operationFailed");
      setScanError(msg);
      toast({
        title: t("dialog.operationFailed"),
        description: msg,
        variant: "destructive",
      });
    }
  }

  // 重置表单，准备下一次扫码
  const handleReset = () => {
    setIsSuccess(false)
    setScannedCode("")
    setScannedFormat("")
    setQuantity(1)
    setScanError("")
    setSelectedFiles([])
    setLastTransactionId(null)
    // 仓库选择保留，不重置
  }

  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1))
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">{t('inventoryscan.inboundSuccess')}</h3>
            <p className="text-green-600 mb-2">{t('inventoryscan.inboundSuccessInfo')}</p>
            <div className="text-sm text-gray-600 mb-4">
              <p>{t('inventoryscan.code')}: {scannedCode}</p>
              <p>{t('inventoryscan.num')}: {quantity}</p>
              {scannedFormat && <p>{t('inventoryscan.format')}: {scannedFormat}</p>}
              {selectedFiles.length > 0 && (
                <p className="text-blue-600 mt-2">
                  <Paperclip className="w-4 h-4 inline mr-1" />
                  {isUploadingAttachments ? 'Uploading attachments...' : `${selectedFiles.length} attachment(s) uploaded`}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Button onClick={handleReset} className="w-full">
                {t('inventoryscan.scanAgain') || 'Scan Another Item'}
              </Button>
              <Button variant="outline" onClick={() => router(-1)} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('inventoryscan.back') || 'Back to Menu'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6 pt-4">
          <Button variant="ghost" size="icon" onClick={() => router(-1)} className="mr-3">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{t("inventoryscan.scanInTitle")}</h1>
            <p className="text-gray-600 text-sm">{t("inventoryscan.scanBarcode")}</p>
          </div>
        </div>

        {/* 扫码器 - 自动启动 */}
        <div className="mb-6">
          <ZxingBarcodeScanner onScan={handleScan} onError={handleScanError} isActive={true} autoStart={true} />
        </div>

        {scanError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}

        {/* 扫码结果显示 */}
        {scannedCode && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-green-800">{t("inventoryscan.scanSuccess")}</p>
                  <p className="text-sm text-green-600 font-mono">{scannedCode}</p>
                  {scannedFormat && <p className="text-xs text-green-500">{t("inventoryscan.format")}: {scannedFormat}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 入库表单 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {t("inventoryscan.inboundInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("inventoryscan.code")}</Label>
                <Input
                  id="code"
                  value={scannedCode}
                  onChange={(e) => setScannedCode(e.target.value)}
                  placeholder={t("inventoryscan.enterManually")}
                  className={scannedCode ? "border-green-300 bg-green-50" : ""}
                />
              </div>

              {/* 仓库选择 */}
              <div className="space-y-2">
                <Label htmlFor="warehouse">{t("inventoryscan.warehouse") || "Warehouse"}</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("inventoryscan.selectWarehouse") || "Select warehouse (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={String(wh.id)}>
                        {wh.name} {wh.location ? `- ${wh.location}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">{t("inventoryscan.num")}</Label>
                <div className="flex items-center space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                    className="text-center font-medium"
                    min="1"
                  />
                  <Button type="button" variant="outline" size="icon" onClick={incrementQuantity}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* 商品预览 */}
              {scannedCode && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">{t("inventoryscan.productPreview")}</h4>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium">{scannedFormat === "QR_CODE" ? t("inventoryscan.qrCodeProduct") : t("inventoryscan.barcodeProduct")}</p>
                      <p className="text-sm text-gray-600 font-mono">{scannedCode}</p>
                      <p className="text-sm text-green-600">{t("inventoryscan.stock")}: {availableStock} {t("inventoryscan.items")}</p>
                      {scannedFormat && <p className="text-xs text-blue-600">{t("inventoryscan.format")}: {scannedFormat}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* 附件上传区域 */}
              <div className="space-y-2">
                <Label className="flex items-center">
                  <Paperclip className="w-4 h-4 mr-2" />
                  {t("inventoryscan.attachments") || "Attachments"} ({selectedFiles.length})
                </Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraCapture}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t("inventoryscan.takePhoto") || "Take Photo"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("inventoryscan.selectFiles") || "Select Files"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  {t("inventoryscan.supportedFiles") || "Supported: Images, PDF, Word, Excel (Max 50MB each)"}
                </p>

                {/* 已选文件列表 */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                        <div className="flex items-center flex-1 min-w-0">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          ) : (
                            <Paperclip className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                          )}
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0 h-8 w-8"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting || !scannedCode || isLoading}>
                {isSubmitting ? t("inventoryscan.processing") : t("inventoryscan.confirmInbound", { qty: quantity })}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 扫描历史 */}
        {scanHistory.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">{t("inventoryscan.recentScans")}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {scanHistory.slice(0, 3).map((scan, index) => (
                  <div key={index} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                    <span className="font-mono truncate flex-1 mr-2">{scan.code}</span>
                    <span className="text-blue-600">{scan.format}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
