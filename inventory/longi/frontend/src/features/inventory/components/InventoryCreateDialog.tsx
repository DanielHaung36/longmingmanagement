// src/components/InventoryCreateDialog.tsx

import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormHelperText,
} from "@mui/material";
import { useSelector } from "react-redux";
import { useCreateInventoryMutation } from "../inventoryApi";
import type { RootState } from "@/src/app/store";
import { useTranslation } from "react-i18next";
import type { InventoryRow } from "./InventoryModel";

export interface ProductOption {
    id: string;
    partNumberAU: string;
    description: string;
}

export interface WarehouseOption {
    id: string;
    name: string;
}

interface InventoryCreateDialogProps {
    open: boolean;
    onClose: () => void;
    onCreated: (inventory: Partial<InventoryRow>) => void;
    products: ProductOption[];
    warehouses: WarehouseOption[];
}

const InventoryCreateDialog: React.FC<InventoryCreateDialogProps> = ({
    open,
    onClose,
    onCreated,
    products,
    warehouses,
}) => {
    const operator = useSelector((state: RootState) => state.auth.user?.name ?? "unknown");
    const { t } = useTranslation();
    const [selectedProduct, setSelectedProduct] = useState("");
    const [selectedWarehouse, setSelectedWarehouse] = useState("");
    const [actualQty, setActualQty] = useState(0);
    const [error, setError] = useState("");

    const handleCreate = () => {
        if (!selectedProduct || !selectedWarehouse) {
            setError(t("editandcreateColumns.requiredMessage"));
            return;
        }

        const inventory: Partial<InventoryRow> = {
            productID: selectedProduct,
            warehouse: selectedWarehouse,
            actualQty,
            availableQty: actualQty,
            lockedQty: 0,
        };

        onCreated(inventory);
        handleClose();
    };

    const handleClose = () => {
        setSelectedProduct("");
        setSelectedWarehouse("");
        setActualQty(0);
        setError("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{t("editandcreateColumns.createNew")}</DialogTitle>
            <DialogContent>
                <FormControl fullWidth margin="normal" error={!!error}>
                    <InputLabel>{t("editandcreateColumns.product")}</InputLabel>
                    <Select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        label={t("editandcreateColumns.product")}
                    >
                        {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                                {product.partNumberAU} - {product.description}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>

                <FormControl fullWidth margin="normal" error={!!error}>
                    <InputLabel>{t("editandcreateColumns.warehouse")}</InputLabel>
                    <Select
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                        label={t("editandcreateColumns.warehouse")}
                    >
                        {warehouses.map((warehouse) => (
                            <MenuItem key={warehouse.id} value={warehouse.id}>
                                {warehouse.name}
                            </MenuItem>
                        ))}
                    </Select>
                    {error && <FormHelperText>{error}</FormHelperText>}
                </FormControl>

                <TextField
                    fullWidth
                    margin="normal"
                    label={t("editandcreateColumns.actualQty")}
                    type="number"
                    value={actualQty}
                    onChange={(e) => setActualQty(Number(e.target.value))}
                    inputProps={{ min: 0 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>{t("editandcreateColumns.cancel")}</Button>
                <Button onClick={handleCreate} variant="contained" color="primary">
                    {t("editandcreateColumns.save")}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InventoryCreateDialog;
