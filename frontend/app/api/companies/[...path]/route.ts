/**
 * 公司API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers, pathMappers } from '@/lib/api-proxy'

// 创建公司 API 处理器，使用自定义路径映射
const handlers = createApiHandlers({
  apiPrefix: 'companies',
  timeout: 10000,
  requireAuth: true,
  pathMapper: pathMappers.companyDepartments
})

// 导出标准 HTTP 方法
export const { GET, POST, PUT, DELETE, PATCH } = handlers
