/**
 * 积分商城兑换相关的 hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context'
import { POINTS_QUERY_KEYS } from './usePointsData'
import { notificationEventHelpers } from '@/lib/notification-events'

// 类型定义
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

export interface RedemptionRequest {
  item_id: string
  delivery_info?: Record<string, any>
}

export interface RedemptionResponse {
  id: string
  userId: number
  itemId: string
  itemName: string
  itemDescription: string
  pointsCost: number
  transactionId: string
  status: string
  redemptionCode: string
  deliveryInfo?: Record<string, any>
  notes?: string
  createdAt: string
  completedAt?: string
  isPending: boolean
  isCompleted: boolean
  isCancelled: boolean
}

// API 函数
const mallApi = {
  // 获取商城商品列表
  getItems: async (category?: string): Promise<MallItem[]> => {
    const params = new URLSearchParams()
    if (category) params.append('category', category)

    const response = await fetch(`/api/mall/items?${params}`)
    if (!response.ok) {
      throw new Error('获取商品列表失败')
    }
    return response.json()
  },

  // 兑换商品 - 直接调用后端API
  redeemItem: async (request: RedemptionRequest, userId: string): Promise<RedemptionResponse> => {
    const response = await fetch('/api/mall/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '兑换失败')
    }

    return response.json()
  },

  // 获取用户兑换记录 - 直接调用后端API
  getUserRedemptions: async (page = 1, pageSize = 10, userId: string): Promise<{
    purchases: RedemptionResponse[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> => {
    const response = await fetch(`/api/mall/purchases?page=${page}&page_size=${pageSize}`, {
      headers: {
        'X-User-Id': userId,
      },
    })

    if (!response.ok) {
      throw new Error('获取兑换记录失败')
    }

    return response.json()
  }
}

// Hooks
export function useMallItems(category?: string) {
  return useQuery({
    queryKey: ['mall-items', category],
    queryFn: () => mallApi.getItems(category),
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  })
}

export function useRedeemItem() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user, refreshUser } = useAuth()

  return useMutation({
    mutationFn: (request: RedemptionRequest) => {
      if (!user?.id) {
        throw new Error('用户未登录')
      }
      return mallApi.redeemItem(request, String(user.id))
    },
    onSuccess: async (data) => {
      // 刷新相关数据 - 使用标准化的查询键
      queryClient.invalidateQueries({ queryKey: ['mall-items'] })
      queryClient.invalidateQueries({ queryKey: ['user-redemptions'] })

      // 刷新积分相关数据 - 使用标准化查询键
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.summary(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.transactions(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.redemptionStats(String(user.id)) })
        queryClient.invalidateQueries({ queryKey: POINTS_QUERY_KEYS.monthlyStats(String(user.id)) })
      }

      // 刷新用户数据以更新积分信息
      await refreshUser()

      // 触发通知刷新 - 确保通知中心显示最新的兑换通知
      notificationEventHelpers.refreshNotifications()

      toast({
        title: "兑换成功！",
        description: `成功兑换 ${data.itemName}`,
        variant: "default",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "兑换失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

export function useUserRedemptions(page = 1, pageSize = 10) {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user-redemptions', page, pageSize, user?.id],
    queryFn: () => {
      if (!user?.id) {
        throw new Error('用户未登录')
      }
      return mallApi.getUserRedemptions(page, pageSize, String(user.id))
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30秒缓存
  })
}
