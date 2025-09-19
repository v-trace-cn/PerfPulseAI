"use client"

import React from "react"
import Link from "next/link"
import { Building2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context-rq"

interface SmartOrgNavProps {
  className?: string
}

export default function SmartOrgNav({ className }: SmartOrgNavProps) {
  const { user, isAuthenticated } = useAuth()

  // 如果用户未登录或未加入公司，跳转到公司页面
  // 如果用户已加入公司，跳转到部门管理页面
  const getHref = () => {
    if (!isAuthenticated || !user || !user.companyId) {
      return "/companies"
    }
    return "/org"
  }

  const getTitle = () => {
    if (!isAuthenticated || !user || !user.companyId) {
      return "公司管理"
    }
    return "组织管理"
  }

  return (
    <Link href={getHref()} className={className}>
      <Building2 className="mr-2 h-4 w-4" />
      {getTitle()}
    </Link>
  )
}
