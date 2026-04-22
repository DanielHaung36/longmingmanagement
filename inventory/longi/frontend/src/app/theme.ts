// src/app/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    // 默认的 h4 样式
    h4: {
      fontSize: '32px',
      lineHeight: '44px',
      fontWeight: 700,
      textTransform: 'none',     // 不自动大写
      color: 'rgb(19,21,35)',
    },
    // 全局按钮文字
    button: {
      textTransform: 'none',
      fontWeight: 700,
      fontSize: '16px',
      lineHeight: '24px',
    },
  },
  components: {
    // 全局 Typography 样式覆盖
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'rgb(19,21,35)',
          textDecoration: 'none',
          whiteSpace: 'break-spaces',
        },
      },
    },
    // 全局 Link
    MuiLink: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, Arial, sans-serif',
          textDecoration: 'none',
          color: 'rgb(19,21,35)',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    // 全局 Button
    MuiButton: {
      styleOverrides: {
        root: {
          fontFamily: 'Inter, Arial, sans-serif',
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
