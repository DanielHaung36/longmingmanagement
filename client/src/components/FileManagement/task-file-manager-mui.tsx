"use client"

import { useState, useRef } from "react"
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Divider,
  Stack,
} from "@mui/material"
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Folder as FolderIcon,
  Visibility as PreviewIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"

interface TaskFile {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  oneDrivePath?: string
  uploadStatus: "PENDING" | "UPLOADING" | "COMPLETED" | "FAILED"
  uploadProgress?: number
  createdAt: string
}

interface TaskFileManagerProps {
  taskId: number
  taskCode?: string
  files: TaskFile[]
  onUpload: (files: FileList) => Promise<void>
  onDownload: (fileId: number) => Promise<void>
  onDelete: (fileId: number) => Promise<void>
  onRefresh: () => void
}

export function TaskFileManagerMUI({
  taskId,
  taskCode,
  files,
  onUpload,
  onDownload,
  onDelete,
  onRefresh,
}: TaskFileManagerProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState<TaskFile | null>(null)
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<TaskFile | null>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    setUploading(true)
    try {
      await onUpload(selectedFiles)
      toast({
        title: "Success",
        description: `${selectedFiles.length} file(s) uploaded successfully`,
      })
      onRefresh()
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.message || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleDownload = async (file: TaskFile) => {
    try {
      await onDownload(file.id)
      toast({
        title: "Download Started",
        description: `Downloading ${file.fileName}`,
      })
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmFile) return

    try {
      await onDelete(deleteConfirmFile.id)
      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      setDeleteConfirmFile(null)
      onRefresh()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const copyOneDrivePath = (path: string) => {
    navigator.clipboard.writeText(path)
    toast({
      title: "Copied",
      description: "OneDrive path copied to clipboard",
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getFileTypeColor = (fileType: string): string => {
    if (fileType.includes("pdf")) return "#ef4444"
    if (fileType.includes("image")) return "#3b82f6"
    if (fileType.includes("excel") || fileType.includes("spreadsheet")) return "#10b981"
    if (fileType.includes("word") || fileType.includes("document")) return "#3b82f6"
    return "#64748b"
  }

  const getFileIcon = (file: TaskFile) => {
    const color = getFileTypeColor(file.fileType)
    return <FileIcon sx={{ color }} />
  }

  return (
    <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
          backgroundColor: "grey.50",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Task Files
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {taskCode && `Task: ${taskCode} • `}
              {files.length} file(s)
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            sx={{
              bgcolor: "grey.900",
              "&:hover": { bgcolor: "grey.800" },
            }}
          >
            Upload Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
        </Stack>
      </Box>

      {/* Upload Progress */}
      {uploading && (
        <Box sx={{ p: 2, backgroundColor: "info.lighter" }}>
          <Typography variant="body2" color="info.dark" mb={1}>
            Uploading files...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* File List */}
      {files.length === 0 ? (
        <Box
          sx={{
            p: 8,
            textAlign: "center",
            color: "text.secondary",
          }}
        >
          <FolderIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary">
            No files uploaded
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Click "Upload Files" to add files to this task
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {files.map((file, index) => (
            <Box key={file.id}>
              <ListItem
                sx={{
                  py: 2,
                  px: 3,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <ListItemIcon>{getFileIcon(file)}</ListItemIcon>

                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight={500}>
                      {file.fileName}
                    </Typography>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.fileSize)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </Typography>
                      {file.uploadStatus === "COMPLETED" && (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Chip
                            icon={<CheckIcon />}
                            label="Synced"
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </>
                      )}
                      {file.uploadStatus === "FAILED" && (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            •
                          </Typography>
                          <Chip
                            icon={<ErrorIcon />}
                            label="Failed"
                            size="small"
                            color="error"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        </>
                      )}
                    </Stack>
                  }
                />

                <ListItemSecondaryAction>
                  <Stack direction="row" spacing={0.5}>
                    {file.oneDrivePath && (
                      <Tooltip title="Copy OneDrive Path">
                        <IconButton
                          size="small"
                          onClick={() => copyOneDrivePath(file.oneDrivePath!)}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip title="Preview">
                      <IconButton
                        size="small"
                        onClick={() => setPreviewFile(file)}
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(file)}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setDeleteConfirmFile(file)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </ListItemSecondaryAction>
              </ListItem>

              {file.uploadStatus === "UPLOADING" && file.uploadProgress !== undefined && (
                <Box sx={{ px: 3, pb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={file.uploadProgress}
                    sx={{ height: 6, borderRadius: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={0.5}>
                    Uploading... {file.uploadProgress}%
                  </Typography>
                </Box>
              )}

              {index < files.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        maxWidth="md"
        fullWidth
      >
        {previewFile && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">File Preview</Typography>
                <IconButton onClick={() => setPreviewFile(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight={500}>
                  {previewFile.fileName}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Size: {formatFileSize(previewFile.fileSize)} • Type: {previewFile.fileType}
                </Typography>
              </Box>

              {previewFile.oneDrivePath && (
                <Alert
                  severity="info"
                  action={
                    <Button
                      size="small"
                      startIcon={<CopyIcon />}
                      onClick={() => copyOneDrivePath(previewFile.oneDrivePath!)}
                    >
                      Copy Path
                    </Button>
                  }
                >
                  <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                    {previewFile.oneDrivePath}
                  </Typography>
                </Alert>
              )}

              {previewFile.fileType.includes("image") ? (
                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: 300,
                    backgroundColor: "grey.100",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Image preview not yet implemented
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    mt: 2,
                    p: 3,
                    textAlign: "center",
                    backgroundColor: "grey.50",
                    borderRadius: 1,
                  }}
                >
                  <FileIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Preview not available for this file type
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPreviewFile(null)}>Close</Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleDownload(previewFile)}
                sx={{
                  bgcolor: "grey.900",
                  "&:hover": { bgcolor: "grey.800" },
                }}
              >
                Download
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmFile}
        onClose={() => setDeleteConfirmFile(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete File</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteConfirmFile?.fileName}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmFile(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
