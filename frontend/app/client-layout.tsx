'use client';

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth-context-rq"
import { ToastProvider } from "@/lib/toast-context"
import { AuthDialogProvider } from "@/lib/auth-dialog-context"
import { PermissionProvider } from "@/lib/permission-system"
import SiteHeader from "@/components/site-header";
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import ClientPage from './client-page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

// 创建一个内部组件来处理 toast 逻辑
function LayoutContent({ children }: { children: React.ReactNode }) {
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
    <>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <PermissionProvider>
              <ToastProvider>
                <AuthDialogProvider>
                  <div className="relative flex min-h-screen flex-col">
                    <SiteHeader
                      onHelpClick={handleHelpClick}
                      onSettingsClick={handleSettingsClick}
                    />
                    <main className="flex-1">
                      <ClientPage>
                        {children}
                      </ClientPage>
                    </main>
                  </div>
                  <Toaster />
                </AuthDialogProvider>
              </ToastProvider>
            </PermissionProvider>
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        <LayoutContent>{children}</LayoutContent>
      </ToastProvider>
    </ThemeProvider>
  );
}
