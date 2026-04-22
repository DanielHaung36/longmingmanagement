import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import type { InventoryRow } from './components/InventoryModel';
import { useTranslation } from 'react-i18next';

type DialogMode = 'in' | 'out' | null;

interface StockDialogProps {
  mode: DialogMode;
  product: InventoryRow | null;
  open: boolean;
  onClose: () => void;
  onSuccess: (updated: Partial<InventoryRow>) => void;
}

export const StockDialog: React.FC<StockDialogProps> = ({
  mode,
  product,
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [qty, setQty] = useState(1);
  const [remark, setRemark] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    severity: 'success' | 'error';
    message: string;
  }>({ open: false, severity: 'success', message: '' });

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setQty(1);
      setRemark('');
    }
  };

  const handleConfirm = async () => {
    if (!product) return;
    setIsSubmitting(true);
    const url = mode === 'in' ? '/api/stock/in' : '/api/stock/out';
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          qty,
          remark: remark || undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.message || t('dialog.operationFailed'));
      }
      const updated = (await resp.json()) as Partial<InventoryRow>;
      onSuccess(updated);
      setSnackbar({
        open: true,
        severity: 'success',
        message: t('dialog.stockOperationSuccess', {
          mode: mode === 'in' ? t('dialog.inbound') : t('dialog.outbound'),
          qty: updated.availableQty
        }),
      });
      handleClose();
    } catch (error: any) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQtyInvalid =
    !product || qty < 1 || qty > product.availableQty;

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ m: 0, p: 2 }}>
          <Typography variant="h6">
            {mode === 'in' ? t('dialog.inbound') : t('dialog.outbound')} — {product?.product}
          </Typography>
          <IconButton
            aria-label={t('dialog.close')}
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
            disabled={isSubmitting}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {/* 数量输入 */}
          <TextField
            label={t('dialog.quantity')}
            type="number"
            fullWidth
            margin="normal"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            error={isQtyInvalid}
            helperText={
              product
                ? t('dialog.availableStock', { qty: product.availableQty })
                : ''
            }
            inputProps={{
              min: 1,
              max: product?.availableQty,
            }}
            disabled={isSubmitting}
          />

          {/* 备注输入 */}
          <TextField
            label={t('dialog.remark')}
            multiline
            rows={2}
            fullWidth
            margin="normal"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={isSubmitting}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={isSubmitting}>
            {t('dialog.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={isQtyInvalid || isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={20} />
              ) : undefined
            }
          >
            {t('dialog.confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 成功/失败提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};
