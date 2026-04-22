"use client"

import { useState, useRef, useCallback, useEffect } from "react"
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
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  TextField,
  CircularProgress,
} from "@mui/material"
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  Share as ShareIcon,
  CloudQueue as OneDriveIcon,
  Computer as LocalIcon,
  ArrowUpward as ArrowUpIcon,
  CreateNewFolder as CreateNewFolderIcon,
  LaunchOutlined as LaunchIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"
import {
  useGetTaskFolderContentsQuery,
  useBrowseFolderContentsQuery,
  useUploadFileToFolderMutation,
  useCreateShareLinkMutation,
  useRequestFileDeleteMutation,
  useCreateFolderMutation,
} from "@/state/api"
import { isElectron, openFileInExplorer } from "@/utils/electronBridge"

interface FileItem {
  name: string
  path: string
  type: "file" | "folder"
  size?: number
  extension?: string
  modifiedAt?: string
  isOneDrive?: boolean
}

interface FolderContent {
  path: string
  items: FileItem[]
  breadcrumbs: { name: string; path: string }[]
  isOneDrive: boolean
}

interface FolderPreviewProps {
  taskId: number
  taskCode?: string
  projectId?: number
  onRefresh?: () => void
}

export function FolderPreviewMUI({
  taskId,
  taskCode,
  projectId,
  onRefresh,
}: FolderPreviewProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<"local" | "onedrive">("onedrive")
  const [folderPaths, setFolderPaths] = useState<{ local: string; onedrive: string }>({
    local: "",
    onedrive: "",
  })
  const [uploading, setUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteFileId, setDeleteFileId] = useState<number | null>(null)
  const [deleteReason, setDeleteReason] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [isElectronApp, setIsElectronApp] = useState(false)

  // Check if running in Electron on mount
  useEffect(() => {
    setIsElectronApp(isElectron())
  }, [])
  const [newFolderName, setNewFolderName] = useState("")
  const [baseBreadcrumbIndices, setBaseBreadcrumbIndices] = useState<{ local: number | null; onedrive: number | null }>({
    local: null,
    onedrive: null,
  })

  const currentRelativePath = folderPaths[activeTab]

  // Fetch task folder contents
  const {
    data: taskFolderData,
    isLoading: taskFolderLoading,
    refetch: refetchTaskFolder,
  } = useGetTaskFolderContentsQuery(
    { taskId, subfolder: currentRelativePath || undefined },
    { skip: !taskId }
  )

  // Upload mutation
  const [uploadFile] = useUploadFileToFolderMutation()

  // Share link mutation
  const [createShareLink] = useCreateShareLinkMutation()

  // Delete request mutation
  const [requestDelete] = useRequestFileDeleteMutation()

  // Create folder mutation
  const [createFolderMutation] = useCreateFolderMutation()

  const currentFolderData: FolderContent | null =
    activeTab === "local"
      ? taskFolderData?.data?.local
      : taskFolderData?.data?.onedrive
  const oneDriveRoot = taskFolderData?.data?.onedrive || null
  const canUploadToOneDrive = activeTab === "onedrive" && !!oneDriveRoot && !!currentFolderData
  const oneDriveUnavailable = !taskFolderLoading && activeTab === "onedrive" && !oneDriveRoot
  const uploadTooltipMessage = oneDriveUnavailable
    ? "OneDrive path is not configured for this task."
    : !currentFolderData
    ? "Preparing OneDrive folder..."
    : "Files upload to OneDrive first, then sync to the local mirror."
  const handleTabChange = (_event: React.SyntheticEvent, newValue: "local" | "onedrive") => {
    setActiveTab(newValue)
    setFolderPaths((prev) => ({
      ...prev,
      [newValue]: "",
    }))
  }

  const handleFolderClick = (item: FileItem) => {
    if (item.type !== "folder") return

    setFolderPaths((prev) => {
      const previousPath = prev[activeTab]
      const nextPath = previousPath ? `${previousPath}/${item.name}` : item.name

      return {
        ...prev,
        [activeTab]: nextPath,
      }
    })
  }

  const handleBreadcrumbClick = (breadcrumbIndex: number) => {
    if (!currentFolderData) return

    const baseIndex = baseBreadcrumbIndices[activeTab] ?? 0
    if (breadcrumbIndex < baseIndex) return

    const crumbs = currentFolderData.breadcrumbs
    const nextPath =
      breadcrumbIndex <= baseIndex
        ? ""
        : crumbs
            .slice(baseIndex + 1, breadcrumbIndex + 1)
            .map((crumb) => crumb.name)
            .join("/")

    setFolderPaths((prev) => ({
      ...prev,
      [activeTab]: nextPath,
    }))
  }

  const handleGoBack = () => {
    if (!currentFolderData || !currentRelativePath) return

    setFolderPaths((prev) => {
      const segments = prev[activeTab].split("/").filter(Boolean)
      segments.pop()

      return {
        ...prev,
        [activeTab]: segments.join("/"),
      }
    })
  }

  const handleRefresh = () => {
    refetchTaskFolder()
    onRefresh?.()
    toast({
      title: "Refreshed",
      description: "Folder contents updated",
    })
  }

  // File upload handlers
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles || selectedFiles.length === 0) return

    if (!canUploadToOneDrive) {
      toast({
        title: "Upload unavailable",
        description: oneDriveUnavailable
          ? "This task is missing a OneDrive folder, upload is disabled."
          : "Switch to the OneDrive tab and choose a valid folder before uploading.",
        variant: "destructive",
      })
      return
    }

    await uploadFiles(selectedFiles)
  }

  const uploadFiles = async (files: FileList) => {
    if (!canUploadToOneDrive) {
      toast({
        title: "Upload unavailable",
        description: oneDriveUnavailable
          ? "This task is missing a OneDrive folder, upload is disabled."
          : "Switch to the OneDrive tab and choose a valid folder before uploading.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()

      // Add all files
      Array.from(files).forEach((file) => {
        formData.append("file", file)
      })

      // Add metadata
      formData.append("targetPath", currentFolderData?.path || "")
      formData.append("taskId", taskId.toString())
      if (projectId) {
        formData.append("projectId", projectId.toString())
      }

      const response = await uploadFile(formData).unwrap()
      const localSyncStatus = response?.data?.localSyncStatus as
        | "SUCCESS"
        | "SKIPPED_NO_LOCAL_PATH"
        | "FAILED"
        | undefined
      const responseMessage = response?.message || `${files.length} file(s) uploaded to OneDrive`

      if (localSyncStatus === "FAILED") {
        toast({
          title: "Sync warning",
          description: responseMessage || "Files uploaded to OneDrive, but syncing to local storage failed.",
          variant: "destructive",
        })
      } else if (localSyncStatus === "SKIPPED_NO_LOCAL_PATH") {
        toast({
          title: "Uploaded to OneDrive",
          description: responseMessage,
        })
      } else {
        toast({
          title: "Upload complete",
          description: responseMessage,
        })
      }
      handleRefresh()
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error?.data?.message || "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // Drag and drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!canUploadToOneDrive) return
      setDragOver(true)
    },
    [canUploadToOneDrive]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOver(false)

      const files = e.dataTransfer.files
      if (!canUploadToOneDrive) {
        toast({
          title: "Upload unavailable",
          description: oneDriveUnavailable
            ? "This task is missing a OneDrive folder, upload is disabled."
            : "Switch to the OneDrive tab and choose a valid folder before uploading.",
          variant: "destructive",
        })
        return
      }
      if (files.length > 0) {
        await uploadFiles(files)
      }
    },
    [canUploadToOneDrive, oneDriveUnavailable, uploadFiles]
  )

  useEffect(() => {
    if (!currentFolderData) return

    const baseIndex = currentFolderData.breadcrumbs.length - 1
    const currentBase = baseBreadcrumbIndices[activeTab]
    const shouldCaptureBase = currentRelativePath === "" || currentBase === null

    if (shouldCaptureBase && currentBase !== baseIndex) {
      setBaseBreadcrumbIndices((prev) => ({
        ...prev,
        [activeTab]: baseIndex,
      }))
    }
  }, [currentFolderData, currentRelativePath, activeTab, baseBreadcrumbIndices])

  // File download handler
  const handleDownload = async (file: FileItem) => {
    try {
      const downloadUrl = `/api/folders/download?path=${encodeURIComponent(file.path)}`

      const response = await fetch(downloadUrl)
      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: `Downloading ${file.name}`,
      })
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error?.message || "Failed to download file",
        variant: "destructive",
      })
    }
  }

  // File delete request handler (requires approval)
  const handleDeleteRequest = async () => {
    if (!deleteFileId || !deleteReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for deletion",
        variant: "destructive",
      })
      return
    }

    try {
      await requestDelete({ fileId: deleteFileId, reason: deleteReason }).unwrap()

      toast({
        title: "Delete Request Submitted",
        description: "File deletion request has been submitted for approval",
      })

      setDeleteDialogOpen(false)
      setDeleteFileId(null)
      setDeleteReason("")
      handleRefresh()
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error?.data?.message || "Failed to submit delete request",
        variant: "destructive",
      })
    }
  }

  // Copy OneDrive sharing link
  const handleCopyShareLink = async (file: FileItem) => {
    try {
      const result = await createShareLink({ path: file.path }).unwrap()
      if (result?.data?.url) {
        await navigator.clipboard.writeText(result.data.url)
        toast({ title: "链接已复制", description: "OneDrive 分享链接已复制到剪贴板" })
      } else {
        throw new Error("未获取到链接")
      }
    } catch (error: any) {
      toast({
        title: "复制失败",
        description: error?.data?.message || "创建分享链接失败，请重试",
        variant: "destructive",
      })
    }
  }

  // Create folder handler
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a folder name",
        variant: "destructive",
      })
      return
    }

    try {
      const targetPath = currentFolderData?.path

      await createFolderMutation({
        targetPath,
        folderName: newFolderName,
        taskId,
      }).unwrap()

      toast({
        title: "Folder Created",
        description: `Folder "${newFolderName}" has been created successfully`,
      })

      setCreateFolderDialogOpen(false)
      setNewFolderName("")
      handleRefresh()
    } catch (error: any) {
      toast({
        title: "Create Failed",
        description: error?.data?.message || "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const getFileIcon = (item: FileItem) => {
    if (item.type === "folder") {
      return <FolderIcon sx={{ color: "#fbbf24" }} />
    }

    const ext = item.extension?.toLowerCase() || ""
    if ([".pdf"].includes(ext)) return <FileIcon sx={{ color: "#ef4444" }} />
    if ([".jpg", ".jpeg", ".png", ".gif", ".bmp"].includes(ext))
      return <FileIcon sx={{ color: "#3b82f6" }} />
    if ([".xlsx", ".xls", ".csv"].includes(ext))
      return <FileIcon sx={{ color: "#10b981" }} />
    if ([".docx", ".doc", ".txt"].includes(ext))
      return <FileIcon sx={{ color: "#3b82f6" }} />
    if ([".dwg", ".dxf", ".rvt"].includes(ext))
      return <FileIcon sx={{ color: "#8b5cf6" }} />

    return <FileIcon sx={{ color: "#64748b" }} />
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
              Folder Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {taskCode && `Task: ${taskCode}`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center">
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            {activeTab === "onedrive" && (
              <>
                <Tooltip title="Create a new folder">
                  <Button
                    variant="outlined"
                    startIcon={<CreateNewFolderIcon />}
                    onClick={() => setCreateFolderDialogOpen(true)}
                    disabled={!canUploadToOneDrive}
                    sx={{
                      borderColor: "grey.400",
                      color: "grey.900",
                      "&:hover": { borderColor: "grey.600", bgcolor: "grey.50" },
                    }}
                  >
                    New Folder
                  </Button>
                </Tooltip>
                <Tooltip title={uploadTooltipMessage}>
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<UploadIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || !canUploadToOneDrive}
                      sx={{
                        bgcolor: "grey.900",
                        "&:hover": { bgcolor: "grey.800" },
                      }}
                    >
                      Upload Files
                    </Button>
                  </span>
                </Tooltip>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </>
            )}
          </Stack>
        </Stack>

        {/* Tabs - Only show OneDrive */}
        <Box sx={{ mt: 2, borderBottom: 1, borderColor: "divider", pb: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <OneDriveIcon fontSize="small" sx={{ color: "primary.main" }} />
            <Typography variant="subtitle1" fontWeight={600}>
              OneDrive Files
            </Typography>
          </Stack>
        </Box>

        {oneDriveUnavailable && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            This task has no OneDrive folder configured, so uploads are disabled.
          </Alert>
        )}
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

      {/* Breadcrumbs Navigation */}
      {currentFolderData && currentFolderData.breadcrumbs.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Tooltip title="Go to parent directory">
              <span>
                <IconButton
                  size="small"
                  onClick={handleGoBack}
                  disabled={!currentFolderData || currentFolderData.breadcrumbs.length <= 1}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <ArrowUpIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>

            <Breadcrumbs
              separator={<NavigateNextIcon fontSize="small" />}
              aria-label="folder breadcrumb"
              sx={{ flex: 1 }}
            >
              {currentFolderData.breadcrumbs.map((crumb, index) => {
                const baseIndex = baseBreadcrumbIndices[activeTab] ?? 0
                const isCurrent = index === currentFolderData.breadcrumbs.length - 1
                const isClickable = index >= baseIndex

                return (
                  <Link
                    key={index}
                    component={isClickable ? "button" : "span"}
                    variant="body2"
                    onClick={isClickable ? () => handleBreadcrumbClick(index) : undefined}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      textDecoration: "none",
                      color: isCurrent ? "text.primary" : isClickable ? "primary.main" : "text.disabled",
                      cursor: isClickable ? "pointer" : "default",
                      "&:hover": isClickable ? { textDecoration: "underline" } : undefined,
                    }}
                  >
                    {index === 0 && <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />}
                    {crumb.name}
                  </Link>
                )
              })}
            </Breadcrumbs>
          </Stack>
        </Box>
      )}

      {/* Folder Contents - Drop Zone */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          position: "relative",
          minHeight: 400,
          border: dragOver ? "2px dashed" : "none",
          borderColor: "primary.main",
          backgroundColor: dragOver ? "action.hover" : "transparent",
          transition: "all 0.2s",
        }}
      >
        {taskFolderLoading ? (
          <Box
            sx={{
              p: 8,
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Loading folder contents...
            </Typography>
          </Box>
        ) : !currentFolderData ? (
          <Box
            sx={{
              p: 8,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <FolderIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              {oneDriveUnavailable ? "OneDrive folder not configured" : "Folder not found"}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {oneDriveUnavailable
                ? "This task does not have a OneDrive folder yet. Configure it before uploading."
                : `The ${activeTab === "local" ? "local" : "OneDrive"} folder has not been created yet`}
            </Typography>
          </Box>
        ) : currentFolderData.items.length === 0 ? (
          <Box
            sx={{
              p: 8,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <FolderOpenIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              Empty folder
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              {canUploadToOneDrive
                ? 'Drag files here or click "Upload Files" to start uploading.'
                : activeTab === "onedrive"
                ? "This task has no OneDrive folder configured, so uploads are disabled."
                : "Local folder is empty (read-only reference)."}
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {currentFolderData.items.map((item, index) => (
              <Box key={index}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    cursor: item.type === "folder" ? "pointer" : "default",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                  onClick={() => item.type === "folder" && handleFolderClick(item)}
                >
                  <ListItemIcon>{getFileIcon(item)}</ListItemIcon>

                  <ListItemText
                    primaryTypographyProps={{ component: "div" }}
                    secondaryTypographyProps={{ component: "div" }}
                    primary={
                      <Typography variant="body1" component="span" fontWeight={item.type === "folder" ? 600 : 500}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {item.type === "file" && item.size && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(item.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              |
                            </Typography>
                          </>
                        )}
                        {item.modifiedAt && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            {new Date(item.modifiedAt).toLocaleDateString()}
                          </Typography>
                        )}
                        {item.type === "folder" && (
                          <Chip
                            component="span"
                            label="Folder"
                            size="small"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                    }
                  />

                  {/* 文件夹的操作按钮 */}
                  {item.type === "folder" && (
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Open Folder in File Explorer">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation(); // 阻止触发文件夹点击事件
                              openFileInExplorer(item.path, true); // 明确告诉Electron这是文件夹
                            }}
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Copy Path">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(item.path);
                              toast({
                                title: "Copied",
                                description: "Folder path copied to clipboard",
                              });
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItemSecondaryAction>
                  )}

                  {/* 文件的操作按钮 */}
                  {item.type === "file" && (
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5}>
                        {activeTab === "onedrive" && (
                          <Tooltip title="Share OneDrive Link (Coming Soon)">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyShareLink(item);
                              }}
                            >
                              <ShareIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Tooltip title="Copy Path">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(item.path);
                              toast({
                                title: "Copied",
                                description: "File path copied to clipboard",
                              });
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(item);
                            }}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Open in File Explorer">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFileInExplorer(item.path, false); // 明确告诉Electron这是文件
                            }}
                          >
                            <LaunchIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Request Delete (Requires Approval)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Note: This requires fileId from database
                              // For now, show warning
                              toast({
                                title: "Feature Note",
                                description: "File deletion requires approval. This will be integrated with the file database.",
                              });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>

                {index < currentFolderData.items.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}

        {/* Drag Over Overlay */}
        {dragOver && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.05)",
              pointerEvents: "none",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <UploadIcon sx={{ fontSize: 64, color: "primary.main" }} />
              <Typography variant="h6" color="primary.main" mt={2}>
                Drop files here to upload
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Delete Request Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Request File Deletion</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            File deletion requires approval from an administrator.
          </Alert>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Reason for Deletion"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Please provide a reason for deleting this file..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteRequest}
            disabled={!deleteReason.trim()}
            startIcon={<DeleteIcon />}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog
        open={createFolderDialogOpen}
        onClose={() => {
          setCreateFolderDialogOpen(false)
          setNewFolderName("")
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder Name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Enter folder name..."
            required
            sx={{ mt: 2 }}
            onKeyPress={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) {
                handleCreateFolder()
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setCreateFolderDialogOpen(false)
              setNewFolderName("")
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateFolder}
            disabled={!newFolderName.trim()}
            startIcon={<CreateNewFolderIcon />}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
