/**
 * 活动相关的 hooks - 使用统一的API客户端
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'
import { api } from '@/lib/api-client'

/**
 * 重置活动积分
 */
export function useResetActivityPoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (activityId: string) => api.post(`/api/activities/${activityId}/reset-points`),
    onSuccess: (data, activityId) => {
      toast({
        title: "重置成功",
        description: "活动积分已重置",
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error: Error) => {
      toast({
        title: "重置失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 分析PR
 */
export function useAnalyzePr() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prNodeId: string) => api.post(`/api/pr/${prNodeId}/analyze`),
    onSuccess: (data, prNodeId) => {
      toast({
        title: "分析完成",
        description: "PR分析已完成",
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['prDetails'] })
      queryClient.invalidateQueries({ queryKey: ['prAnalysis', prNodeId] })
    },
    onError: (error: Error) => {
      toast({
        title: "分析失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 计算PR积分
 */
export function useCalculatePrPoints() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (prNodeId: string) => api.post(`/api/pr/${prNodeId}/calculate-points`),
    onSuccess: (data, prNodeId) => {
      toast({
        title: "计算完成",
        description: `积分计算完成: ${data.points} 分`,
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['prDetails'] })
      queryClient.invalidateQueries({ queryKey: ['prAnalysis', prNodeId] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error: Error) => {
      toast({
        title: "计算失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

/**
 * 更新活动状态
 */
export function useUpdateActivityStatus() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ activityId, status }: { activityId: string; status: string }) => 
      api.put(`/api/activities/${activityId}/status`, { status }),
    onSuccess: (data, { activityId }) => {
      toast({
        title: "更新成功",
        description: "活动状态已更新",
      })
      
      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['activity', activityId] })
      queryClient.invalidateQueries({ queryKey: ['activities'] })
    },
    onError: (error: Error) => {
      toast({
        title: "更新失败",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}
