import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductQuery, useUpdateProductMutation, type Product } from "./productsApi";
import { useGetProductGroupsQuery } from "../product-groups/productGroupsApi";

// 字段 label 映射 - 适配产品模型
const FIELD_LABELS: Record<string, string> = {
  partNumberAU: "Part Number (AU)",
  partNumberCN: "Part Number (CN)",
  description: "Description",
  descriptionChinese: "Chinese Description",
  compatiblemodels: "Compatible Models",
  groupId: "Part Group",
  customer: "Customer",
  asset: "Asset",
  oem: "OEM",
  partLife: "Part Life",
  purchasePrice: "Purchase Price",
  unitPrice: "Unit Price",
  note: "Note",
};

const FIELDS_TO_SHOW = [
  "partNumberAU",
  "partNumberCN",
  "description",
  "descriptionChinese",
  "compatiblemodels",
  "groupId",
  "customer",
  "asset",
  "oem",
  "partLife",
  "purchasePrice",
  "unitPrice",
  "note",
];

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 从API获取产品数据
  const { data: product, isLoading, isError } = useGetProductQuery(id || "");
  const [updateProduct, { isLoading: isSaving }] = useUpdateProductMutation();
  const { data: productGroups = [] } = useGetProductGroupsQuery();

  const [form, setForm] = useState<Partial<Product>>({});

  // 当产品数据加载完成后，初始化表单
  useEffect(() => {
    if (product) {
      setForm(product);
    }
  }, [product]);

  // 统一处理表单变化
  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // 保存到API
  const handleSave = async () => {
    if (!id) return;
    try {
      await updateProduct({ id, ...form }).unwrap();
      navigate(`/products/${id}`);
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !product) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography color="error">Failed to load product</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2,overflow:'auto' }}>
      {/* 面包屑 & 返回 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Breadcrumbs>
          <Link underline="hover" color="inherit" href="#">
            Inventory
          </Link>
          <Link underline="hover" color="inherit" href="#">
            Products
          </Link>
          <Typography color="text.primary">Edit Product</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={()=>{
            navigate(-1)
        }}>
          Back
        </Button>
      </Box>

      {/* 主信息区 */}
      <Card sx={{ display: "flex", p: 3, mb: 3, borderRadius: 3, boxShadow: 2, alignItems: "center" }}>
        {/* 产品图片 */}
        <Box sx={{
          width: 180, height: 180, display: "flex", alignItems: "center",
          justifyContent: "center", bgcolor: "#f4f4f6", borderRadius: 2, mr: 3
        }}>
          <BrokenImageIcon sx={{ fontSize: 80, color: "#bbb" }} />
        </Box>
        {/* 主参数 */}
        <Box sx={{ flex: 1 }}>
          <TextField
            label="Description"
            value={form.description || ""}
            onChange={e => handleChange("description", e.target.value)}
            size="small"
            sx={{ mb: 1 }}
            fullWidth
          />
          <TextField
            label="Part Number (AU)"
            value={form.partNumberAU || ""}
            disabled
            size="small"
            sx={{ mb: 1 }}
            fullWidth
          />
          {(form.groupName || form.partGroup) && (
            <Chip label={form.groupName || form.partGroup} color="primary" size="small" sx={{ mr: 1, fontSize: 13 }} />
          )}
          <TextField
            label="Unit Price"
            type="number"
            value={form.unitPrice || ""}
            onChange={e => handleChange("unitPrice", parseFloat(e.target.value) || 0)}
            size="small"
            sx={{ mt: 2, fontWeight: 600 }}
            InputProps={{ startAdornment: <span style={{ color: "#16b157", marginRight: 4 }}>$</span> }}
            fullWidth
          />
        </Box>
      </Card>

      {/* 表单区域 */}
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 2 }}>
        <Typography variant="h6" gutterBottom>
          Edit Product Info
        </Typography>
        <Box
          display="grid"
          gridTemplateColumns={{
            xs: "1fr",
            sm: "1fr 1fr",
            md: "1fr 1fr 1fr"
          }}
          gap={2}
        >
          {FIELDS_TO_SHOW.map((key) => {
            // Part Group 下拉选择
            if (key === "groupId") {
              return (
                <Box key={key} sx={{ display: "flex", flexDirection: "column", p: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>
                    {FIELD_LABELS[key]}
                  </Typography>
                  <TextField
                    select
                    size="small"
                    value={form.groupId != null ? String(form.groupId) : ""}
                    onChange={e => {
                      const val = e.target.value;
                      handleChange("groupId", val ? Number(val) : undefined);
                    }}
                    fullWidth
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {productGroups.map(g => (
                      <MenuItem key={g.id} value={String(g.id)}>{g.name}</MenuItem>
                    ))}
                  </TextField>
                </Box>
              );
            }
            // 价格
            if (key.includes("price")) {
              return (
                <Box key={key} sx={{ display: "flex", flexDirection: "column", p: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>
                    {FIELD_LABELS[key]}
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    InputProps={{ startAdornment: <span style={{ color: "#16b157", marginRight: 4 }}>$</span> }}
                    fullWidth
                  />
                </Box>
              );
            }
            // 默认文本
            return (
              <Box key={key} sx={{ display: "flex", flexDirection: "column", p: 1 }}>
                <Typography variant="subtitle2" sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}>
                  {FIELD_LABELS[key]}
                </Typography>
                <TextField
                  size="small"
                  value={form[key] || ""}
                  onChange={e => handleChange(key, e.target.value)}
                  fullWidth
                />
              </Box>
            );
          })}
        </Box>
        <Box sx={{ textAlign: "right", mt: 3 }}>
          <Button
            startIcon={<SaveIcon />}
            onClick={handleSave}
            variant="contained"
            size="large"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
