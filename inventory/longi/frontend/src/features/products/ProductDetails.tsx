// src/pages/ProductDetailPage.tsx
import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Tabs,
  Tab,
  Grid,
  Button,
  Breadcrumbs,
  Link,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHead,
  Paper,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import DownloadIcon from "@mui/icons-material/CloudDownload";
import DeleteIcon from "@mui/icons-material/Delete";
import WarningIcon from "@mui/icons-material/WarningAmber";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProductQuery } from "./productsApi";
import { useGetInventoryQuery } from "../inventory/inventoryApi";

// 格式化显示（可根据实际补充）
function formatValue(key: string, val: any) {
  if (key.includes("price")) return `$${Number(val).toLocaleString()}`;
  if (key === "last_update") return new Date(val).toLocaleString();
  if (typeof val === "boolean") return val ? "Yes" : "No";
  return val ?? "-";
}

// 字段显示顺序 - 适配产品模型
const FIELDS_TO_SHOW = [
  "partNumberAU",
  "partNumberCN",
  "description",
  "descriptionChinese",
  "compatiblemodels",
  "partGroup",
  "customer",
  "asset",
  "oem",
  "partLife",
  "purchasePrice",
  "unitPrice",
  "note",
  "createdAt",
  "updatedAt",
];


// 字段 label 映射
const FIELD_LABELS: Record<string, string> = {
  partNumberAU: "Part Number (AU)",
  partNumberCN: "Part Number (CN)",
  description: "Description",
  descriptionChinese: "Chinese Description",
  compatiblemodels: "Compatible Models",
  partGroup: "Part Group",
  customer: "Customer",
  asset: "Asset",
  oem: "OEM",
  partLife: "Part Life",
  purchasePrice: "Purchase Price",
  unitPrice: "Unit Price",
  note: "Note",
  createdAt: "Created At",
  updatedAt: "Updated At",
  barcode: "Barcode",
  codeSeq: "Code Sequence",
  code: "Code",
};

// 页签名
const TAB_KEYS = [
  "basic",
  "inventory",
] as const;

const tabLabels = {
  basic: "Basic Info",
  inventory: "Inventory",
};

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<typeof TAB_KEYS[number]>("basic");
  const navigate = useNavigate();

  // 从API获取产品数据
  const { data: product, isLoading, isError } = useGetProductQuery(id || "");

  // 获取库存数据（按产品ID筛选）
  const { data: inventoryData = [] } = useGetInventoryQuery();
  const productInventory = inventoryData.filter(
    (inv) => inv.productID === id
  );

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
        <Typography color="error">Failed to load product details</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }
  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", my: 4, px: 2 ,overflow:'auto'}}>
      {/* 面包屑 & 返回 */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Breadcrumbs>
          <Link underline="hover" color="inherit" href="#">
            Inventory
          </Link>
          <Link underline="hover" color="inherit" href="#">
            Products
          </Link>
          <Typography color="text.primary">Product Detail</Typography>
        </Breadcrumbs>
        <Button startIcon={<ArrowBackIcon />} onClick={()=>{navigate(-1)}} variant="outlined">
          Back
        </Button>
      </Box>

      {/* 主信息区 */}
      <Card sx={{ display: "flex", p: 3, mb: 3, borderRadius: 3, boxShadow: 2, alignItems: "center" }}>
        {/* 产品图片 */}
        <Box sx={{ width: 180, height: 180, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f4f4f6", borderRadius: 2, mr: 3 }}>
          <BrokenImageIcon sx={{ fontSize: 80, color: "#bbb" }} />
        </Box>
        {/* 主参数 */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{product.description || product.partNumberAU}</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>Part Number: {product.partNumberAU}</Typography>
          {(product.groupName || product.partGroup) && (
            <Chip label={product.groupName || product.partGroup} color="primary" size="small" sx={{ mr: 1, fontSize: 13 }} />
          )}
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "success.main" }}>
            ${(product.unitPrice || 0).toLocaleString()}
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}><Typography variant="body2">Product ID: {product.id}</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">OEM: {product.oem || "-"}</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">Customer: {product.customer || "-"}</Typography></Grid>
            <Grid item xs={6}><Typography variant="body2">Last Update: {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "-"}</Typography></Grid>
          </Grid>
        </Box>
        <Box>
          <Button startIcon={<EditIcon />} variant="contained" color="primary" sx={{ minWidth: 100 }} onClick={()=>{
             navigate(`/products/edit/${product.id}`);
          }}>
            Edit
          </Button>
        </Box>
      </Card>

      {/* Tab 切换区 */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        {TAB_KEYS.map((key) => (
          <Tab key={key} label={tabLabels[key]} value={key} />
        ))}
      </Tabs>

      {/* 内容区 */}
      <Box>
        {tab === "basic" && (
          // 渲染
<Card sx={{ p: 3, mb: 2 }}>
  <Typography variant="h6" gutterBottom>
    Basic Info
  </Typography>
<Box
  display="grid"
  gridTemplateColumns={{
    xs: "1fr",        // 手机：一行一列
    sm: "1fr 1fr",    // 平板：一行两列
    md: "1fr 1fr 1fr" // 桌面：一行三列
  }}
  gap={2}
>
  {FIELDS_TO_SHOW.map((key) => (
    <Box
      key={key}
      sx={{
        display: "flex",
        flexDirection: "column",
        p: 1,
        borderRadius: 1,
        // 可选加点分割线/背景
        // bgcolor: "background.paper",
        // boxShadow: 1,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: "text.secondary", fontSize: 14, mb: 0.5 }}
      >
        {FIELD_LABELS[key] ?? key}
      </Typography>
      <Typography
        variant="body1"
        sx={{
          fontWeight: 500,
          color: key.includes("price") ? "success.main" : "text.primary",
        }}
      >
        {formatValue(key, product[key])}
      </Typography>
    </Box>
  ))}
</Box>
      </Card>
        )}

        {tab === "inventory" && (
           <Card sx={{ p: 3, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Inventory by Warehouse</Typography>
            {productInventory.length === 0 ? (
              <Typography color="text.secondary">No inventory records found for this product.</Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Warehouse</TableCell>
                    <TableCell>Site Location</TableCell>
                    <TableCell>Actual Qty</TableCell>
                    <TableCell>Locked Qty</TableCell>
                    <TableCell>Available Qty</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productInventory.map((inv, i) => (
                    <TableRow key={i}>
                      <TableCell>{inv.warehouse || "-"}</TableCell>
                      <TableCell>{inv.siteLocation || "-"}</TableCell>
                      <TableCell>{inv.actualQty}</TableCell>
                      <TableCell>{inv.lockedQty}</TableCell>
                      <TableCell>
                        {inv.availableQty < 5 && <WarningIcon color="error" sx={{ verticalAlign: "middle", mr: 1 }} />}
                        {inv.availableQty}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        )}
      </Box>
    </Box>
  );
}
