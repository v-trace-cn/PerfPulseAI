/**
 * 积分API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建积分 API 处理器
const handlers = createApiHandlers({
  apiPrefix: 'points',
  timeout: 10000,
  requireAuth: true
})

// 导出标准 HTTP 方法
export const { GET, POST, PUT, DELETE, PATCH } = handlers
