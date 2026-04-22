// src/components/InventoryEditDialog.tsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  CircularProgress,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useUpdateInventoryMutation } from "../inventoryApi";
import { useUpdateProductMutation } from "../../products/productsApi";
import { useGetProductGroupsQuery } from "../../product-groups/productGroupsApi";
import { useListUsersQuery } from "../../user/userApi";
import type { RootState } from "@/src/app/store";
import type { InventoryRow } from "./InventoryModel";
import { useTranslation } from "react-i18next";
export interface ProductOption {
  id: string;
  partNumberAU: string;
  description: string;
}
export interface WarehouseOption {
  id: number;
  name: string;
}

interface InventoryEditDialogProps {
  open: boolean;
  initialData: InventoryRow | null;
  onClose: () => void;
  onSaved?: () => void;
  products: ProductOption[];
  warehouses: WarehouseOption[];
}

export default function InventoryEditTableDialog({
  open,
  initialData,
  onClose,
  onSaved,
  products,
  warehouses,
}: InventoryEditDialogProps) {
  const operator = useSelector((state: RootState) => state.auth.user?.name ?? "unknown");
  const [form, setForm] = useState<Partial<InventoryRow & { partGroup: string }>>({});
  const [updateInventory, { isLoading }] = useUpdateInventoryMutation();
  const [updateProduct, { isLoading: isUpdatingProduct }] = useUpdateProductMutation();
  const { data: productGroups = [] } = useGetProductGroupsQuery();
  const { data: users = [] } = useListUsersQuery();
  const [error, setError] = useState<string | null>(null);
   const { t } = useTranslation();
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        productID: initialData.productID,
        warehouseID: initialData.warehouseID,
        siteLocation: initialData.siteLocation,
        actualQty: initialData.actualQty,
        lockedQty: initialData.lockedQty,
        partGroup: initialData.partGroup || "",
        operator: initialData.operator || operator,
      });
    }
  }, [initialData]);

  if (!initialData) return null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name.endsWith("Qty") ? Number(value) : value,
    }));
  }

  async function handleSave() {
    setError(null);
    if (!form.productID || !form.warehouseID) {
      setError(t('editandcreateColumns.requiredMessage'));
      return;
    }
    try {
      // 更新库存信息
      await updateInventory({
        id: initialData?.id,
        productID: form.productID as string,
        warehouseID: form.warehouseID as number,
        siteLocation: form.siteLocation ?? "",
        actualQty: form.actualQty as number,
        lockedQty: form.lockedQty as number,
        operator: form.operator ?? operator,
        operationTime: new Date().toISOString(),
      }).unwrap();

      // 如果 partGroup 有变化，同时更新产品的 groupId
      if (form.partGroup !== initialData?.partGroup && form.productID) {
        const selectedGroup = productGroups.find(g => g.name === form.partGroup);
        if (selectedGroup) {
          await updateProduct({
            id: form.productID,
            groupId: selectedGroup.id,
          }).unwrap();
        }
      }

      onSaved?.();
      onClose();
    } catch (e: any) {
      setError(e?.data?.error || t('editandcreateColumns.updateFailed'));
    }
  }

  return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
        >
        <DialogTitle>{t('editandcreateColumns.edit')}</DialogTitle>
        <Box sx={{marginTop:2}}>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 ,zIndex:1400}}>
            <TextField
            select
            label={t('editandcreateColumns.product')}
            name="productID"
            value={form.productID ?? ''}
            onChange={handleChange}
            fullWidth
            required
            sx={{MarginTop:20}}
            >
            {products.map(prod => (
                <MenuItem key={prod.id} value={prod.id}>
                {prod.partNumberAU} - {prod.description}
                </MenuItem>
            ))}
            </TextField>
            <TextField
            select
            label={t('editandcreateColumns.warehouse')}
            name="warehouseID"
            value={form.warehouseID ?? ''}
            onChange={handleChange}
            fullWidth
            required
            >
            {warehouses.map(wh => (
                <MenuItem key={wh.id} value={wh.id}>
                {wh.name}
                </MenuItem>
            ))}
            </TextField>
            <TextField
            label={t('editandcreateColumns.siteLocation')}
            name="siteLocation"
            value={form.siteLocation ?? ''}
            onChange={handleChange}
            fullWidth
            />
            <TextField
            label={t('editandcreateColumns.actualQty')}
            name="actualQty"
            type="number"
            value={form.actualQty ?? 0}
            onChange={handleChange}
            fullWidth
            required
            />
            <TextField
            label={t('editandcreateColumns.lockedQty')}
            name="lockedQty"
            type="number"
            value={form.lockedQty ?? 0}
            onChange={handleChange}
            fullWidth
            />
            <TextField
            select
            label={t('inventoryColumns.partGroup')}
            name="partGroup"
            value={form.partGroup ?? ''}
            onChange={handleChange}
            fullWidth
            >
            {productGroups.map(group => (
                <MenuItem key={group.id} value={group.name}>
                {group.name}
                </MenuItem>
            ))}
            </TextField>
            <TextField
            select
            label={t('editandcreateColumns.operator')}
            name="operator"
            value={form.operator ?? operator}
            onChange={handleChange}
            fullWidth
            >
            {users.filter(u => u.isActive).map(u => (
                <MenuItem key={u.id} value={u.fullName}>
                {u.fullName}
                </MenuItem>
            ))}
            </TextField>
            <TextField
            label={t('editandcreateColumns.operationTime')}
            value={new Date(initialData.operationTime).toLocaleString()}
            InputProps={{ readOnly: true }}
            fullWidth
            />
            {error && <div style={{ color: 'red', fontSize: 14 }}>{error}</div>}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={isLoading || isUpdatingProduct}>
            {t('editandcreateColumns.cancel')}
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={isLoading || isUpdatingProduct}>
            {(isLoading || isUpdatingProduct)
                ? <CircularProgress size={20} />
                : t('editandcreateColumns.save')}
            </Button>
        </DialogActions>
        </Box>

        </Dialog>
  );
}
