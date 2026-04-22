// src/components/InventoryTable.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from 'react-redux'
import type { RootState } from '@/app/store'
import InventoryCreateDialog from "./InventoryCreateDialog.tsx";
import {
  Box,
  Backdrop,
  CircularProgress,
  Tooltip,
  Avatar,
  Typography,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  InputLabel,
  FormControl,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
} from "@mui/material";
import InventoryEditTableDialog from "./InventoryEditTableDialog.tsx";
import { alpha } from "@mui/material/styles";
import { useGetWarehousesQuery } from "../../warehouses/warehousesApi.ts";
import {
  useMaterialReactTable,
  MaterialReactTable,
  type MRT_TableInstance,
  type MRT_ColumnDef,
  type MRT_Row,
} from "material-react-table";
import {
  Info as InfoIcon,
  Storage,
  Delete as DeleteIcon,
  Edit,
  Bookmark,
  Add as AddIcon,
  Remove as RemoveIcon,
  FileDownload as FileDownloadIcon,
} from "@mui/icons-material";
import * as XLSX from "xlsx";
import { useTranslation } from "react-i18next";
import type { InventoryRow } from "./InventoryModel";
import { BarcodeSVG } from "../../barcodegenerator/BarcodeSVG";
import { useGetAllProductsQuery } from "../../products/productsApi.ts";
import { useGetInventoryByIdQuery, useGetInventoryQuery, useUpdateInventoryMutation, useDeleteInventoryMutation, useCreateInventoryMutation } from "../inventoryApi.ts";

import type { ProductOption, WarehouseOption } from "./InventoryCreateDialog.tsx";
import { useNavigate } from "react-router-dom";

interface InventoryTableProps {
  data: InventoryRow[];
  onRowDoubleClick?: (row: InventoryRow) => void;
  onInStock?: (row: InventoryRow) => void;
  onOutStock?: (row: InventoryRow) => void;
  onDeleteRow?: (row: InventoryRow) => void;
  showSnackBar?: (msg: string, severity?: 'success') => void;
  selectedWarehouse?: string;
  onWarehouseChange?: (warehouse: string) => void;
  warehouses?: { id: number; name: string }[];
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  data: propData,
  onRowDoubleClick,
  onInStock,
  onOutStock,
  onDeleteRow,
  showSnackBar,
  selectedWarehouse: propSelectedWarehouse,
  onWarehouseChange,
  warehouses: propWarehouses,
}) => {
  const LOW_STOCK_THRESHOLD = 1;
  const { t, i18n } = useTranslation();
  const navigator = useNavigate()
  const [createopen, setCreateOpen] = useState(false);
  // 如果传入了 data，使用传入的；否则自己查询
  const { data: queryData = [], isLoading } = useGetInventoryQuery();
  const tableData = propData || queryData;
  const [createInventory] = useCreateInventoryMutation();
  const [updateInventory] = useUpdateInventoryMutation();
  const [deleteInventory] = useDeleteInventoryMutation();
  const { data: products = [], isLoading: loadingProducts } = useGetAllProductsQuery();
  const { data: queryWarehouses = [], isLoading: loadingWarehouses } = useGetWarehousesQuery();
  const warehouses = propWarehouses || queryWarehouses;
  const [editRow, setEditRow] = useState<InventoryRow | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const productOptions: ProductOption[] = useMemo(
    () => products.map(p => ({
      id: p.id,
      partNumberAU: p.partNumberAU,
      description: p.description,
    })),
    [products]
  );
  const onCreatingRowSave = async ({ exitCreatingMode, values }: { exitCreatingMode: () => void; values: Partial<InventoryRow> }) => {
    try {
      if (typeof values.id !== 'number') {
        console.error('Missing id on values!', values);
        return;
      }
      const payload = { id: values.id, ...values };
      await updateInventory(payload).unwrap();

      exitCreatingMode();

    } catch (error) {
      console.error("Create failed:", error);
    }
  };

  const warehouseOptions: WarehouseOption[] = useMemo(
    () => warehouses.map(w => ({
      id: w.id,
      name: w.name,
    })),
    [warehouses]
  );

  const operator = useSelector((state: RootState) => state.auth.user?.name ?? 'unknown')
  const columns = useMemo<MRT_ColumnDef<InventoryRow>[]>(() => {
    const keys = [
      // "partNumberCN",
      "partNumberAU",
      "barcode",
      "description",
      "compatiblemodels",
      "descriptionChinese",
      "warehouse",
      "siteLocation",
      "asset",
      "customer",
      "note",
      "partGroup",
      "partLife",
      "oem",
      "purchasePrice",
      "unitPrice",
      "actualQty",
      "lockedQty",
      "availableQty",
      "operator",
      "operationTime",
    ] as const;
    return keys.map((key) => {
      if (key === "partNumberAU") {
        return (
          {
            accessorKey: 'partNumberAU',
            header: t('inventoryColumns.partNumberAU'),
            enableEditing: false,
          }
        )
      }
      if (key === "operator") {
        return (
          {
            accessorKey: 'operator',
            header: t('inventoryColumns.operator'),
            enableEditing: false,
          }
        )
      }
      if (key === "operationTime") {
        return (
          {
            accessorKey: 'operationTime',
            header: t('inventoryColumns.operationTime'),
            enableEditing: false,
            Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleString(),
          }
        )
      }
      if (key === "barcode") {
        return {
          accessorKey: key,
          enableEditing: false,
          header: t(`inventoryColumns.${key}`),
          size: 130,
          Cell: ({ row }) => (
            <BarcodeSVG value={row.original.partNumberAU} width={80} height={32} />
          ),
        };
      }
      if (key === "purchasePrice" || key === "unitPrice") {
        return {
          accessorKey: key,
          header: t(`inventoryColumns.${key}`),
          Cell: ({ cell }) => {
            const val = cell.getValue<number>();
            return val != null
              ? val.toLocaleString("en-US", {
                style: "currency",
                currency: "AUD",
              })
              : "";
          }

        };
      }
      if (
        key === "actualQty" ||
        key === "lockedQty" ||
        key === "availableQty"
      ) {
        return {
          accessorKey: key,
          header: t(`inventoryColumns.${key}`),
          size: 100,
          Cell: ({ cell }) => {
            const val = cell.getValue<number>();
            if (key === "availableQty") {
              const isLow = val < LOW_STOCK_THRESHOLD;
              return (
                <Tooltip
                  arrow
                  title={
                    isLow
                      ? t("inventoryColumns.lowStockWarning", {
                        threshold: LOW_STOCK_THRESHOLD,
                      })
                      : t("inventoryColumns.availableStock", { val })
                  }
                >
                  <Avatar
                    sx={{
                      bgcolor: isLow ? "error.main" : "success.main",
                      color: "#fff",
                      width: 48,
                      height: 48,
                      fontSize: "1rem",
                      fontWeight: "bold",
                      textAlign:'center',
                      margin:"0 auto"
                    }}
                  >
                    {val}
                  </Avatar>
                </Tooltip>
              );
            }
            return <Typography>{val}</Typography>;
          },
        };
      }
      return {
        accessorKey: key,
        header: t(`inventoryColumns.${key}`),
      };
    });
  }, [t]);

  // 导出选中项
  const handleExportSelected = (rows: MRT_Row<InventoryRow>[]) => {
    if (rows.length === 0) {
      showSnackBar?.("Please select items to export", "warning");
      return;
    }

    const exportData = rows.map(row => {
      const item = row.original;
      const stockStatus = item.availableQty > 0
        ? (item.availableQty < 5 ? "Low Stock" : "In Stock")
        : "Out of Stock";

      return {
        "Part Number (AU)": item.partNumberAU || "",
        "Part Number (CN)": item.partNumberCN || "",
        "Description": item.description || "",
        "Description (Chinese)": item.descriptionChinese || "",
        "Compatible Models": item.compatiblemodels || "",
        "Part Group": item.partGroup || "",
        "OEM": item.oem || "",
        "Asset": item.asset || "",
        "Warehouse": item.warehouse || "",
        "Site Location": item.siteLocation || "",
        "Stock Status": stockStatus,
        "Actual Qty": item.actualQty || 0,
        "Locked Qty": item.lockedQty || 0,
        "Available Qty": item.availableQty || 0,
        "Purchase Price": item.purchasePrice || 0,
        "Unit Price": item.unitPrice || 0,
        "Total Value": (item.availableQty || 0) * (item.unitPrice || 0),
        "Operator": item.operator || "",
        "Last Updated": item.operationTime ? new Date(item.operationTime).toLocaleString() : "",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Selected Inventory");

    const timestamp = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `Inventory_Selected_${rows.length}_items_${timestamp}.xlsx`);
    showSnackBar?.(`Exported ${rows.length} items successfully`);
  };

  const table = useMaterialReactTable({
    columns,
    data: tableData,
    enableColumnOrdering: false,
    enableRowActions: true,
    enableRowSelection: true,
    enableColumnPinning: true,
    enableEditing: false,
    editDisplayMode: "row",
    enableColumnActions: true,
    enableColumnFilters: true,
    enableColumnFilterModes: true,
    enableStickyHeader: true,
    enableStickyFooter: true,
    initialState: {
      showGlobalFilter: true,
      showColumnFilters: true,
      columnPinning: {
        left: ["mrt-row-select"],
        right: ["mrt-row-actions"],
      },
    },
    muiTableHeadCellProps:{
      sx:{
        paddingLeft:6
      }
    },
    paginationDisplayMode: "pages",
    muiPaginationProps: {
      showFirstButton: true,
      showLastButton: true,
      rowsPerPageOptions: [10, 20, 30],
      sx: (theme) => ({
        ul: {
          "& .MuiPaginationItem-root": {
            color: alpha(theme.palette.success.main, 0.88),
          },
          "& .Mui-selected": {
            backgroundColor: alpha(theme.palette.success.main, 0.3),
            color: theme.palette.common.white,
          },
          "& .MuiPaginationItem-root:hover": {
            backgroundColor: alpha(theme.palette.success.main, 0.15),
          },
        },
      }),
    },
    muiTablePaperProps: {
      sx: {
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        p: 0,
        overflow: "hidden",
        flexGrow: 1,
        td: { bgcolor: "#fff" },
      },
    },
    muiTableContainerProps: {
      sx: {
        minHeight: 0,
        height: "100%",
        p: 0,
        display: "flex",
        width: "100%",
        overflow: "auto",
      },
    },
    muiTableBodyCellProps:{
      sx:{
        textAlign:'center',
      }
    },
    renderRowActionMenuItems: ({ row, closeMenu }) => [
      <MenuItem
        key="editmanual"
        onClick={() => {
            setEditRow(row.original);
            setEditOpen(true);
            closeMenu();
        }}
      >
        <Edit color="info"   sx={{ mr: 1 }} />
        {t("inventoryColumns.edit")}
      </MenuItem>,
      <MenuItem
        key="transactions"
        onClick={() => {
          closeMenu();
          navigator(`/inventory/${row.original.id}/transactions`);
        }}
      >
        <Bookmark color="warning" sx={{ mr: 1 }} />
        {t("inventoryColumns.transactions")}
      </MenuItem>,
      <MenuItem
        key="in"
        onClick={() => {
          closeMenu();
          onInStock?.(row.original);

        }}
      >
        <Storage color="info" sx={{ mr: 1 }} />
        {t("inventoryColumns.inStock")}
      </MenuItem>,
      <MenuItem
        key="out"
        onClick={() => {
          closeMenu();
          onOutStock?.(row.original);
        }}
      >
        <Storage color="success" sx={{ transform: "scaleX(-1)", mr: 1 }} />
        {t("inventoryColumns.outStock")}
      </MenuItem>,
      <MenuItem
        key="delete"
        onClick={() => {
          closeMenu();
          onDeleteRow?.(row.original);
        }}
      >
        <DeleteIcon color="error" sx={{ mr: 1 }} />
        {t("inventoryColumns.delete")}
      </MenuItem>,
    ],
    renderTopToolbarCustomActions: ({ table }) => {
      const selectedRows = table.getSelectedRowModel().rows;
      return (
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => setCreateOpen(true)}>
            {t("inventoryColumns.createNew")}
          </Button>
          {selectedRows.length > 0 && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportSelected(selectedRows)}
            >
              Export Selected ({selectedRows.length})
            </Button>
          )}
        </Box>
      );
    },
    onCreatingRowSave: async ({ exitCreatingMode, values }) => {
      try {
        onCreatingRowSave({ exitCreatingMode, values })
      } catch (error) {
        // creation handled by onCreatingRowSave
      }
    },
    onCreatingRowCancel: () => {
      table.setCreatingRow(null)
    },
    onEditingRowSave: async ({ table, values, row }) => {
      const inventoryId = row.original.id;
      const updatePayload = {
        ...row._valuesCache,
      };
      updatePayload.id = inventoryId
      await updateInventory(updatePayload).unwrap();
      table.setEditingRow(null)
    },
    muiToolbarAlertBannerProps: { sx: { display: "none" } },
  });

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        minWidth: 0,
        width: "100%",
        height: "100%",
        paddingBottom: "1rem",
      }}
    >
      <Backdrop
        open={isLoading}
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <InventoryEditTableDialog 
        open={editOpen}
        initialData={editRow}
        products={productOptions}
        warehouses={warehouseOptions}
        onClose={() => setEditOpen(false)}
        onSaved={()=>{
          showSnackBar("Create Inventory Success")
        }}
      
      />
      <InventoryCreateDialog
        open={createopen}
        onClose={() => setCreateOpen(false)}
        products={productOptions}
        warehouses={warehouseOptions}
        onCreated={() => {
          setCreateOpen(false)
          showSnackBar("Create Inventory Success")
        }}
      />
      {tableData && <MaterialReactTable table={table} />}
    </Box>
  );
};

export default InventoryTable;
