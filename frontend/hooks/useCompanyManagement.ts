/**
 * 公司管理 Hooks - 纯 React Query 实现
 */
export {
  useCompanies,
  useCompany,
  useCurrentCompany,
  useAvailableCompanies,
  useUserCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useJoinCompany,
  useLeaveCompany,
  useCompanyByInviteCode,
  useVerifyInviteCode,
  type Company,
  type CompanyCreate,
  type CompanyUpdate
} from '@/lib/queries';

export type CompanyFormData = CompanyCreate;
export interface JoinCompanyData {
  inviteCode: string;
  forceJoin?: boolean;
}
