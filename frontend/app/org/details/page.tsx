"use client"

import React from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import CompanyGuard from "@/components/guards/CompanyGuard"
import NotFoundPage from "@/components/common/NotFoundPage"
import { Building2 } from "lucide-react"

export default function DepartmentDetailsNotFound() {
  return (
    <AuthGuard>
      <CompanyGuard>
        <NotFoundPage
          title="部门详情未找到"
          message="您访问的部门详情页面不存在。请从组织管理页面选择一个部门查看详情。"
          backUrl="/org"
          backText="返回组织管理"
          icon={<Building2 className="h-24 w-24 mx-auto mb-6 text-gray-300" />}
        />
      </CompanyGuard>
    </AuthGuard>
  );
}
