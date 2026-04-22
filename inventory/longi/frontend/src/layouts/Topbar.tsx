// src/layouts/TopBar.tsx
import { memo } from 'react';
import type { FC } from 'react';
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export interface TopBarProps {
  open: boolean;
  onToggle: () => void;
}

const EXPANDED_DRAWER_UNITS = 30;  // 30 * 8px = 240px
const COLLAPSED_DRAWER_UNITS = 8;  // 8  * 8px =  64px

const TopBar: FC<TopBarProps> = memo(({ open, onToggle }) => {
  // 根据 open 决定 AppBar 的宽度和左侧间距
  const theme = useTheme();
  // 在组件内部
  const { i18n } = useTranslation();
 // 通过 theme.spacing 计算出实际像素值（字符串带单位）
  const expandedW = theme.spacing(EXPANDED_DRAWER_UNITS);
  const collapsedW = theme.spacing(COLLAPSED_DRAWER_UNITS);
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
       // xs 小屏幕下全宽；sm 以上根据 open 计算 left margin 和 width
        ml: { xs: 0, sm: open ? expandedW : collapsedW },
       width: {
          xs: '100%',
          sm: `calc(100% - ${open ? expandedW : collapsedW})`,
        },
        // 整个 Bar 高度 4rem
        height: '4rem',
        transition: theme.transitions.create(['width', 'margin'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
<Toolbar sx={{ justifyContent: 'space-between' }}>
  {/* 左侧：菜单折叠 + Logo */}
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <IconButton edge="start" onClick={onToggle} sx={{ mr: 2 }}>
      {open ? <MenuOpenIcon /> : <MenuIcon />}
    </IconButton>
    <Typography variant="h6" sx={{ fontWeight: 700 }}>
      LONGi
    </Typography>
  </Box>

  {/* 右侧：搜索、通知、语言切换、个人中心 */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* 语言切换 */}
    <ToggleButtonGroup
      size="small"
      value={i18n.language}
      exclusive
      onChange={(_, lang) => lang && i18n.changeLanguage(lang)}
      sx={{ '& .MuiToggleButton-root': { px: 1.5, textTransform: 'none' } }}
    >
      <ToggleButton value="en">EN</ToggleButton>
      <ToggleButton value="cn">中</ToggleButton>
    </ToggleButtonGroup>
    
    <IconButton><SearchOutlinedIcon /></IconButton>
    <IconButton><NotificationsOutlinedIcon /></IconButton>



    <IconButton><AccountCircle /></IconButton>
  </Box>
</Toolbar>
    </AppBar>
  );
});

TopBar.displayName = 'TopBar';
export default TopBar;
    