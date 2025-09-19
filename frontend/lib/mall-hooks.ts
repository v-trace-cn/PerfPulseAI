/**
 * 商城 React Query Hooks
 * 零 fetch，零 API 类，纯 React Query
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api-client'

// ==================== 类型定义 ====================
export interface MallItem {
  id: string
  name: string
  description: string
  points_cost: number
  category: string
  image: string
  stock: number
  is_available: boolean
  tags: string[]
}

export interface CreateMallItemRequest {
  name: string
  description: string
  points_cost: number
  category: string
  stock?: number
  image?: string
  tags?: string[]
}

export interface UpdateMallItemRequest {
  name?: string
  description?: string
  points_cost?: number
  category?: string
  stock?: number
  image?: string
  tags?: string[]
  is_available?: boolean
}

export interface PurchaseRequest {
  item_id: string
  delivery_info?: Record<string, any>
}

export interface UpdateStockRequest {
  stock_change: number
  reason?: string
}

// ==================== 查询键 ====================
export const mallKeys = {
  all: ['mall'] as const,
  items: () => [...mallKeys.all, 'items'] as const,
  item: (id: string) => [...mallKeys.items(), id] as const,
  adminItems: (params?: any) => [...mallKeys.all, 'admin', 'items', params] as const,
  categories: () => [...mallKeys.all, 'categories'] as const,
  purchases: () => [...mallKeys.all, 'purchases'] as const,
  analytics: () => [...mallKeys.all, 'analytics'] as const,
}

// ==================== 查询 Hooks ====================

/**
 * 获取商品列表（需要认证，包含公司专属商品）
 */
export function useMallItems(params?: { category?: string; is_available?: boolean }) {
  return useQuery({
    queryKey: mallKeys.items(),
    queryFn: () => api.get('/api/mall/items', { params }),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 获取公开商品列表（无需认证，仅全局商品）
 */
export function usePublicMallItems(params?: { category?: string; is_available?: boolean }) {
  return useQuery({
    queryKey: [...mallKeys.items(), 'public', params],
    queryFn: () => api.get('/api/mall/items/public', { params }),
    staleTime: 10 * 60 * 1000, // 公开数据缓存更久
  })
}

/**
 * 获取商品详情
 */
export function useMallItem(itemId: string) {
  return useQuery({
    queryKey: mallKeys.item(itemId),
    queryFn: () => api.get(`/api/mall/items/${itemId}`),
    enabled: !!itemId,
    staleTime: 10 * 60 * 1000,
  })
}

/**
 * 获取管理员商品列表
 */
export function useMallAdminItems(params?: any) {
  return useQuery({
    queryKey: mallKeys.adminItems(params),
    queryFn: () => api.get('/api/mall/items', { params }),
    staleTime: 2 * 60 * 1000,
  })
}

/**
 * 获取我的购买记录
 */
export function useMyPurchases(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: mallKeys.purchases(),
    queryFn: () => api.get('/api/mall/purchases', { params }),
    staleTime: 1 * 60 * 1000,
  })
}

/**
 * 获取商城分析数据
 */
export function useMallAnalytics() {
  return useQuery({
    queryKey: mallKeys.analytics(),
    queryFn: () => api.get('/api/mall/analytics'),
    staleTime: 5 * 60 * 1000,
  })
}

// ==================== 变更 Hooks ====================

/**
 * 购买商品
 */
export function usePurchaseItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: PurchaseRequest) => api.post('/api/mall/purchase', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.purchases() })
      toast({ title: "购买成功！" })
    },
    onError: (error: any) => {
      toast({ title: "购买失败", description: error.message, variant: "destructive" })
    }
  })
}

/**
 * 创建商品
 */
export function useCreateMallItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: (data: CreateMallItemRequest) => api.post('/api/mall/admin/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.items() })
      toast({ title: "商品创建成功" })
    },
    onError: (error: any) => {
      toast({ title: "创建失败", description: error.message, variant: "destructive" })
    }
  })
}

/**
 * 更新商品
 */
export function useUpdateMallItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateMallItemRequest }) => 
      api.put(`/api/mall/admin/items/${itemId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.items() })
      toast({ title: "商品更新成功" })
    }
  })
}

/**
 * 删除商品
 */
export function useDeleteMallItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ itemId, hardDelete = false }: { itemId: string; hardDelete?: boolean }) => 
      api.delete(`/api/mall/admin/items/${itemId}?hard_delete=${hardDelete}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.items() })
      toast({ title: "商品删除成功" })
    }
  })
}

/**
 * 更新库存
 */
export function useUpdateStock() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateStockRequest }) => 
      api.put(`/api/mall/admin/items/${itemId}/stock`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.items() })
      toast({ title: "库存更新成功" })
    }
  })
}

/**
 * 兑换码验证
 */
export function useVerifyRedemptionCode() {
  const { toast } = useToast()

  return useMutation({
    mutationFn: (code: string) => api.post('/api/mall/verify-redemption-code', { redemption_code: code }),
    onSuccess: () => {
      toast({ title: "兑换码验证成功" })
    }
  })
}

/**
 * 使用兑换码
 */
export function useRedeemCode() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (code: string) => api.post('/api/mall/redeem-code', { redemption_code: code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mallKeys.purchases() })
      toast({ title: "兑换成功！" })
    }
  })
}

// ==================== 导出功能 ====================

/**
 * 导出商品数据
 */
export async function exportMallItems(format: 'csv' | 'excel' = 'csv') {
  const response = await api.get(`/api/mall/admin/export/items?format=${format}`, {
    responseType: 'blob'
  })
  
  // 创建下载链接
  const url = window.URL.createObjectURL(response)
  const a = document.createElement('a')
  a.href = url
  a.download = `mall-items-${new Date().toISOString().split('T')[0]}.${format}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
