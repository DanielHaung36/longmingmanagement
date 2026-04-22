import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  CardContent,
  CardActions,
  Button,
  Pagination,
  Stack,
  TextField,
} from "@mui/material";
import {
  Edit as EditIcon,
  Info as InfoIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import type { InventoryRow } from "./InventoryModel";
import { useTranslation } from "react-i18next"; // ① 引入i18n
import InventoryEditTableDialog from "./InventoryEditTableDialog";
import { useGetAllProductsQuery } from "../../products/productsApi";
import { useGetWarehousesQuery } from "../../warehouses/warehousesApi";
interface InventoryCardGridWithPaginationProps {
  rows: InventoryRow[];
  onEdit?: (row: InventoryRow) => void;
  onDetails?: (row: InventoryRow) => void;
  onInStock?: (row: InventoryRow) => void;
  onOutStock?: (row: InventoryRow) => void;
  itemsPerPage?: number;
}

const InventoryCardGridWithPagination: React.FC<InventoryCardGridWithPaginationProps> = ({
  rows,
  onEdit,
  onDetails,
  onInStock,
  onOutStock,
  itemsPerPage = 9,
}) => {
  const { t } = useTranslation(); // ② 获取t
   const navigator = useNavigate()
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [editRow, setEditRow] = useState<InventoryRow | null>(null);
  const [editOpen, setEditOpen] = useState<boolean>(false);
  const { data: allProducts = [] } = useGetAllProductsQuery();
  const { data: warehouses = [] } = useGetWarehousesQuery();
  const productOptions = allProducts.map((p) => ({ id: p.id, partNumberAU: p.partNumberAU ?? '', description: p.description ?? '' }));
  const warehouseOptions = warehouses.map((w) => ({ id: w.id, name: w.name }));

  // 增强搜索 - 支持多字段搜索
  const filteredRows = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    if (!searchTerm.trim()) return rows;
    const lower = searchTerm.trim().toLowerCase();
    return rows.filter((item) => {
      // 搜索匹配：图号、描述、中文描述、兼容型号、分类、OEM、客户、资产
      return (
        (item.partNumberAU && item.partNumberAU.toLowerCase().includes(lower)) ||
        (item.partNumberCN && item.partNumberCN.toLowerCase().includes(lower)) ||
        (item.description && item.description.toLowerCase().includes(lower)) ||
        (item.descriptionChinese && item.descriptionChinese.toLowerCase().includes(lower)) ||
        (item.compatiblemodels && item.compatiblemodels.toLowerCase().includes(lower)) ||
        (item.partGroup && item.partGroup.toLowerCase().includes(lower)) ||
        (item.oem && item.oem.toLowerCase().includes(lower)) ||
        (item.customer && item.customer.toLowerCase().includes(lower)) ||
        (item.asset && item.asset.toLowerCase().includes(lower)) ||
        (item.siteLocation && item.siteLocation.toLowerCase().includes(lower))
      );
    });
  }, [rows, searchTerm]);

  const pageCount = Math.ceil((filteredRows?.length || 0) / itemsPerPage);

  if (page > pageCount && pageCount > 0) {
    setPage(1);
  }

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageRows = filteredRows?.slice(startIndex, endIndex) || [];

  const placeholderCount = Math.max(0, itemsPerPage - (pageRows?.length || 0));

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const handleEditClick = (row: InventoryRow) => {
    setEditRow(row);
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditRow(null);
  };

  return (
    <Box
      component="div"
      sx={{
        px: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 4,
        width: "100%",
      }}
    >
      {/* 搜索框 - 支持多字段搜索 */}
      <Box sx={{ mb: 2, py:2, maxWidth: 500 }}>
        <TextField
          fullWidth
          size="small"
          label={t("inventoryCard.searchLabel") || "Search"}
          placeholder={t("inventoryCard.searchPlaceholderEnhanced") || "Search by part number, description, model, OEM, customer..."}
          value={searchTerm}
          onChange={handleSearchChange}
          helperText={t("inventoryCard.searchHelperText") || "Search: Part No, Description, Compatible Models, OEM, Customer, Asset"}
        />
      </Box>

      {/* 卡片区 */}
      <Box
        component="div"
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          mb: 2,
        }}
      >
        <Box
          component="div"
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
          }}
        >
          {/* 无数据提示 */}
          {pageRows.length === 0 && (
            <Box sx={{ gridColumn: "1 / -1", textAlign: "center", py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                {t("inventoryCard.noData") || "No inventory items found"}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {searchTerm ? (t("inventoryCard.tryDifferentSearch") || "Try a different search term") : (t("inventoryCard.noItems") || "No items in this view")}
              </Typography>
            </Box>
          )}

          {/* 当前页卡片 */}
          {pageRows.map((item) => (
            <Card
              key={item.id}
              sx={{
                minHeight: 200,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderRadius: 2,
                boxShadow: 1,
                transition: "transform 0.2s, boxShadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 3,
                },
              }}
            >
              {/* 卡片头部 */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography
                  variant="h6"
                  noWrap
                  sx={{
                    paddingLeft: "0.1rem",
                    flexGrow: 1,
                    fontWeight: 500,
                  }}
                >
                  {item.description}
                </Typography>
              </Box>

              {/* 卡片内容 */}
              <CardContent
                sx={{
                  flexGrow: 1,
                  px: 2,
                  py: 1,
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t("inventoryCard.partNumberAU")}</strong> {item.partNumberAU}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t("inventoryCard.descriptionChinese")}</strong> {item.descriptionChinese}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  <strong>{t("inventoryCard.asset")}</strong> {item.asset}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    mb: 0.5,
                    color:
                      item.availableQty === 0
                        ? "error.main"
                        : "text.primary",
                  }}
                >
                  <strong>{t("inventoryCard.availableQty")}</strong>{" "}
                  {item.availableQty === 0
                    ? t("inventoryCard.outOfStock")
                    : item.availableQty}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                >
                  <strong>{t("inventoryCard.warehouse")}</strong> {item.warehouse}
                </Typography>
              </CardContent>

              {/* 卡片底部按钮 - 2x2: In+Out / Edit+Details */}
              <CardActions sx={{ p: 1.5, pt: 1, flexDirection: "column", gap: 0.75 }}>
                {/* Row 1: primary actions */}
                <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => onInStock && onInStock(item)}
                  >
                    In
                  </Button>
                  <Button
                    variant="contained"
                    color="warning"
                    size="small"
                    fullWidth
                    startIcon={<RemoveIcon />}
                    onClick={() => onOutStock && onOutStock(item)}
                    disabled={item.availableQty <= 0}
                  >
                    Out
                  </Button>
                </Box>
                {/* Row 2: secondary actions */}
                <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    fullWidth
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    fullWidth
                    startIcon={<InfoIcon />}
                    onClick={() => { navigator(`/inventory/${item.id}/transactions`); }}
                  >
                    Details
                  </Button>
                </Box>
              </CardActions>
            </Card>
          ))}

          {/* 占位卡 */}
          {Array.from({ length: placeholderCount }).map((_, idx) => (
            <Card
              key={`placeholder-${idx}`}
              sx={{
                height: 200,
                visibility: "hidden",
              }}
            />
          ))}
        </Box>
      </Box>

      {/* 分页 */}
      {pageCount > 1 && (
        <Box sx={{ py: 2 }}>
          <Stack alignItems="center">
            <Pagination
              count={pageCount}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </Box>
      )}

      {/* 编辑对话框 */}
      <InventoryEditTableDialog
        open={editOpen}
        initialData={editRow}
        products={productOptions}
        warehouses={warehouseOptions}
        onClose={handleEditClose}
        onSaved={handleEditClose}
      />

    </Box>
  );
};

export default InventoryCardGridWithPagination;
