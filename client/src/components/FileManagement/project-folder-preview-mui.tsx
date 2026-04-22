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
  Alert,
  Tooltip,
  Divider,
  Stack,
  Tabs,
  Tab,
  Breadcrumbs,
  Link,
  CircularProgress,
} from "@mui/material"
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
  CloudQueue as OneDriveIcon,
  Computer as LocalIcon,
  ArrowUpward as ArrowUpIcon,
  LaunchOutlined as LaunchIcon,
} from "@mui/icons-material"
import { useToast } from "@/components/ui/use-toast"
import {
  useBrowseFolderContentsQuery,
  useUploadFileToFolderMutation,
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

interface ProjectFolderPreviewProps {
  projectId: number
  clientCompany?: string
  mineSiteName?: string
  localFolderPath?: string | null
  oneDriveFolderPath?: string | null
  onRefresh?: () => void
}

export function ProjectFolderPreviewMUI({
  projectId,
  clientCompany,
  mineSiteName,
  localFolderPath,
  oneDriveFolderPath,
  onRefresh,
}: ProjectFolderPreviewProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<"local" | "onedrive">("onedrive")
  const [currentPath, setCurrentPath] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isElectronApp, setIsElectronApp] = useState(false)

  // Check if running in Electron on mount
  useEffect(() => {
    setIsElectronApp(isElectron())
  }, [])

  // Determine the current browsing path
  const browsePath = currentPath || (activeTab === "local" ? localFolderPath : oneDriveFolderPath) || ""

  // Fetch folder contents
  const {
    data: folderData,
    isLoading: folderLoading,
    refetch: refetchFolder,
  } = useBrowseFolderContentsQuery(
    {
      path: browsePath,
      isOneDrive: activeTab === "onedrive"
    },
    { skip: !browsePath }
  )

  // Upload mutation
  const [uploadFile] = useUploadFileToFolderMutation()

  const currentFolderData: FolderContent | null = folderData?.data || null

  const handleTabChange = (_event: React.SyntheticEvent, newValue: "local" | "onedrive") => {
    setActiveTab(newValue)
    setCurrentPath("") // Reset path when switching tabs
  }

  const handleFolderClick = (folderPath: string) => {
    setCurrentPath(folderPath)
  }

  const handleBreadcrumbClick = (breadcrumbPath: string) => {
    setCurrentPath(breadcrumbPath)
  }

  const handleGoBack = () => {
    if (!currentFolderData || currentFolderData.breadcrumbs.length <= 1) return

    // Get parent directory (second to last breadcrumb)
    const parentCrumb = currentFolderData.breadcrumbs[currentFolderData.breadcrumbs.length - 2]
    setCurrentPath(parentCrumb.path)
  }

  const handleRefresh = () => {
    refetchFolder()
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

    await uploadFiles(selectedFiles)
  }

  const uploadFiles = async (files: FileList) => {
    setUploading(true)
    try {
      const formData = new FormData()

      // Add all files
      Array.from(files).forEach((file) => {
        formData.append("file", file)
      })

      // Add metadata
      formData.append("targetPath", currentFolderData?.path || browsePath || "")
      formData.append("isOneDrive", activeTab === "onedrive" ? "true" : "false")
      formData.append("projectId", projectId.toString())

      await uploadFile(formData).unwrap()

      toast({
        title: "Success",
        description: `${files.length} file(s) uploaded successfully`,
      })

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
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(true)
  }, [])

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
      if (files.length > 0) {
        await uploadFiles(files)
      }
    },
    [currentFolderData, activeTab, projectId]
  )

  // File download handler
  const handleDownload = async (file: FileItem) => {
    try {
      const downloadUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/folders/download?path=${encodeURIComponent(file.path)}`

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

  // Check if folders exist
  const hasLocalFolder = !!localFolderPath
  const hasOneDriveFolder = !!oneDriveFolderPath

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
              Project Folder Browser
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {clientCompany && mineSiteName && `${clientCompany} / ${mineSiteName}`}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || !currentFolderData}
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
        </Stack>

        {/* OneDrive Header - Local tab hidden */}
        <Box sx={{ mt: 2, pb: 1, borderBottom: 1, borderColor: "divider" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <OneDriveIcon fontSize="small" color="primary" />
            <Typography variant="subtitle1" fontWeight="medium">
              OneDrive Files
            </Typography>
            {!hasOneDriveFolder && (
              <Chip label="Not Created" size="small" color="warning" sx={{ height: 20, fontSize: "0.7rem" }} />
            )}
          </Stack>
        </Box>
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
              {currentFolderData.breadcrumbs.map((crumb, index) => (
                <Link
                  key={index}
                  component="button"
                  variant="body2"
                  onClick={() => handleBreadcrumbClick(crumb.path)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    textDecoration: "none",
                    color: index === currentFolderData.breadcrumbs.length - 1 ? "text.primary" : "primary.main",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {index === 0 && <HomeIcon fontSize="small" sx={{ mr: 0.5 }} />}
                  {crumb.name}
                </Link>
              ))}
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
        {folderLoading ? (
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
        ) : !browsePath ? (
          <Box
            sx={{
              p: 8,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            <FolderIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
            <Typography variant="h6" color="text.secondary">
              Folder not created
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              The {activeTab === "local" ? "local" : "OneDrive"} project folder will be created when the project is approved
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
              Folder not found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              The {activeTab === "local" ? "local" : "OneDrive"} folder does not exist
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
              Drag and drop files here or click "Upload Files"
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
                  onClick={() => item.type === "folder" && handleFolderClick(item.path)}
                >
                  <ListItemIcon>{getFileIcon(item)}</ListItemIcon>

                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight={item.type === "folder" ? 600 : 500}>
                        {item.name}
                      </Typography>
                    }
                    secondary={
                      <Stack direction="row" spacing={1} alignItems="center" mt={0.5}>
                        {item.type === "file" && item.size && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(item.size)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                          </>
                        )}
                        {item.modifiedAt && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(item.modifiedAt).toLocaleDateString()}
                          </Typography>
                        )}
                        {item.type === "folder" && (
                          <Chip
                            label="Folder"
                            size="small"
                            sx={{ height: 20, fontSize: "0.7rem" }}
                          />
                        )}
                      </Stack>
                    }
                    secondaryTypographyProps={{ component: "div" }}
                  />

                  {item.type === "file" && (
                    <ListItemSecondaryAction>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Copy Path">
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(item.path)
                              toast({
                                title: "Copied",
                                description: "File path copied to clipboard",
                              })
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownload(item)}>
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
    </Paper>
  )
}
