'use client'
import React from 'react'
import StoreProvider from '@/redux'
import { MuiThemeProvider } from '@/providers/mui-theme-provider'
import { AuthProvider } from '@/components/AuthProvider'
import { WebSocketProvider } from '@/contexts/WebSocketContext'
import { Toaster } from '@/components/ui/toaster'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <MuiThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            {children}
            <Toaster />
          </WebSocketProvider>
        </AuthProvider>
      </MuiThemeProvider>
    </StoreProvider>
  )
}

