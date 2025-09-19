/**
 * 部门管理 Hooks - 纯 React Query 实现
 * 直接使用新的查询系统，无需重复实现
 */

// 导出所有部门相关的查询和变更 hooks
export {
  useDepartments,
  useDepartment,
  useCurrentCompanyDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useDepartmentMembers,
  useBatchAssociateDepartments,
  type Department,
  type DepartmentCreate,
  type DepartmentUpdate,
  type DepartmentMember
} from '@/lib/queries';

// 兼容性类型别名
export type DepartmentFormData = DepartmentCreate;

