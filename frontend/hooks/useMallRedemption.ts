/**
 * 积分商城兑换相关的 hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

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

  // 兑换商品
  redeemItem: async (request: RedemptionRequest): Promise<RedemptionResponse> => {
    const response = await fetch('/api/mall/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '兑换失败')
    }
    
    return response.json()
  },

  // 获取用户兑换记录
  getUserRedemptions: async (page = 1, pageSize = 10): Promise<{
    purchases: RedemptionResponse[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }> => {
    const response = await fetch(`/api/mall/purchases?page=${page}&page_size=${pageSize}`)
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

  return useMutation({
    mutationFn: mallApi.redeemItem,
    onSuccess: (data) => {
      // 刷新相关数据
      queryClient.invalidateQueries({ queryKey: ['mall-items'] })
      queryClient.invalidateQueries({ queryKey: ['points-summary'] })
      queryClient.invalidateQueries({ queryKey: ['points-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['user-redemptions'] })
      
      toast({
        title: "兑换成功！",
        description: `成功兑换 ${data.itemName}，兑换码：${data.redemptionCode}`,
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
  return useQuery({
    queryKey: ['user-redemptions', page, pageSize],
    queryFn: () => mallApi.getUserRedemptions(page, pageSize),
    staleTime: 30 * 1000, // 30秒缓存
  })
}
