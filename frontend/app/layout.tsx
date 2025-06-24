import type React from "react"
import "@/app/globals.css"
import "@/app/theme-vars.css"
import "@fontsource/inter"
import "@fontsource/space-grotesk"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ToastProvider } from "@/lib/toast-context"
import { AuthDialogProvider } from "@/lib/auth-dialog-context"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <ToastProvider>
            <AuthProvider>
              <AuthDialogProvider>
                {children}
              </AuthDialogProvider>
              <Toaster />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
