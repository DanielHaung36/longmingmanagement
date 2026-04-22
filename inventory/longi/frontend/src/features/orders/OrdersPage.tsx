import React, { useState, useMemo } from "react";
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, TextField,
  Typography, Tooltip, useTheme, alpha,
} from "@mui/material";
import {
  DataGrid, type GridColDef, type GridRowParams, GridActionsCellItem,
} from "@mui/x-data-grid";
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon, Info as InfoIcon } from "@mui/icons-material";
import {
  useGetOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  type OrderRow,
} from "@/features/orders/ordersApi";
import { daDK } from "@mui/x-date-pickers/locales";
import { useTranslation } from "react-i18next";

const ORDER_STATUS = ["pending", "shipped", "completed", "cancelled"];

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  // 1. 获取数据和 CRUD mutation
  const { data: orders = [], isLoading, isError, refetch } = useGetOrdersQuery();
  const [createOrder] = useCreateOrderMutation();
  const [updateOrder]= useUpdateOrderMutation();
  const [deleteOrder] = useDeleteOrderMutation();
  // 2. Dialog 表单状态
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentValues, setCurrentValues] = useState<Partial<OrderRow>>({});

  const theme = useTheme();

  // 3. 列定义
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "orderNumber", headerName: t('orders.orderNumber'), flex: 1, minWidth: 120 },
      { field: "customerName", headerName: t('orders.customerName'), flex: 1, minWidth: 150 },
      {
        field: "orderDate",
        headerName: t('orders.orderDate'),
        flex: 1,
        minWidth: 180,
        valueFormatter: (params) => new Date(params.value as string).toLocaleString(),
      },
      {
        field: "status",
        headerName: t('orders.status'),
        flex: 1,
        minWidth: 120,
        renderCell: (params) => {
          const val = params.value as string;
          let color: string = theme.palette.text.primary;
          if (val === t('orders.cancelled')) color = theme.palette.error.main;
          else if (val === t('orders.completed')) color = theme.palette.success.main;
          return <Typography sx={{ color }}>{val}</Typography>;
        },
      },
      {
        field: "totalAmount",
        headerName: t('orders.totalAmount'),
        flex: 1,
        minWidth: 120,
        valueFormatter: (params) =>
          (params.value as number)?.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
      },
      {
        field: "actions",
        type: "actions",
        headerName: t('orders.actions'),
        flex: 1,
        minWidth: 140,
        getActions: (params: GridRowParams<OrderRow>) => {
          const row: OrderRow = params.row;
          return [
            <GridActionsCellItem
              icon={
                <Tooltip title={t('orders.detail')}>
                  <InfoIcon color="primary" />
                </Tooltip>
              }
              label={t('orders.detail')}
              onClick={() => handleRowDoubleClick(row)}
              showInMenu={false}
              key="detail"
            />,
            <GridActionsCellItem
              icon={
                <Tooltip title={t('orders.edit')}>
                  <EditIcon color="action" />
                </Tooltip>
              }
              label={t('orders.edit')}
              onClick={() => handleOpenEditDialog(row)}
              showInMenu={false}
              key="edit"
            />,
            <GridActionsCellItem
              icon={
                <Tooltip title={t('orders.delete')}>
                  <DeleteIcon color="error" />
                </Tooltip>
              }
              label={t('orders.delete')}
              onClick={() => handleDelete(row.id)}
              showInMenu={false}
              key="delete"
            />,
          ];
        },
      },
    ],
    [theme, t]
  );

  // 4. 打开弹框（新建/编辑）
  const handleOpenCreateDialog = () => {
    setDialogMode("create");
     setCurrentValues({
      orderDate: new Date().toISOString(), // <--- 加这一行
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (row: OrderRow) => {
    setDialogMode("edit");
    setCurrentValues({ ...row });
    setOpenDialog(true);
  };

  // 5. 删除
  const handleDelete = async (id: string) => {
    if (!window.confirm(t('orders.confirmDelete'))) return;
    await deleteOrder(id);
    // 不用手动 refetch，RTK Query 会自动刷新列表
  };

  // 6. 取消弹框
  const handleDialogCancel = () => {
    setOpenDialog(false);
    setCurrentValues({});
  };

  // 7. 新建/编辑表单提交
  const handleDialogSave = async () => {
    const { orderNumber, customerName, orderDate, status, totalAmount, id } = currentValues;

    if (
      !orderNumber?.toString().trim() ||
      !customerName?.toString().trim() ||
      !orderDate ||
      typeof totalAmount !== "number"
    ) {
      alert(t('orders.fillAllFields'));
      return;
    }

    if (dialogMode === "create") {
      await createOrder({
        orderNumber: orderNumber.toString(),
        customerName: customerName.toString(),
        orderDate: orderDate as string,
        status: (status as string) || t('orders.pending'),
        totalAmount: totalAmount as number,
      });
    } else if (dialogMode === "edit") {
      await updateOrder({
        id,
        data: {
          orderNumber: orderNumber.toString(),
          customerName: customerName.toString(),
          orderDate: orderDate as string,
          status: (status as string) || t('orders.pending'),
          totalAmount: totalAmount as number,
        },
      });
    }

    setOpenDialog(false);
    setCurrentValues({});
    // RTK Query 会自动刷新
  };

  // 8. 表单字段变化
  const handleFieldChange = (field: keyof OrderRow, value: string | number) => {
    setCurrentValues((prev) => ({ ...prev, [field]: value }));
  };

  // 9. 详情弹窗
  const handleRowDoubleClick = (row: OrderRow) => {
    alert(
      `${t('orders.detail')}：\n${t('orders.orderNumber')}：${row.orderNumber}\n${t('orders.customer')}：${row.customerName}\n${t('orders.orderDate')}：${new Date(
        row.orderDate
      ).toLocaleString()}\n${t('orders.status')}：${t('orders.' + row.status)}\n${t('orders.totalAmount')}：$${row.totalAmount.toFixed(2)}`
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2, backgroundColor: theme.palette.background.paper }}>
      {/* 新增按钮 */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1, backgroundColor: theme.palette.background.paper }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          {t('orders.createOrder')}
        </Button>
      </Box>
      <Box
        sx={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          boxShadow: 2,
          borderRadius: 1,
          p: 2,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* DataGrid */}
        <Box sx={{ flexGrow: 1, minHeight: 0, backgroundColor: theme.palette.background.paper, display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            rows={orders}
            columns={columns}
            getRowId={(row) => row.id}
            showToolbar
            autoHeight
            loading={isLoading}
            onRowDoubleClick={(params: GridRowParams<OrderRow>) =>
              handleRowDoubleClick(params.row)
            }
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: theme.palette.grey[100],
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: alpha(theme.palette.primary.light, 0.1),
                cursor: "pointer",
              },
            }}
          />
        </Box>
        {/* Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleDialogCancel}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {dialogMode === "create" ? t('orders.createOrder') : t('orders.editOrder')}
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 1 }}>
            <Box
              component="form"
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                mt: 1,
              }}
            >
              {/* 订单号 */}
              <TextField
                label={t('orders.orderNumber')}
                variant="outlined"
                fullWidth
                value={currentValues.orderNumber || ""}
                onChange={(e) =>
                  handleFieldChange("orderNumber", e.target.value)
                }
                required
              />
              {/* 客户名称 */}
              <TextField
                label={t('orders.customerName')}
                variant="outlined"
                fullWidth
                value={currentValues.customerName || ""}
                onChange={(e) =>
                  handleFieldChange("customerName", e.target.value)
                }
                required
              />
              {/* 下单日期 */}
              <TextField
                label={t('orders.orderDate')}
                type="datetime-local"
                variant="outlined"
                fullWidth
                value={
                  currentValues.orderDate
                    ? new Date(currentValues.orderDate).toISOString().slice(0, 16)
                    : new Date().toISOString().slice(0, 16)
                }
                onChange={(e) =>
                  handleFieldChange(
                    "orderDate",
                    new Date(e.target.value).toISOString()
                  )
                }
                InputLabelProps={{ shrink: true }}
                required
              />
              {/* 订单状态 */}
              <TextField
                label={t('orders.status')}
                select
                variant="outlined"
                fullWidth
                value={currentValues.status || t('orders.pending')}
                onChange={(e) => handleFieldChange("status", e.target.value)}
              >
                {ORDER_STATUS.map((s) => (
                  <MenuItem key={s} value={t('orders.' + s)}>
                    {t('orders.' + s)}
                  </MenuItem>
                ))}
              </TextField>
              {/* 订单金额 */}
              <TextField
                label={t('orders.totalAmount') + " (USD)"}
                variant="outlined"
                type="number"
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
                value={currentValues.totalAmount ?? ""}
                onChange={(e) =>
                  handleFieldChange("totalAmount", parseFloat(e.target.value))
                }
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogCancel}>{t('orders.cancel')}</Button>
            <Button variant="contained" color="primary" onClick={handleDialogSave}>
              {t('orders.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default OrdersPage;
