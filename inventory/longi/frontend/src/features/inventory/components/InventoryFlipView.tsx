// src/components/InventoryFlipContainer.tsx
import React from "react";
import { Box, IconButton, Typography, Tooltip } from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import InventoryTable from "./InventoryTable";
import InventoryCardGridWithPagination from "./InventoryCardGrid";
import type { InventoryRow } from "./InventoryModel";
import { useTranslation } from "react-i18next";

interface InventoryFlipContainerProps {
  /** 完整的库存数据 */
  rows: InventoryRow[];
  /** 切换入库 / 出库 / 删除 / 详情 等回调（直接传给子组件） */
  onEdit?: (row: InventoryRow) => void;
  onDetails?: (row: InventoryRow) => void;
  onInStock?: (row: InventoryRow) => void;
  onOutStock?: (row: InventoryRow) => void;
  onDeleteRow?: (row: InventoryRow) => void;
}

/**
 * InventoryFlipContainer 负责：
 * - 按照 isCardView 为 false 或 true，将「表格视图」/「卡片视图」二者放在同一个容器里。
 * - 当点击右上角按钮时，切换 isCardView，触发 3D 翻转动画。
 */
const InventoryFlipContainer: React.FC<InventoryFlipContainerProps> = ({
  rows,
  onEdit,
  onDetails,
  onInStock,
  onOutStock,
  onDeleteRow,
}) => {
  // isCardView=false → 显示「表格视图」；isCardView=true → 显示「卡片视图」
  const [isCardView, setIsCardView] = React.useState(false);

  // 切换时只做布尔取反，触发翻转
  const handleToggle = () => setIsCardView((prev) => !prev);

  const { t } = useTranslation();

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        perspective: 1000,       // 3D 透视距离，可根据喜好调整
        bgcolor: "#f5f5f5",      // 容器背景（浅灰），也可改成浅米色 #faf3e0 或者其他
        borderRadius: 2,
        p: 2,
      }}
    >
      {/* —— 顶部切换按钮 —— */}
      <Box
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Typography sx={{ mr: 1, color: "#555555" }}>
          {isCardView ? "卡片视图" : "表格视图"}
        </Typography>
        <Tooltip title={isCardView ? t("view.list") : t("view.card")}>
          <IconButton
            onClick={handleToggle}
            size="large"
            sx={{
              bgcolor: "#ffffff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
              "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
            }}
          >
            {isCardView ? (
              <ViewListIcon color="primary" />
            ) : (
              <ViewModuleIcon color="primary" />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* —— 翻转容器 —— */}
      <Box
        sx={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
          transition: "transform 0.6s ease-in-out",
          transform: isCardView ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* —— 前面（Front）：表格视图 —— */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,                        // top:0; right:0; bottom:0; left:0
            backfaceVisibility: "hidden",   // 背面不可见
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <InventoryTable
            data={rows}
            onRowDoubleClick={onDetails}
            onInStock={onInStock}
            onOutStock={onOutStock}
            onDeleteRow={onDeleteRow}
          />
        </Box>

        {/* —— 后面（Back）：卡片视图 —— */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",   // 自身先翻 180°，才能和父容器一起对翻后正面朝人
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <InventoryCardGridWithPagination
            rows={rows}
            onEdit={onEdit}
            onDetails={onDetails}
            itemsPerPage={9}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryFlipContainer;
