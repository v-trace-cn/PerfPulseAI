import type React from "react"
import type { Metadata } from 'next'
import "@/app/globals.css"
import "@/app/theme-vars.css"
import "@fontsource/inter"
import "@fontsource/space-grotesk"
import ClientLayout from './client-layout';

export const metadata: Metadata = {
  title: 'PerfPulseAI - 智能绩效管理系统',
  description: 'PerfPulseAI 是一个智能的绩效管理和积分系统，帮助团队提升工作效率和协作能力。',
  icons: '/favicon.ico',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
