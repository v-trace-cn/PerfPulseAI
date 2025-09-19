"use client"

import React from "react"
import AuthGuard from "@/components/guards/AuthGuard"
import InviteCodeGuard from "@/components/guards/InviteCodeGuard"
import { Building, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context-rq"
import {
  useAvailableCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useJoinCompany,
  useLeaveCompany,
  Company,
  CompanyFormData
} from "@/hooks/useCompanyManagement"
import { CompanyTable } from "@/components/company/CompanyTable"
import { CompanyForm } from "@/components/company/CompanyForm"
import { BaseManagementPage, useBaseTableActions } from "@/components/base/BaseManagementPage"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

export default function CompanyManagement() {
  const { user } = useAuth()

  // API hooks
  const { data: companies, isLoading, error } = useAvailableCompanies()
  const createCompanyMutation = useCreateCompany()
  const updateCompanyMutation = useUpdateCompany()
  const deleteCompanyMutation = useDeleteCompany()
  const joinCompanyMutation = useJoinCompany()
  const leaveCompanyMutation = useLeaveCompany()

  // Table actions
  const {
    selectedItem: selectedCompany,
    isCreateDialogOpen,
    isEditDialogOpen,
    handleCreate,
    handleEdit,
    handleCloseDialogs,
  } = useBaseTableActions<Company>()

  // Event handlers
  const handleCreateCompany = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data, {
      onSuccess: handleCloseDialogs
    })
  }

  const handleUpdateCompany = (data: CompanyFormData) => {
    if (!selectedCompany) return
    updateCompanyMutation.mutate({ id: selectedCompany.id, data }, {
      onSuccess: handleCloseDialogs
    })
  }

  const handleJoinCompany = (company: Company) => {
    if (company.inviteCode) {
      joinCompanyMutation.mutate({ inviteCode: company.inviteCode })
    }
  }

  // Additional actions for header
  const additionalActions = (
    <>
      <Link href="/org">
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          组织管理
        </Button>
      </Link>
      {user?.companyId && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => leaveCompanyMutation.mutate()}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          退出公司
        </Button>
      )}
    </>
  )

  // Render table
  const renderTable = (companies: Company[], actions: any) => (
    <CompanyTable
      companies={companies}
      currentUserCompanyId={user?.companyId}
      onJoinCompany={handleJoinCompany}
      onEditCompany={actions.onEdit}
      onDeleteCompany={actions.onDelete}
    />
  )

  // Render forms
  const renderForm = (
    <>
      <CompanyForm
        open={isCreateDialogOpen}
        onOpenChange={handleCloseDialogs}
        onSubmit={handleCreateCompany}
        mode="create"
        isLoading={createCompanyMutation.isPending}
      />
      <CompanyForm
        open={isEditDialogOpen}
        onOpenChange={handleCloseDialogs}
        onSubmit={handleUpdateCompany}
        company={selectedCompany}
        mode="edit"
        isLoading={updateCompanyMutation.isPending}
      />
    </>
  )

  return (
    <AuthGuard>
      <InviteCodeGuard>
        <BaseManagementPage
          title="公司管理"
          icon={<Building className="mr-3 h-8 w-8 text-gray-700" />}
          data={companies}
          isLoading={isLoading}
          error={error}
          searchPlaceholder="搜索公司名称、描述或域名..."
          onCreateClick={handleCreate}
          onEditItem={handleEdit}
          onDeleteItem={(company) => deleteCompanyMutation.mutate(company.id)}
          renderTable={renderTable}
          renderForm={renderForm}
          additionalActions={additionalActions}
        />
      </InviteCodeGuard>
    </AuthGuard>
  );
}
