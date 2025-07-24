import { useAuth } from '@/lib/auth-context';
import { useApiQuery } from './useApiQuery';
import { useApiMutation, SUCCESS_MESSAGES } from './useApiMutation';
import { unifiedApi } from '@/lib/unified-api';

export interface Department {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  memberCount: number;
  activeMembersCount: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFormData {
  name: string;
  description?: string;
  companyId?: number;
}

export interface DepartmentMember {
  id: string;
  name: string;
  avatar: string;
  initials: string;
  title: string;
  joinDate: string;
  performanceScore: number;
  kpis: {
    codeCommits: number;
    leadTasks: number;
    bugsFixed: number;
    newFeatures: number;
  };
  skills: string[];
  recentWork: Array<{
    id: string;
    title: string;
    status: string;
    date: string;
  }>;
  overallPerformance: number;
}

/**
 * 获取部门列表的Hook
 */
export function useDepartments(companyId?: number) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['departments', user?.id, companyId || user?.companyId],
    () => unifiedApi.department.getAll(user?.id || '', companyId || user?.companyId),
    {
      enabled: !!user?.id && !!(companyId || user?.companyId),
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 获取单个部门详情的Hook
 */
export function useDepartment(departmentId: number) {
  const { user } = useAuth();

  return useApiQuery(
    ['department', departmentId, user?.id],
    () => unifiedApi.department.getById(departmentId, user?.id || ''),
    {
      enabled: !!departmentId && !!user?.id,
      staleTime: 60000, // 1分钟缓存
    }
  );
}

/**
 * 获取单个部门详情的Hook (别名)
 */
export const useDepartmentById = useDepartment;

/**
 * 获取部门成员列表的Hook
 */
export function useDepartmentMembers(departmentId: number) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['department-members', departmentId, user?.id],
    () => unifiedApi.department.getMembers(departmentId, user?.id || ''),
    {
      enabled: !!departmentId && !!user?.id,
      staleTime: 30000, // 30秒缓存
    }
  );
}

/**
 * 创建部门的Hook
 */
export function useCreateDepartment() {
  const { user } = useAuth();
  
  return useApiMutation(
    (data: DepartmentFormData) => unifiedApi.department.create({
      ...data,
      companyId: data.companyId || user?.companyId
    }, user?.id || ''),
    {
      successMessage: SUCCESS_MESSAGES.CREATE,
      invalidateQueries: ['departments'],
    }
  );
}

/**
 * 更新部门的Hook
 */
export function useUpdateDepartment() {
  const { user } = useAuth();
  
  return useApiMutation(
    ({ id, data }: { id: number; data: DepartmentFormData }) =>
      unifiedApi.department.update(id, data, user?.id || ''),
    {
      successMessage: SUCCESS_MESSAGES.UPDATE,
      invalidateQueries: ['departments', 'department'],
    }
  );
}

/**
 * 删除部门的Hook
 */
export function useDeleteDepartment() {
  const { user } = useAuth();
  
  return useApiMutation(
    (departmentId: number) => unifiedApi.department.delete(departmentId, user?.id || ''),
    {
      successMessage: SUCCESS_MESSAGES.DELETE,
      invalidateQueries: ['departments'],
    }
  );
}

/**
 * 加入部门的Hook
 */
export function useJoinDepartment() {
  const { user, refreshUser } = useAuth();
  
  return useApiMutation(
    (departmentId: number) => unifiedApi.department.join(departmentId, user?.id || ''),
    {
      successMessage: "成功加入部门",
      invalidateQueries: ['departments', 'department-members', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

/**
 * 退出部门的Hook
 */
export function useLeaveDepartment() {
  const { user, refreshUser } = useAuth();
  
  return useApiMutation(
    () => unifiedApi.department.leave(user?.id || ''),
    {
      successMessage: "成功退出部门",
      invalidateQueries: ['departments', 'department-members', 'userProfile'],
      onSuccess: async () => {
        // 刷新用户状态
        await refreshUser();
      },
    }
  );
}

/**
 * 批量关联公司的Hook
 */
export function useAssociateDepartmentsToCompany() {
  const { user } = useAuth();
  
  return useApiMutation(
    (companyId: number) => unifiedApi.department.associateToCompany(companyId, user?.id || ''),
    {
      successMessage: "成功关联公司",
      invalidateQueries: ['departments'],
    }
  );
}

/**
 * 获取部门统计数据的Hook
 */
export function useDepartmentStats(departmentId: number, timeRange?: string) {
  const { user } = useAuth();
  
  return useApiQuery(
    ['department-stats', departmentId, timeRange, user?.id],
    () => unifiedApi.department.getStats(departmentId, user?.id || '', timeRange),
    {
      enabled: !!departmentId && !!user?.id,
      staleTime: 300000, // 5分钟缓存
    }
  );
}

/**
 * 导出部门数据的Hook
 */
export function useExportDepartmentData() {
  const { user } = useAuth();
  
  return useApiMutation(
    ({ departmentId, format }: { departmentId: number; format: 'csv' | 'excel' }) =>
      unifiedApi.department.exportData(departmentId, format, user?.id || ''),
    {
      successMessage: "导出成功",
      showSuccessToast: true,
    }
  );
}
