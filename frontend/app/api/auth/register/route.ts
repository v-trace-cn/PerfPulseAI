/**
 * 注册API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建注册 API 处理器
const handlers = createApiHandlers({
  apiPrefix: 'auth/register',
  timeout: 5000,
  requireAuth: false // 注册不需要认证
})

// 导出 POST 方法
export const { POST } = handlers
