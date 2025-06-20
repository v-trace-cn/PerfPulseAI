import type React from "react"
import "@/app/globals.css"
import "@/app/theme-vars.css"
import { Inter, Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/lib/toast-context"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastProvider>
            <AuthProvider>
              {children}
              <Toaster />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
