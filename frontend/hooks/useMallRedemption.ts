/**
 * 积分商城兑换相关的 hooks
 */

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

// 导入新的API服务
// 重新导出 mall-hooks 中的兑换功能
export {
  useMallItems,
  usePurchaseItem as useRedeemItem,
  usePurchaseItem as usePurchaseMallItem,
  useMyPurchases
} from '@/lib/mall-hooks'

// 所有兑换功能都已迁移到 @/lib/mall-hooks
// 如需额外的兑换功能，请在 @/lib/mall-hooks 中添加
