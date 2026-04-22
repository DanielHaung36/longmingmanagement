"use client"

import { createTheme, ThemeProvider, CssBaseline } from "@mui/material"
import { ReactNode } from "react"

// Create a custom theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3b82f6", // blue-500
      dark: "#2563eb", // blue-600
      light: "#60a5fa", // blue-400
    },
    secondary: {
      main: "#10b981", // emerald-500
      dark: "#059669", // emerald-600
      light: "#34d399", // emerald-400
    },
    error: {
      main: "#ef4444", // red-500
    },
    warning: {
      main: "#f59e0b", // amber-500
    },
    success: {
      main: "#10b981", // emerald-500
    },
    info: {
      main: "#3b82f6", // blue-500
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#ffffff',
            '&:hover': {
              backgroundColor: '#ffffff',
            },
            '&.Mui-focused': {
              backgroundColor: '#ffffff',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
})

export function MuiThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
