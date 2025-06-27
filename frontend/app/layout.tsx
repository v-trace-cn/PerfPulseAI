'use client';

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
import SiteHeader from "@/components/site-header";
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { toast } = useToast();

  const handleHelpClick = () => {
    toast({
      title: "AI 帮助与支持",
      description: "您可以通过侧边栏的帮助中心获取更多信息。",
    });
  };

  const handleSettingsClick = () => {
    toast({
      title: "系统设置",
      description: "您可以在设置中调整主题、字体大小等。",
    });
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>
            <AuthProvider>
              <AuthDialogProvider>
                <SiteHeader onHelpClick={handleHelpClick} onSettingsClick={handleSettingsClick} />
                <main className="flex min-h-screen flex-col">
                  {children}
                </main>
                <Toaster />
              </AuthDialogProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
