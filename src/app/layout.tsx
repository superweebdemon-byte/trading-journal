import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/themes/provider'
import { LayoutShell } from '@/components/layout-shell'

export const metadata: Metadata = {
  title: 'Trading Journal',
  description: 'Futures day trading journal with KPI dashboard and behavioral analysis',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Fira+Code:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full" style={{ fontFamily: "'Fira Code', monospace" }}>
        <ThemeProvider>
          <LayoutShell>{children}</LayoutShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
