import { useAuth } from '@/lib/auth-context-rq';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, SUCCESS_MESSAGES } from './useApiMutation';
import { unifiedApi } from '@/lib/unified-api';

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

/**
 * 创建公司的Hook
 */
export function useCreateCompany() {
  const { user } = useAuth();
  
  return useApiMutation(
    (data: CompanyFormData) => unifiedApi.company.create({
      ...data,
      creatorUserId: user?.id
    }),
    {
      successMessage: SUCCESS_MESSAGES.CREATE,
      invalidateQueries: ['available-companies', 'user-companies'],
    }
  );
}

/**
 * 更新公司的Hook
 */
export function useUpdateCompany() {
  const { user } = useAuth();
  
  return useApiMutation(
    ({ id, data }: { id: number; data: CompanyFormData }) =>
      unifiedApi.company.update(id, { ...data, userId: user?.id }),
    {
      successMessage: SUCCESS_MESSAGES.UPDATE,
      invalidateQueries: ['available-companies', 'user-companies'],
    }
  );
}

/**
 * 删除公司的Hook
 */
export function useDeleteCompany() {
  const { user } = useAuth();
  
  return useApiMutation(
    (companyId: number) => unifiedApi.company.delete(companyId, user?.id || ''),
    {
      successMessage: SUCCESS_MESSAGES.DELETE,
      invalidateQueries: ['available-companies', 'user-companies'],
    }
  );
}

/**
 * 加入公司的Hook
 */
export function useJoinCompany() {
  const { user, refreshUser } = useAuth();
  
  return useApiMutation(
    ({ inviteCode, forceJoin = false }: JoinCompanyData) =>
      unifiedApi.company.joinByInviteCode(inviteCode, user?.id, forceJoin),
    {
      successMessage: "成功加入公司",
      invalidateQueries: ['available-companies', 'user-companies', 'departments', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

/**
 * 退出公司的Hook
 */
export function useLeaveCompany() {
  const { user, refreshUser } = useAuth();
  
  return useApiMutation(
    () => unifiedApi.company.leaveCompany(user?.id),
    {
      successMessage: "成功退出公司",
      invalidateQueries: ['available-companies', 'user-companies', 'departments', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

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
