// src/components/InventoryDialogs.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Drawer,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { InventoryRow } from "./InventoryModel";
import { useUpdateInventoryMutation } from "../inventoryApi";
import { useTranslation } from "react-i18next";
/**
 * InventoryDialogsProps：父组件传入的属性
 */
interface InventoryDialogsProps {
  /** "入库" 或 "出库" 模式, null 表示关闭 */
  mode: "in" | "out" | null;
  /** 当前要操作的库存行 */
  product: InventoryRow | null;
  /** 关闭对话框 */
  onClose: () => void;
  /**
   * 确认入库/出库后回调
   * @param mode "in" 或 "out"
   * @param qty  入/出库数量
   */
  onConfirm: (mode: "in" | "out", qty: number) => void;
  /**
   * 打开"详情"抽屉
   * @param product - 要查看详情的库存行
   */
  onOpenDrawer: (product: InventoryRow) => void;
  /** 关闭"详情"抽屉 */
  onCloseDrawer: () => void;
  /** 传入当前要在 Drawer 中展示的库存行数据 */
  drawerData: InventoryRow | null;
}

const InventoryDialogs: React.FC<InventoryDialogsProps> = ({
  mode,
  product,
  onClose,
  onConfirm,
  onOpenDrawer,
  onCloseDrawer,
  drawerData,
}) => {
  const { t } = useTranslation();
  // 本地状态：入库/出库数量
  const [qty, setQty] = useState<number>(0);

  // 当 mode 从 null -> "in" / "out" 时，重置 qty
  useEffect(() => {
    if (mode) {
      setQty(0);
    }
  }, [mode]);



  return (
    <>
      {/* —— 入库/出库 Dialog —— */}
      <Dialog open={mode === "in" || mode === "out"} onClose={onClose}
      fullWidth={true}
      sx={
        {
         
        }
      }
      >
        <DialogTitle>
          {mode === "in" ? t("dialog.inbound") : t("dialog.outbound")} - {product?.description}
          <IconButton
            aria-label={t("dialog.close")}
            onClick={onClose}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" gutterBottom>
            {t("inventoryColumns.description")}：<strong>{product?.descriptionChinese}</strong>
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t("inventoryColumns.asset")}: {product?.asset}
          </Typography>
          <Typography variant="body1" gutterBottom>
            {t("inventoryColumns.availableQty")}：{product?.availableQty}
          </Typography>
          <TextField
            label={mode === "in" ? t("dialog.inbound") : t("dialog.outbound")}
            type="number"
            fullWidth
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            sx={{ mt: 2 }}
            inputProps={{ min: 0 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("dialog.cancel")}</Button>
          <Button
            variant="contained"
            color={mode === "in" ? "success" : "error"}
            onClick={() => {
              onConfirm(mode!, qty);
            }}
          >
            {t("dialog.confirm")} {mode === "in" ? t("dialog.inbound") : t("dialog.outbound")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* —— 右侧详情 Drawer —— */}

    </>
  );
};

export default InventoryDialogs;
