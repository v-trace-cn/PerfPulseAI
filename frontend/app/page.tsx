import { Suspense } from "react"
import type { Metadata } from "next"
import ClientPage from "./client-page"
import Dashboard from "@/components/dashboard"

export const metadata: Metadata = {
  title: "PerfPulseAI",
  description: "下一代 AI 人力资源管理平台",
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="flex-1 space-y-6 px-4 pb-4 md:px-8 md:pb-8 dark:bg-gradient-to-b dark:from-background dark:to-background/90">
        <div className="shadow-xl rounded-xl bg-background/50 backdrop-blur-sm border border-black/5 dark:border-primary/20 dark:bg-background/30 dark:shadow-[0_8px_30px_rgba(79,70,229,0.15)]">
          <Dashboard />
        </div>
      </div>
      <ClientPage />
    </Suspense>
  )
}

