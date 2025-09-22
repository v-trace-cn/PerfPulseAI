/**
 * 活动API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建活动 API 处理器（活动分析可能需要更长时间）
const handlers = createApiHandlers({
  apiPrefix: 'activities',
  timeout: 15000, // 15秒超时
  requireAuth: true
})

// 导出标准 HTTP 方法
export const { GET, POST, PUT, DELETE, PATCH } = handlers
