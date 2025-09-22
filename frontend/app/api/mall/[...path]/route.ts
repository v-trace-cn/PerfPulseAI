/**
 * Mall API 动态路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建 Mall API 处理器
const handlers = createApiHandlers({
  apiPrefix: 'mall',
  timeout: 10000,
  requireAuth: true
})

// 导出标准 HTTP 方法
export const { GET, POST, PUT, DELETE, PATCH } = handlers
