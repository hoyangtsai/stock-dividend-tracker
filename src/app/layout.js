import './globals.css'
import { Inter } from 'next/font/google'
import RootProvider from './provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Stock Dividend Calendar',
  description: 'A tracker of taiwan stock dividend date',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
