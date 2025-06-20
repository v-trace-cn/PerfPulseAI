import { Suspense } from "react"
import type { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "PerfPulseAI",
  description: "下一代 AI 人力资源管理平台",
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  )
}

