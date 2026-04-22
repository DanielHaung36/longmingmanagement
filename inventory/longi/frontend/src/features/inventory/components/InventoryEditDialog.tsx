// src/components/InventoryEditDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import type { InventoryRow } from "./InventoryModel";
import { useTranslation } from "react-i18next";

interface InventoryEditDialogProps {
  /** 是否打开对话框 */
  open: boolean;
  /** 当前要编辑的那一行记录；如果为 null 则对话框显示空白 */
  row: InventoryRow | null;
  /** 点击"取消"或关闭时触发 */
  onClose: () => void;
  /** 点击"保存"时，把修改后的整行数据传给父组件 */
  onSave: (updatedRow: InventoryRow) => void;
}

const InventoryEditDialog: React.FC<InventoryEditDialogProps> = ({
  open,
  row,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  // 本地维护两个字段，用户在对话框中可以修改
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [actualQty, setActualQty] = useState<number>(0);

  // 当 row 变化时，把对应的值填到文本框
  useEffect(() => {
    if (row) {
      setAvailableQty(row.availableQty);
      setActualQty(row.actualQty);
    } else {
      // 如果 row 为 null，则清空
      setAvailableQty(0);
      setActualQty(0);
    }
  }, [row]);

  const handleSaveClick = () => {
    if (!row) return;
    // 构造一个全新的 InventoryRow 对象，把两个数值替换掉
    const updated: InventoryRow = {
      ...row,
      availableQty,
      actualQty,
    };
    onSave(updated);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t("dialog.editInventory")} – {row?.product || t("dialog.newInventory")}
      </DialogTitle>
      <DialogContent>
        <TextField
          label={t("dialog.availableQty")}
          type="number"
          fullWidth
          margin="dense"
          value={availableQty}
          onChange={(e) => setAvailableQty(Number(e.target.value))}
        />
        <TextField
          label={t("dialog.actualQty")}
          type="number"
          fullWidth
          margin="dense"
          sx={{ mt: 2 }}
          value={actualQty}
          onChange={(e) => setActualQty(Number(e.target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("dialog.cancel")}</Button>
        <Button variant="contained" onClick={handleSaveClick}>
          {t("dialog.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryEditDialog;
