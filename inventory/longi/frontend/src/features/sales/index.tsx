// src/pages/Sales.tsx
import React, { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
  Tooltip,
  useTheme,
  alpha,
  Paper,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  type GridColDef,
  type GridRowId,
  type GridRowParams,
} from "@mui/x-data-grid";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";

interface SalesRow {
  id: number;
  orderId: string;
  customerName: string;
  company: string;
  model: string;
  orderType: string;
  mineralType: string;
  orderDate: string;
  phone: string;
  email: string;
  totalAmount: number;
}

const ORDER_TYPES = ["选矿", "实验", "售后报价", "其他"];
const MINERAL_TYPES = ["铜矿", "铁矿", "锂矿", "其他"];

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ justifyContent: "space-between", px: 1 }}>
      <GridToolbarQuickFilter
        quickFilterParser={(searchInput) => searchInput.split(/\s+/)}
        debounceMs={300}
        placeholder="搜索客户/订单号/公司..."
      />
    </GridToolbarContainer>
  );
}

const Sales: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [sales, setSales] = useState<SalesRow[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [current, setCurrent] = useState<Partial<SalesRow>>({});

  useEffect(() => {
    setSales([
      {
        id: 1,
        orderId: "LNG-2025001",
        customerName: "张三",
        company: "长江矿业有限公司",
        model: "MX-5000",
        orderType: "选矿",
        mineralType: "铜矿",
        orderDate: "2025-05-01",
        phone: "138-0000-0001",
        email: "zhangsan@changjiangkuang.com",
        totalAmount: 56000,
      },
      {
        id: 2,
        orderId: "LNG-2025002",
        customerName: "李四",
        company: "华东试验设备厂",
        model: "EX-200",
        orderType: "实验",
        mineralType: "铁矿",
        orderDate: "2025-05-02",
        phone: "138-0000-0002",
        email: "lisi@huadongtest.com",
        totalAmount: 7500,
      },
      {
        id: 3,
        orderId: "LNG-2025003",
        customerName: "王五",
        company: "南方售后服务中心",
        model: "SA-1200",
        orderType: "售后报价",
        mineralType: "锂矿",
        orderDate: "2025-05-03",
        phone: "139-1111-1113",
        email: "wangwu@nanfangservice.com",
        totalAmount: 42000,
      },
    ]);
  }, []);

  const handleEdit = (row: SalesRow) => {
    setDialogMode("edit");
    setCurrent(row);
    setDialogOpen(true);
  };

  const handleDelete = (id: GridRowId) => {
    setSales((prev) => prev.filter((row) => row.id !== id));
  };

  const handleSave = () => {
    const { id, ...rest } = current;
    if (!rest.orderId || !rest.customerName || !rest.orderDate || !rest.totalAmount) {
      alert("请填写完整信息");
      return;
    }
    if (dialogMode === "create") {
      const newId = sales.length ? Math.max(...sales.map((s) => s.id)) + 1 : 1;
      setSales([...sales, { id: newId, ...rest } as SalesRow]);
    } else {
      setSales((prev) => prev.map((r) => (r.id === id ? { id: id!, ...rest } as SalesRow : r)));
    }
    setDialogOpen(false);
    setCurrent({});
  };

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "orderId", headerName: "订单号", flex: 1 },
      { field: "customerName", headerName: "客户姓名", flex: 1 },
      { field: "company", headerName: "客户公司", flex: 1.5 },
      { field: "model", headerName: "机型", flex: 1 },
      { field: "orderType", headerName: "订单类型", flex: 1 },
      { field: "mineralType", headerName: "矿种", flex: 1 },
      { field: "orderDate", headerName: "下单日期", flex: 1 },
      {
        field: "totalAmount",
        headerName: "订单金额",
        flex: 1,
        valueFormatter: (params) => `¥${params}`,
      },
      { field: "phone", headerName: "联系电话", flex: 1 },
      { field: "email", headerName: "邮箱", flex: 1.5 },
      {
        field: "actions",
        headerName: "操作",
        type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={<EditIcon color="primary" />} label="编辑" onClick={() => handleEdit(params.row)} />,
          <GridActionsCellItem
            icon={<DeleteIcon color="error" />} label="删除" onClick={() => handleDelete(params.id)} />,
        ],
      },
    ],
    []
  );

  return (
    <Box sx={{ backgroundColor: theme.palette.background.paper, height: "100%", display: "flex", flexDirection: "column", flex: 1 }}>
      <Paper sx={{ p: 2, backgroundColor: theme.palette.background.paper, display: "flex",  flexDirection: "column", flex: 1,}}>
        <Header title="Sales Management" subtitle="Manage customer orders and sales details" />
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setDialogMode("create");
              setCurrent({});
              setDialogOpen(true);
            }}
          >
            新增销售
          </Button>
        </Box>
        <Box sx={{
          flex: 1, minHeight: 0 
        }}>
          <DataGrid
            sx={{
              backgroundColor: theme.palette.background.paper,
              // boxShadow: 1,
              borderRadius: 2,
              border: `1px solid ${alpha(colors.grey[300], 0.2)}`,
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: theme.palette.background.paper,
                borderBottom: `1px solid ${alpha(colors.grey[300], 0.5)}`,
              },
              "& .MuiDataGrid-cell": {
                borderBottom: `1px solid ${alpha(colors.grey[300], 0.5)}`,
              },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.background.paper,
              },
              "& .MuiDataGrid-footerContainer": {
                backgroundColor: theme.palette.background.paper,
              },
              // 让 DataGrid 100% 填满父盒子的高度
              height: "100%",
            }}
            rows={sales}
            columns={columns}
            showToolbar
            filterMode="client" // 使用客户端过滤
          />
        </Box>
        <Dialog  open={dialogOpen} onClose={() => setDialogOpen(false)} 
          fullWidth={false}       // 关闭全宽
          sx={{  width: "auto", minWidth: 300, maxWidth: "90vw"  }} // 确保 Dialog 宽度适应内容
          >
          <DialogTitle>{dialogMode === "create" ? "新建销售记录" : "编辑销售记录"}</DialogTitle>
          <DialogContent
    sx={{
      display: "flex",
      flexDirection: "column",
      gap: 2,
      mt: 1,
      width: "auto",         // 或者去掉，继承 PaperProps 的 auto
    }}
  >
            {["orderId", "customerName", "company", "model", "phone", "email"].map((field) => (
              <TextField
                key={field}
                label={{
                  orderId: "订单号",
                  customerName: "客户姓名",
                  company: "客户公司",
                  model: "机型",
                  phone: "联系电话",
                  email: "邮箱",
                }[field]}
                value={(current as any)[field] || ""}
                onChange={(e) => setCurrent((prev) => ({ ...prev, [field]: e.target.value }))}
                fullWidth
              />
            ))}

            <TextField
              label="订单类型"
              select
              value={current.orderType || ""}
              onChange={(e) => setCurrent((prev) => ({ ...prev, orderType: e.target.value }))}
              fullWidth
            >
              {ORDER_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="矿种"
              select
              value={current.mineralType || ""}
              onChange={(e) => setCurrent((prev) => ({ ...prev, mineralType: e.target.value }))}
              fullWidth
            >
              {MINERAL_TYPES.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="下单日期"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={current.orderDate || ""}
              onChange={(e) => setCurrent((prev) => ({ ...prev, orderDate: e.target.value }))}
              fullWidth
            />

            <TextField
              label="订单金额"
              type="number"
              value={current.totalAmount || ""}
              onChange={(e) => setCurrent((prev) => ({ ...prev, totalAmount: parseFloat(e.target.value) }))}
              fullWidth
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} variant="contained">保存</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Sales;
