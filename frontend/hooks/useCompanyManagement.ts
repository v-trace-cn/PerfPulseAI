// 使用新的通用管理 Hook 工厂
import {
  createCrudHooks,
  useGenericJoin,
  useGenericLeave,
  COMMON_CONFIGS
} from './useGenericManagement'
import {
  useCompanies,
  useCompany,
  useCurrentCompany,
  type Company as QueryCompany,
  type CompanyCreate,
  type CompanyUpdate
} from '@/lib/queries';

export interface Company {
  id: number;
  name: string;
  description?: string;
  domain?: string;
  inviteCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  departmentCount: number;
  creatorUserId?: number;
  creatorName?: string;
}

export interface CompanyFormData {
  name: string;
  description: string;
  domain: string;
}

export interface JoinCompanyData {
  inviteCode: string;
  forceJoin?: boolean;
}

/**
 * 获取可用公司列表的Hook
 */
export function useAvailableCompanies(searchTerm?: string) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['available-companies', user?.id, searchTerm],
    () => unifiedApi.company.getAvailable(user?.id || '', searchTerm),
    {
      enabled: !!user?.id,
      staleTime: 30000, // 30秒缓存
    }
  );
}

/**
 * 获取用户创建的公司列表的Hook
 */
export function useUserCompanies() {
  const { user } = useAuth();
  
  return useApiQuery(
    ['user-companies', user?.id],
    () => unifiedApi.company.getAll(user?.id || ''),
    {
      enabled: !!user?.id,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

// 使用通用 CRUD Hook 工厂创建公司管理 Hooks
const companyHooks = createCrudHooks<QueryCompany, CompanyCreate, CompanyUpdate>(COMMON_CONFIGS.company)

/**
 * 创建公司的Hook
 */
export const useCreateCompany = companyHooks.useCreate

/**
 * 更新公司的Hook
 */
export const useUpdateCompany = companyHooks.useUpdate

/**
 * 删除公司的Hook
 */
export const useDeleteCompany = companyHooks.useDelete

// 加入公司和退出公司的Hook已在 @/lib/queries 中实现
// 这里重新导出以保持兼容性
export { useJoinCompany, useLeaveCompany } from '@/lib/queries'

/**
 * 通过邀请码获取公司信息的Hook
 */
export function useCompanyByInviteCode(inviteCode: string) {
  return useApiQuery(
    ['company-by-invite-code', inviteCode],
    () => unifiedApi.company.getByInviteCode(inviteCode),
    {
      enabled: !!inviteCode && inviteCode.trim().length > 0,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 验证邀请码的Hook
 */
export function useVerifyInviteCode() {
  return useApiMutation(
    (inviteCode: string) => unifiedApi.company.getByInviteCode(inviteCode),
    {
      showSuccessToast: false, // 不显示成功提示，由组件自己处理
      showErrorToast: true,
    }
  );
}
