// src/features/inventory/components/TransactionAttachments.tsx
import React, { useState, useRef } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Grid,
  TextField,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Description as DocumentIcon,
  AttachFile as FileIcon,
  Close as CloseIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import {
  useGetTransactionAttachmentsQuery,
  useUploadTransactionAttachmentMutation,
  useDeleteTransactionAttachmentMutation,
  type TransactionAttachment,
} from '../inventoryApi'
import { useSelector } from 'react-redux'
import type { RootState } from '@/src/app/store'

interface TransactionAttachmentsProps {
  transactionId: number
  readOnly?: boolean
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 获取附件图标
const getAttachmentIcon = (attachType: string) => {
  switch (attachType) {
    case 'IMAGE':
      return <ImageIcon />
    case 'DOCUMENT':
      return <DocumentIcon />
    default:
      return <FileIcon />
  }
}

export default function TransactionAttachments({
  transactionId,
  readOnly = false,
}: TransactionAttachmentsProps) {
  const operator = useSelector((state: RootState) => state.auth.user?.name ?? 'unknown')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState('')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const { data: attachments = [], isLoading } = useGetTransactionAttachmentsQuery(transactionId)
  const [uploadAttachment, { isLoading: isUploading }] = useUploadTransactionAttachmentMutation()
  const [deleteAttachment, { isLoading: isDeleting }] = useDeleteTransactionAttachmentMutation()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件大小 (最大 50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert('File size should be less than 50MB')
      return
    }

    try {
      await uploadAttachment({
        transactionId,
        file,
        description,
        operator,
      }).unwrap()
      setDescription('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload attachment')
    }
  }

  const handleDelete = async (attachmentId: number) => {
    try {
      await deleteAttachment(attachmentId).unwrap()
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Delete failed:', error)
      alert('Failed to delete attachment')
    }
  }

  const getFullUrl = (path: string) => {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || ''
    return baseUrl + path
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <FileIcon fontSize="small" />
        Attachments ({attachments.length})
      </Typography>

      {/* 上传区域 */}
      {!readOnly && (
        <Box sx={{ mb: 2, p: 2, border: '1px dashed #ccc', borderRadius: 1, bgcolor: '#fafafa' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                size="small"
                fullWidth
                label="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Packing slip, Product photo..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                variant="outlined"
                startIcon={isUploading ? <CircularProgress size={16} /> : <UploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                fullWidth
              >
                {isUploading ? 'Uploading...' : 'Upload File'}
              </Button>
            </Grid>
          </Grid>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Supported: Images, PDF, Word, Excel (Max 50MB)
          </Typography>
        </Box>
      )}

      {/* 附件列表 */}
      {attachments.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No attachments yet
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {attachments.map((attachment) => (
            <Grid item xs={6} sm={4} md={3} key={attachment.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                {attachment.attachType === 'IMAGE' ? (
                  <CardMedia
                    component="img"
                    height="100"
                    image={getFullUrl(attachment.filePath)}
                    alt={attachment.fileName}
                    sx={{ objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setPreviewImage(getFullUrl(attachment.filePath))}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 100,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f5f5f5',
                    }}
                  >
                    {getAttachmentIcon(attachment.attachType)}
                  </Box>
                )}
                <CardContent sx={{ py: 1, px: 1.5 }}>
                  <Typography variant="caption" noWrap title={attachment.fileName}>
                    {attachment.fileName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                    <Chip
                      label={attachment.attachType}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                    <Chip
                      label={formatFileSize(attachment.fileSize)}
                      size="small"
                      sx={{ fontSize: '0.65rem', height: 18 }}
                    />
                  </Box>
                  {attachment.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {attachment.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ py: 0.5, px: 1 }}>
                  <IconButton
                    size="small"
                    href={getFullUrl(attachment.filePath)}
                    target="_blank"
                    title="View/Download"
                  >
                    <ViewIcon fontSize="small" />
                  </IconButton>
                  {!readOnly && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteConfirmId(attachment.id)}
                      title="Delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 图片预览对话框 */}
      <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="md">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Image Preview
          <IconButton onClick={() => setPreviewImage(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewImage && (
            <img src={previewImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Delete Attachment?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this attachment? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            disabled={isDeleting}
          >
            {isDeleting ? <CircularProgress size={16} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
