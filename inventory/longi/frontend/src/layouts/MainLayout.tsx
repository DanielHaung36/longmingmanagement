import { memo, useState } from "react";
import type {ReactNode } from "react";
import { Outlet } from "react-router-dom";
import {
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Toolbar,
  useTheme,
} from "@mui/material";
import TopBar from "./Topbar";
import SideBar from "./Sidebar";

export interface IProps {
  children?: ReactNode;
  //...这里定义相关类型
  //扩展相关属性
}
const theme = createTheme({
  typography: {
    fontFamily: "Inter, Arial, sans-serif",
    h4: {
      fontSize: 32,
      lineHeight: "44px",
      fontWeight: 700,
    },
    body1: {
      fontSize: 16,
      lineHeight: "24px",
    },
  },
  palette: {
    background: {
      default: "#F5F6FA",
      paper: "#FFFFFF",
    },
    primary: {
      main: "#1E5EFF",
      dark: "#154FCC", // 你也可以自定义 dark
      contrastText: "#FFFFFF", // 选中后文字/图标颜色
    },
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          // 当 ListItemButton 的 `selected` prop 为 true 时，Mui 会自动加 .Mui-selected
          "&.Mui-selected": {
            backgroundColor: "#1E5EFF", // 选中背景，等同于 theme.palette.primary.main
            color: "#FFFFFF", // 选中文本
            "& .MuiListItemIcon-root": {
              color: "#FFFFFF", // 选中图标
            },
          },
          "&.Mui-selected:hover": {
            backgroundColor: "#154FCC", // 选中悬停更深，等同于 theme.palette.primary.dark
          },
          // 非选中项悬停
          "&:not(.Mui-selected):hover": {
            backgroundColor: "rgba(30, 94, 255, 0.08)", // 可用 theme.palette.primary.main + alpha
          },
        },
      },
    },
    MuiCollapse: {
      defaultProps: {
        timeout: 0,
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
       MuiIconButton: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiCheckbox: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiRadio: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    MuiSwitch: {
      defaultProps: {
        disableRipple: true,
        disableTouchRipple: true,
      },
    },
    // 禁用所有 Tooltip、Popover、Collapse、Fade、Grow、Slide 动画
    MuiTooltip: {
      defaultProps: {
        TransitionComponent: undefined,
      },
    },
    MuiPopover: {
      defaultProps: {
        TransitionComponent: undefined, // 禁用动画
        transitionDuration: 0, // 禁用动画时长
      },
    },
    MuiMenu: {
      defaultProps: {
        TransitionComponent: undefined,
        transitionDuration: 0,
      },
    },
  },
});

const EXPANDED_UNITS = 30; // 30 * 8px = 240px
const COLLAPSED_UNITS = 8; // 8 * 8px  =  64px

const MainLayout = memo(() => {
  const [open, setOpen] = useState(true);
  const muiTheme = useTheme();
  const expandedWidth = muiTheme.spacing(EXPANDED_UNITS);
  const collapsedWidth = muiTheme.spacing(COLLAPSED_UNITS);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 用一个全屏 flex 容器包住整个布局 */}
      <Box sx={{ display: "flex", height: "100vh"}}>
        <TopBar open={open} onToggle={() => setOpen((o) => !o)} />
        <SideBar open={open} onToggle={() => setOpen((o) => !o)} />

        {/* 主区：flexGrow 撑满剩余 */}
        <Box
          mt={"4rem"}
          component="main"
          sx={{
            flexGrow: 1,
            p: "0 4",
            display: "flex",
            bgcolor: theme.palette.background.paper,
            flexDirection: "column",
            transition: muiTheme.transitions.create(["margin"], {
              easing: muiTheme.transitions.easing.sharp,
              duration: muiTheme.transitions.duration.leavingScreen,
            }),
            overflow: "hidden",
            minWidth: 0, // ✅ 允许子元素水平缩小
            height: `calc(100% - 4rem)`,
            width: "100%",
          }}
        >
          {/* 可选占位 AppBar */}
          {/* 1. 固定 4rem 高度的 Header */}
          {/* 这个区域才真正滚动 */}
          <Box
            sx={{
              flexGrow: 1, // 占据剩余垂直空间
              display: "flex", // 关键：让它成为flex容器
              flexDirection: "column", // 关键：使其子元素（Outlet渲染的页面）可以flexGrow
              minHeight: 0, //关键：允许在flex列布局中内容收缩以适应滚动
              overflow:'auto'
            }}
          >
            <Outlet />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
});

export default MainLayout;
MainLayout.displayName = "MainLayout"; //方便以后调试使用
