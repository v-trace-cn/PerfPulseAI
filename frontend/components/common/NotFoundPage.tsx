import React from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, AlertTriangle } from "lucide-react"
import Link from "next/link"

interface NotFoundPageProps {
  title?: string
  message?: string
  backUrl?: string
  backText?: string
  icon?: React.ReactNode
}

export default function NotFoundPage({
  title = "页面未找到",
  message = "抱歉，您访问的页面不存在或已被移除。",
  backUrl = "/",
  backText = "返回首页",
  icon
}: NotFoundPageProps) {
  const defaultIcon = <AlertTriangle className="h-24 w-24 mx-auto mb-6 text-gray-300" />
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50/90">
      <main className="flex-1 p-4 md:p-8 space-y-8">
        <div className="text-center py-20">
          {icon || defaultIcon}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {message}
          </p>
          <Link href={backUrl}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backText}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
