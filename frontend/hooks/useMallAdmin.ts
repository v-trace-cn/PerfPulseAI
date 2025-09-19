/**
 * 商城管理相关的 hooks - 按照编码共识标准设计
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/lib/auth-context-rq'

// 类型定义
export interface CreateMallItemRequest {
  name: string
  description: string
  short_description?: string
  points_cost: number
  category: string
  subcategory?: string
  stock: number
  tags?: string[]
  image_url?: string
  is_featured?: boolean
  is_limited?: boolean
  sort_order?: number
}

export interface UpdateMallItemRequest {
  name?: string
  description?: string
  short_description?: string
  points_cost?: number
  category?: string
  subcategory?: string
  stock?: number
  tags?: string[]
  image_url?: string
  is_available?: boolean
  is_featured?: boolean
  is_limited?: boolean
  sort_order?: number
}

export interface UpdateStockRequest {
  stock_change: number
  reason?: string
}

// 重新导出 mall-hooks 中的管理员功能
export {
  useCreateMallItem,
  useUpdateMallItem,
  useDeleteMallItem,
  useMallItems
} from '@/lib/mall-hooks'

// 所有管理员功能都已迁移到 @/lib/mall-hooks
// 如需额外的管理员功能，请在 @/lib/mall-hooks 中添加
