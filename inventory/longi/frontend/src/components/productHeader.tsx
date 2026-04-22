// src/components/TableHeader.tsx
import React from "react";
import {
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
} from "@mui/material";
import { tokens } from "../theme";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ViewModuleIcon from "@mui/icons-material/ViewModule";

interface TableHeaderProps {
  title: string;
  subtitle: string;
  isCardView: boolean;
  setIsCardView: (val: boolean) => void;
}

const TableHeader: React.FC<TableHeaderProps> = ({
  title,
  subtitle,
  isCardView,
  setIsCardView,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // 判断屏幕宽度
  const isSmall = useMediaQuery(theme.breakpoints.down("sm")); // 手机
  const isMedium = useMediaQuery(theme.breakpoints.between("sm", "md")); // 平板

  // 动态设置字号、间距等
  const getTitleVariant = () => {
    if (isSmall) return "h5";
    if (isMedium) return "h4";
    return "h4"; // 桌面
  };

  const getSubtitleVariant = () => {
    if (isSmall) return "body1";
    if (isMedium) return "h6";
    return "h6";
  };

  const getBoxMb = () => (isSmall ? "10px" : isMedium ? "15px" : "20px");
  const handleToggle = () => setIsCardView((prev) => !prev);

  return (
    <Box
      mb={getBoxMb()}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        // 如果你想让标题栏有固定背景色或阴影，可以加在这里：
        // backgroundColor: colors.primary[600],
        // boxShadow: 1,
        px: 2, // 左右内边距
        py: 1, // 上下内边距
      }}
    >
      {/** 左侧：标题 + 副标题，纵向排列 */}
      <Box
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          flexShrink: 1, // 防止文字过长把按钮挤出
          overflow: "hidden",
        }}
      >
        <Typography
          variant={getTitleVariant()}
          color={colors.grey[100]}
          fontWeight="bold"
          noWrap
          sx={{ lineHeight: 1.2 }}
        >
          {title}
        </Typography>
        <Typography
          variant={getSubtitleVariant()}
          color={colors.greenAccent[400]}
          sx={{
            fontWeight: isSmall ? 400 : 500,
            mt: "2px",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {subtitle}
        </Typography>
      </Box>

      {/** 右侧：切换按钮 */}
      <Box
        sx={{
          ml: 2, // 左侧留一点空隙
          flexShrink: 0,
        }}
      >
        <IconButton
          onClick={handleToggle}
          size="large"
          sx={{
            bgcolor: "#fff",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
            "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
          }}
          title={isCardView ? "切换到表格视图" : "切换到卡片视图"}
        >
          {isCardView ? (
            <TableRowsIcon color="primary" fontSize="inherit" />
          ) : (
            <ViewModuleIcon color="primary" fontSize="inherit" />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default TableHeader;
