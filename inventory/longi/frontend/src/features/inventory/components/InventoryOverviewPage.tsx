// src/pages/InventoryOverviewPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Backdrop,
  CircularProgress,
  Container,
  IconButton,
  Tooltip,
  Fade,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
  TextField,
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { useGetWarehousesQuery } from "../../warehouses/warehousesApi";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import Snackbar, { type SnackbarOrigin } from '@mui/material/Snackbar';
import {
  TableView as TableViewIcon,
  Apps as AppsIcon,
} from "@mui/icons-material";
import type { InventoryRow } from "../components/InventoryModel";
import { useTheme } from '@mui/material/styles';
import { useTranslation } from "react-i18next";
import type { AlertColor } from "@mui/material";

import InventoryTable from "../components/InventoryTable";
import InventoryCardGridWithPagination from "../components/InventoryCardGrid";
import InventoryDialogs from "../components/InventoryDialogs";
import Header from "../../../components/Header";
import DetailDrawer from "./InventoryDrawer";
import { useCreateInventoryMutation, useUpdateInventoryMutation, useDeleteInventoryMutation, useStockInMutation, useStockOutMutation, useGetInventoryQuery } from "../inventoryApi.ts";
/**
 * InventoryOverviewPage：展示"库存总览"页面，
 * 支持"表格视图"与"卡片视图"切换，
 * 并管理所有与库存相关的 CRUD 逻辑。
 */
const InventoryOverviewPage: React.FC = () => {
  // 0. 全局加载状态
  // const [loading, setLoading] = useState<boolean>(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertColor>('success');
  const { t } = useTranslation();
  const {
  data: inventoryList = [],   // data 改名为 inventoryList，默认空数组
  isLoading: loading,         // isLoading 改名为 loading
  isSuccess,
  error,
} = useGetInventoryQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const [updateInventory] = useUpdateInventoryMutation();

  // 仓库过滤状态 - 默认 Australia - Perth
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("Australia - Perth");
  // 分类过滤状态
  const [selectedPartGroup, setSelectedPartGroup] = useState<string>("all");
  // 型号过滤状态
  const [selectedModel, setSelectedModel] = useState<string>("all");

  // 获取所有分类和型号选项
  const partGroups = useMemo(() => {
    return [...new Set(inventoryList.map(item => item.partGroup).filter(Boolean))];
  }, [inventoryList]);

  const compatibleModels = useMemo(() => {
    return [...new Set(inventoryList.map(item => item.compatiblemodels).filter(Boolean))];
  }, [inventoryList]);

  // 根据仓库、分类、型号过滤数据
  const filteredInventoryList = useMemo(() => {
    return inventoryList.filter(item => {
      const matchWarehouse = selectedWarehouse === "all" || item.warehouse === selectedWarehouse;
      const matchPartGroup = selectedPartGroup === "all" || item.partGroup === selectedPartGroup;
      const matchModel = selectedModel === "all" || item.compatiblemodels === selectedModel;
      return matchWarehouse && matchPartGroup && matchModel;
    });
  }, [inventoryList, selectedWarehouse, selectedPartGroup, selectedModel]);

  // 最近活动记录 - 根据当前筛选条件，按操作时间排序，取最近10条
  const recentActivities = useMemo(() => {
    return [...filteredInventoryList]
      .filter(item => item.operationTime)
      .sort((a, b) => new Date(b.operationTime).getTime() - new Date(a.operationTime).getTime())
      .slice(0, 10);
  }, [filteredInventoryList]);

  // 统计数据
  const stats = useMemo(() => {
    const totalItems = filteredInventoryList.length;
    const lowStock = filteredInventoryList.filter(item => item.availableQty > 0 && item.availableQty < 5).length;
    const outOfStock = filteredInventoryList.filter(item => item.availableQty === 0).length;
    const totalValue = filteredInventoryList.reduce((sum, item) => sum + (item.availableQty * (item.unitPrice || 0)), 0);
    return { totalItems, lowStock, outOfStock, totalValue };
  }, [filteredInventoryList]);

  // 控制看板显示
  const [showActivityPanel, setShowActivityPanel] = useState(true);

  // 导出对话框状态
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportWarehouse, setExportWarehouse] = useState<string>("current"); // current, all, 或具体仓库
  const [exportPartGroup, setExportPartGroup] = useState<string>("current");
  const [exportFormat, setExportFormat] = useState<"xlsx" | "csv">("xlsx");
  const [exportStockFilter, setExportStockFilter] = useState<string>("all"); // all, inStock, lowStock, outOfStock

  // 获取导出数据
  const getExportData = () => {
    let dataToExport = inventoryList;

    // 仓库筛选
    if (exportWarehouse === "current") {
      dataToExport = dataToExport.filter(item =>
        selectedWarehouse === "all" || item.warehouse === selectedWarehouse
      );
    } else if (exportWarehouse !== "all") {
      dataToExport = dataToExport.filter(item => item.warehouse === exportWarehouse);
    }

    // 分类筛选
    if (exportPartGroup === "current") {
      dataToExport = dataToExport.filter(item =>
        selectedPartGroup === "all" || item.partGroup === selectedPartGroup
      );
    } else if (exportPartGroup !== "all") {
      dataToExport = dataToExport.filter(item => item.partGroup === exportPartGroup);
    }

    // 库存状态筛选
    if (exportStockFilter === "inStock") {
      dataToExport = dataToExport.filter(item => item.availableQty >= 5);
    } else if (exportStockFilter === "lowStock") {
      dataToExport = dataToExport.filter(item => item.availableQty > 0 && item.availableQty < 5);
    } else if (exportStockFilter === "outOfStock") {
      dataToExport = dataToExport.filter(item => item.availableQty === 0);
    }

    return dataToExport;
  };

  // Excel/CSV 导出函数
  const handleExportExcel = (dataOverride?: InventoryRow[], format?: "xlsx" | "csv") => {
    const dataToExport = dataOverride || getExportData();
    const fileFormat = format || exportFormat;

    if (dataToExport.length === 0) {
      showSnackbar("No data to export", "warning");
      return;
    }

    const exportData = dataToExport.map(row => {
      const stockStatus = row.availableQty > 0
        ? (row.availableQty < 5 ? "Low Stock" : "In Stock")
        : "Out of Stock";

      return {
        "Part Number (AU)": row.partNumberAU || "",
        "Part Number (CN)": row.partNumberCN || "",
        "Description": row.description || "",
        "Description (Chinese)": row.descriptionChinese || "",
        "Compatible Models": row.compatiblemodels || "",
        "Part Group": row.partGroup || "",
        "OEM": row.oem || "",
        "Asset": row.asset || "",
        "Warehouse": row.warehouse || "",
        "Site Location": row.siteLocation || "",
        "Stock Status": stockStatus,
        "Actual Qty": row.actualQty || 0,
        "Locked Qty": row.lockedQty || 0,
        "Available Qty": row.availableQty || 0,
        "Purchase Price": row.purchasePrice || 0,
        "Unit Price": row.unitPrice || 0,
        "Total Value": (row.availableQty || 0) * (row.unitPrice || 0),
        "Operator": row.operator || "",
        "Last Updated": row.operationTime ? new Date(row.operationTime).toLocaleString() : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");

    // 调整列宽
    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 },
      { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
      { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
    ];
    ws["!cols"] = colWidths;

    const timestamp = new Date().toISOString().split("T")[0];
    const warehouseName = exportWarehouse === "current"
      ? (selectedWarehouse === "all" ? "All" : selectedWarehouse)
      : (exportWarehouse === "all" ? "All" : exportWarehouse);

    if (fileFormat === "csv") {
      const fileName = `Inventory_${warehouseName.replace(/\s+/g, "_")}_${timestamp}.csv`;
      XLSX.writeFile(wb, fileName, { bookType: "csv" });
    } else {
      const fileName = `Inventory_${warehouseName.replace(/\s+/g, "_")}_${timestamp}.xlsx`;
      XLSX.writeFile(wb, fileName);
    }

    setExportDialogOpen(false);
    showSnackbar(`Exported ${dataToExport.length} items successfully`);
  };

  const [deleteInventory, { isLoading }] = useDeleteInventoryMutation();
  const [stockIn] = useStockInMutation();
  const [stockOut] = useStockOutMutation();
  // 1. 库存列表
  // const [inventoryList, setInventoryList] = useState<InventoryRow[]>([]);

  // 2. 当前视图模式：false 表示「表格视图」，true 表示「卡片视图」
  const [isCardView, setIsCardView] = useState<boolean>(true);
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
  // 3. 入库/出库 Dialog 状态
  const [dialogMode, setDialogMode] = useState<"in" | "out" | null>(null);
  const [dialogProduct, setDialogProduct] = useState<InventoryRow | null>(null);
  // 4. 详情 Drawer
  const [drawerData, setDrawerData] = useState<InventoryRow | null>(null);
  const pos: SnackbarOrigin = { vertical: 'top', horizontal: 'center' }
  const [drawerOpen, setDrawerOpen] = useState(false);
  // 5. 页面初始化时，从后端拉取库存列表


  const handleEdit = (_row: InventoryRow) => {
    // TODO: implement edit
  };

  const handleDetails = (_row: InventoryRow) => {
    // TODO: implement details
  };

  const handleClose = (
    event: React.SyntheticEvent | Event,
  ) => {

    setSnackbarOpen(false);
  };


  /** 切换到"卡片视图"或"表格视图" */
  const handleToggleView = () => {
    setIsCardView((prev) => !prev);
  };

  /** 打开详情 Drawer */
  const handleOpenDetails = (row: InventoryRow) => {
    // navigate(`/products/${row.original.djj_code}`);
    setSelectedRow(row);
    setDrawerOpen(true);
  };

  /** 关闭详情 Drawer */
  const handleCloseDetails = () => {
    setDrawerData(null);
  };

  /** 点击"入库" */
  const handleInStock = async (row: InventoryRow) => {
    setDialogMode("in");
    setDialogProduct(row);

  };

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = React.useState(false);
  /** 点击"出库" */
  const handleOutStock = (row: InventoryRow) => {
    setDialogMode("out");
    setDialogProduct(row);
  };
  const [pendingDeleteRow, setPendingDeleteRow] = useState<InventoryRow | null>(null);
  const confirmDeleteRow = async () => {
    if (!pendingDeleteRow) return;
    try {
      const result = await deleteInventory(pendingDeleteRow.id).unwrap();
      if (result.success) {
        // setInventoryList((prev) => prev.filter((item) => item.id !== pendingDeleteRow.id));
        showSnackbar(`Delete ${pendingDeleteRow.description} Success`);
      } else {
        showSnackbar(`Delete ${pendingDeleteRow.description} failed`, "error");
      }
    } catch (e: any) {
      const errMsg = e?.data?.message || e?.data?.error || e?.message || "Unknown error";
      showSnackbar(`Failed to delete ${pendingDeleteRow.description}: ${errMsg}`, "error");
      
    } finally {
      setOpen(false);
      setPendingDeleteRow(null);
    }
  }
  /** 点击"删除" */
  const handleDeleteRow = async (row: InventoryRow) => {
    setPendingDeleteRow(row);
    setOpen(true)

  };

  /** 关闭入库/出库 Dialog */
  const handleDialogClose = () => {
    setDialogMode(null);
    setDialogProduct(null);
  };

  const showSnackbar = (msg: string, severity = 'success') => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }

  /**
   * 确认"入库"/"出库"
   * @param mode "in" 或 "out"
   * @param qty  要入库/出库的数量
   */
  const handleConfirmInOut = async (mode: "in" | "out", qty: number) => {
    if (!dialogProduct) return;
    try {
      if (mode === "in") {
        await stockIn({ inventory_id: dialogProduct.id, quantity: qty }).unwrap();
      } else {
        await stockOut({ inventory_id: dialogProduct.id, quantity: qty }).unwrap();
      }
      showSnackbar(`${mode === "in" ? "Stock In" : "Stock Out"} ${dialogProduct.description} Success`);
    } catch (e: any) {
      showSnackbar(e?.data?.message || `${mode === "in" ? "Stock In" : "Stock Out"} Error`, "error");
    }
    setDialogMode(null);
    setDialogProduct(null);
  };

  return (
    <>
      {/* 全局 Loading 遮罩 */}
      <Backdrop
        open={loading}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container
        maxWidth={false}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          minHeight: 0,
          p: 0,
          background: '#ffff'
        }}
      >
        <Snackbar open={snackbarOpen} autoHideDuration={2500} onClose={handleClose} anchorOrigin={pos}>
          <Alert
            onClose={handleClose}
            severity={snackbarSeverity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbarMsg}
          </Alert>
        </Snackbar>
        {/* 顶部：标题 + 工具栏 - 响应式布局 */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            mt: 2,
            px: 2,
            mb: 1,
            gap: 2,
          }}
        >
          <Header
            title="Inventory Overview"
            subtitle="Managing the Inventory items"
          />
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1, md: 2 },
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: { xs: "flex-start", md: "flex-end" },
            }}
          >
            {/* 仓库选择器 - 可搜索 */}
            <Autocomplete
              size="small"
              sx={{ minWidth: { xs: 120, sm: 150, md: 180 }, flex: { xs: 1, sm: "none" } }}
              options={["all", ...warehouses.map(wh => wh.name)]}
              value={selectedWarehouse}
              onChange={(_, newValue) => setSelectedWarehouse(newValue || "all")}
              getOptionLabel={(option) => option === "all" ? t("inventoryColumns.allWarehouses") : option}
              renderInput={(params) => (
                <TextField {...params} label={t("inventoryColumns.warehouse")} />
              )}
              disableClearable
            />

            {/* 分类选择器 - 可搜索 */}
            <Autocomplete
              size="small"
              sx={{ minWidth: { xs: 100, sm: 120, md: 150 }, flex: { xs: 1, sm: "none" } }}
              options={["all", ...partGroups]}
              value={selectedPartGroup}
              onChange={(_, newValue) => setSelectedPartGroup(newValue || "all")}
              getOptionLabel={(option) => option === "all" ? "All Groups" : option}
              renderInput={(params) => (
                <TextField {...params} label={t("inventoryColumns.partGroup")} />
              )}
              disableClearable
            />

            {/* 型号选择器 - 可搜索，小屏幕隐藏 */}
            <Autocomplete
              size="small"
              sx={{ minWidth: { xs: 100, sm: 120, md: 150 }, display: { xs: "none", sm: "flex" } }}
              options={["all", ...compatibleModels]}
              value={selectedModel}
              onChange={(_, newValue) => setSelectedModel(newValue || "all")}
              getOptionLabel={(option) => option === "all" ? "All Models" : option}
              renderInput={(params) => (
                <TextField {...params} label="Model" />
              )}
              disableClearable
            />

            {/* 导出按钮 */}
            <Button
              variant="outlined"
              color="success"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => setExportDialogOpen(true)}
              sx={{ display: { xs: "none", sm: "flex" } }}
            >
              Export
            </Button>
            {/* 小屏幕只显示图标 */}
            <IconButton
              color="success"
              onClick={() => setExportDialogOpen(true)}
              sx={{ display: { xs: "flex", sm: "none" } }}
            >
              <FileDownloadIcon />
            </IconButton>
            {/* 视图切换 */}
            <Tooltip title={isCardView ? "Switch to Table View" : "Switch to Card View"}>
              <IconButton onClick={handleToggleView}>
                {isCardView ? <TableViewIcon /> : <AppsIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 统计卡片区域 - 响应式布局 */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(4, 1fr)",
            },
            gap: 2,
            px: 2,
            mb: 2,
          }}
        >
          {/* 统计卡片 - 淡色背景 */}
          <Card sx={{ bgcolor: "#e3f2fd", border: "1px solid #90caf9" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle2" color="text.secondary">Total Items</Typography>
              <Typography variant="h4" fontWeight="bold" color="primary.main">{stats.totalItems}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#fff8e1", border: "1px solid #ffe082" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle2" color="text.secondary">Low Stock</Typography>
              <Typography variant="h4" fontWeight="bold" color="warning.dark">{stats.lowStock}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#ffebee", border: "1px solid #ef9a9a" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle2" color="text.secondary">Out of Stock</Typography>
              <Typography variant="h4" fontWeight="bold" color="error.main">{stats.outOfStock}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#e8f5e9", border: "1px solid #a5d6a7" }}>
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Typography variant="subtitle2" color="text.secondary">Total Value</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.dark">
                ${stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* 最近活动 - 横向滚动 */}
        {showActivityPanel && recentActivities.length > 0 && (
          <Box
            sx={{
              mx: 2,
              mb: 3,
              mt: 1,
              p: 2,
              border: "1px solid #e0e0e0",
              borderRadius: 2,
              bgcolor: "#fafafa",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
                Recent Activity
              </Typography>
              <Chip label="Live" size="small" color="success" sx={{ height: 18, fontSize: 10 }} />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                pb: 1.5,
                px: 0.5,
                "&::-webkit-scrollbar": { height: 6 },
                "&::-webkit-scrollbar-thumb": { bgcolor: "grey.300", borderRadius: 3 },
              }}
            >
              {recentActivities.map((item) => (
                <Card
                  key={item.id}
                  sx={{
                    minWidth: 220,
                    maxWidth: 240,
                    flexShrink: 0,
                    border: "1.5px solid #bdbdbd",
                    borderRadius: 2,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    bgcolor: "#ffffff",
                    "&:hover": {
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      borderColor: "#9e9e9e",
                    },
                  }}
                >
                  <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                      {item.availableQty > 0 ? (
                        <TrendingUpIcon color="success" sx={{ fontSize: 16 }} />
                      ) : (
                        <TrendingDownIcon color="error" sx={{ fontSize: 16 }} />
                      )}
                      <Typography variant="body2" fontWeight="600" noWrap sx={{ flex: 1 }}>
                        {item.partNumberAU || "N/A"}
                      </Typography>
                      <Chip
                        label={item.availableQty}
                        size="small"
                        color={item.availableQty === 0 ? "error" : item.availableQty < 5 ? "warning" : "success"}
                        sx={{ height: 18, fontSize: 10, minWidth: 32 }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", mb: 0.5 }}>
                      {item.description}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                      {item.operator} · {new Date(item.operationTime).toLocaleString("en-AU", {
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      })}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/** 2. 中间内容区：用 Fade 包裹，撑满剩余空间 **/}
        <Box
          sx={{
            flex: 1,
            position: "relative",
            overflow: "auto", // 允许滚动
            px: 2,
            minHeight: "500px", // 确保最小高度
          }}
        >
          {/*
            当 isCardView = false 时，让"表格视图"Fade in，否则 Fade out。
            同时利用 unmountOnExit，fade out 时会卸载节点，避免同时占位。
          */}
          <Fade in={!isCardView} timeout={400} unmountOnExit>
            <Box
              sx={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >

              <InventoryTable
                data={filteredInventoryList}
                onRowDoubleClick={handleOpenDetails}
                onInStock={handleInStock}
                onOutStock={handleOutStock}
                onDeleteRow={handleDeleteRow}
                showSnackBar={showSnackbar}
                selectedWarehouse={selectedWarehouse}
                onWarehouseChange={setSelectedWarehouse}
                warehouses={warehouses}
              />
            </Box>
          </Fade>

          {/*
            当 isCardView = true 时，卡片视图 Fade in，否则 Fade out。
          */}
          <Fade in={isCardView} timeout={400} unmountOnExit>
            <Box
              sx={{
                width: "100%",
                minHeight: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <InventoryCardGridWithPagination
                rows={filteredInventoryList}
                onEdit={handleEdit}
                onDetails={handleOpenDetails}
                onInStock={handleInStock}
                onOutStock={handleOutStock}
                itemsPerPage={9}
              />
            </Box>
          </Fade>
        </Box>

        <Dialog
          fullScreen={fullScreen}
          open={open}
          onClose={() => { setOpen(false) }}
          aria-labelledby="responsive-dialog-title"
        >
          <DialogTitle id="responsive-dialog-title">
            {t("dialog.confirmDelete")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {t("dialog.confirmDeleteMessage")}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={() => { setOpen(false) }}>
              {t("dialog.cancel")}
            </Button>
            <Button onClick={() => {
              confirmDeleteRow();
            }} autoFocus color="error">
              {t("dialog.delete")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 导出对话框 */}
        <Dialog
          open={exportDialogOpen}
          onClose={() => setExportDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FileDownloadIcon color="success" />
              Export Inventory
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              {/* 预览数量 */}
              <Alert severity="info" sx={{ py: 0.5 }}>
                {getExportData().length} items will be exported based on current filters
              </Alert>

              {/* 仓库选择 */}
              <FormControl fullWidth size="small">
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={exportWarehouse}
                  label="Warehouse"
                  onChange={(e) => setExportWarehouse(e.target.value)}
                >
                  <MenuItem value="current">
                    Current Filter ({selectedWarehouse === "all" ? "All Warehouses" : selectedWarehouse})
                  </MenuItem>
                  <MenuItem value="all">All Warehouses</MenuItem>
                  <Divider />
                  {warehouses.map(wh => (
                    <MenuItem key={wh.id} value={wh.name}>{wh.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 分类选择 */}
              <FormControl fullWidth size="small">
                <InputLabel>Part Group</InputLabel>
                <Select
                  value={exportPartGroup}
                  label="Part Group"
                  onChange={(e) => setExportPartGroup(e.target.value)}
                >
                  <MenuItem value="current">
                    Current Filter ({selectedPartGroup === "all" ? "All Groups" : selectedPartGroup})
                  </MenuItem>
                  <MenuItem value="all">All Groups</MenuItem>
                  <Divider />
                  {partGroups.map(group => (
                    <MenuItem key={group} value={group}>{group}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* 库存状态筛选 */}
              <FormControl fullWidth size="small">
                <InputLabel>Stock Status</InputLabel>
                <Select
                  value={exportStockFilter}
                  label="Stock Status"
                  onChange={(e) => setExportStockFilter(e.target.value)}
                >
                  <MenuItem value="all">All Items</MenuItem>
                  <MenuItem value="inStock">In Stock (Qty ≥ 5)</MenuItem>
                  <MenuItem value="lowStock">Low Stock (0 &lt; Qty &lt; 5)</MenuItem>
                  <MenuItem value="outOfStock">Out of Stock (Qty = 0)</MenuItem>
                </Select>
              </FormControl>

              {/* 导出格式 */}
              <FormControl fullWidth size="small">
                <InputLabel>Format</InputLabel>
                <Select
                  value={exportFormat}
                  label="Format"
                  onChange={(e) => setExportFormat(e.target.value as "xlsx" | "csv")}
                >
                  <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                  <MenuItem value="csv">CSV (.csv)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportExcel()}
              disabled={getExportData().length === 0}
            >
              Export {getExportData().length} Items
            </Button>
          </DialogActions>
        </Dialog>

        <DetailDrawer
          open={drawerOpen}
          row={selectedRow}
          onClose={() => setDrawerOpen(false)}
        />

        {/* 所有 Dialog 和 Drawer */}
        <InventoryDialogs
          mode={dialogMode}
          product={dialogProduct}
          onClose={handleDialogClose}
          onConfirm={handleConfirmInOut}
          onOpenDrawer={handleOpenDetails}
          onCloseDrawer={handleCloseDetails}
          drawerData={drawerData}
        />
      </Container>
    </>
  );
};

export default InventoryOverviewPage;
