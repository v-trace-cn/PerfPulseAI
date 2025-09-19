/**
 * 统一API服务入口 - 精简版
 *
 * 按照编码共识标准，提供统一的API访问接口
 */

// 导入核心API客户端
import { api, apiClient, uploadFile, batchRequest, retryRequest, createCancelToken } from '../api-client'

// 导入专业API服务
import { pointsApi, PointsApiService } from '../services/points-api'
import { authApi, AuthApiService } from '../services/auth-api'
import { roleApi, RoleApi } from '../services/role-api'
import { activityApi, prApi, ActivityApi, PrApi } from '../services/activity-api'

// 导出核心API客户端
export { api, apiClient, uploadFile, batchRequest, retryRequest, createCancelToken }

// 导出专业API服务
export { pointsApi, PointsApiService, authApi, AuthApiService, roleApi, RoleApi, activityApi, prApi, ActivityApi, PrApi }

// 导出类型定义
export type { ApiResponse, ApiError, RequestConfig } from '../api-client'
export type {
  MallItem,
  CreateMallItemRequest,
  UpdateMallItemRequest,
  PurchaseRequest,
  UpdateStockRequest
} from '../mall-hooks'
export type {
  PointsBalance,
  PointsSummary,
  PointTransaction,
  TransferRequest
} from '../services/points-api'
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ResetPasswordRequest
} from '../services/auth-api'

// 便捷的API访问对象
export const API = {
  // 认证相关
  auth: authApi,

  // 积分相关
  points: pointsApi,

  // 角色权限相关
  role: roleApi,

  // 活动相关
  activity: activityApi,
  pr: prApi,

  // 通用API方法
  get: api.get,
  post: api.post,
  put: api.put,
  patch: api.patch,
  delete: api.delete,

  // 工具方法
  upload: uploadFile,
  batch: batchRequest,
  retry: retryRequest,
} as const

// 默认导出
export default API
