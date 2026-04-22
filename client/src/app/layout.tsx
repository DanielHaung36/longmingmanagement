import './globals.css'
import Providers from './providers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Ferrox - Project Management',
    template: '%s | Ferrox',
  },
  description: 'Ferrox Powering Projects Management',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
