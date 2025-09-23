/**
 * 重置密码API路由代理
 * 使用通用 API 代理工具
 */

import { createApiHandlers } from '@/lib/api-proxy'

// 创建重置密码 API 处理器
const handlers = createApiHandlers({
  apiPrefix: 'auth/reset-password',
  timeout: 5000,
  requireAuth: false // 重置密码不需要认证
})

// 导出 POST 方法
export const { POST } = handlers