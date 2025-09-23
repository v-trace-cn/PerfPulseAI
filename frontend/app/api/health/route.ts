/**
 * 健康检查API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建健康检查 API 处理器
const handlers = createApiHandlers({
  apiPrefix: 'health',
  timeout: 5000,
  requireAuth: false // 健康检查不需要认证
})

// 导出 GET 方法
export const { GET } = handlers