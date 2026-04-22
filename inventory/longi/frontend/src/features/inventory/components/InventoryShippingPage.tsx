import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useTranslation } from "react-i18next";

interface ShippingFormData {
  fromWarehouse: string;
  toWarehouse: string;
  productId: string;
  quantity: number;
  shippingMethod: string;
  trackingNumber: string;
  notes: string;
}

const InventoryShippingPage: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ShippingFormData>({
    fromWarehouse: "",
    toWarehouse: "",
    productId: "",
    quantity: 0,
    shippingMethod: "",
    trackingNumber: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {t("shipping.title")}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t("shipping.fromWarehouse")}</InputLabel>
                <Select
                  name="fromWarehouse"
                  value={formData.fromWarehouse}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fromWarehouse: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="warehouse1">{t("shipping.warehouse1")}</MenuItem>
                  <MenuItem value="warehouse2">{t("shipping.warehouse2")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t("shipping.toWarehouse")}</InputLabel>
                <Select
                  name="toWarehouse"
                  value={formData.toWarehouse}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      toWarehouse: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="warehouse1">{t("shipping.warehouse1")}</MenuItem>
                  <MenuItem value="warehouse2">{t("shipping.warehouse2")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t("shipping.productId")}
                name="productId"
                value={formData.productId}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label={t("shipping.quantity")}
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t("shipping.method")}</InputLabel>
                <Select
                  name="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      shippingMethod: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="ground">{t("shipping.ground")}</MenuItem>
                  <MenuItem value="air">{t("shipping.air")}</MenuItem>
                  <MenuItem value="sea">{t("shipping.sea")}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t("shipping.trackingNumber")}
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label={t("shipping.notes")}
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                {t("shipping.submit")}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default InventoryShippingPage