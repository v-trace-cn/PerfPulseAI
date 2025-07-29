import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { unifiedApi } from '@/lib/unified-api';
import { 
  UserPointsSummary, 
  PointTransaction, 
  MonthlyStats, 
  WeeklyStats, 
  RedemptionStats 
} from '@/lib/types/points';

// 查询键常量
export const POINTS_QUERY_KEYS = {
  all: ['points'] as const,
  summary: (userId: string) => [...POINTS_QUERY_KEYS.all, 'summary', userId] as const,
  transactions: (userId: string, page?: number, pageSize?: number) => 
    [...POINTS_QUERY_KEYS.all, 'transactions', userId, page, pageSize] as const,
  monthlyStats: (userId: string) => [...POINTS_QUERY_KEYS.all, 'monthlyStats', userId] as const,
  weeklyStats: (userId: string) => [...POINTS_QUERY_KEYS.all, 'weeklyStats', userId] as const,
  redemptionStats: (userId: string) => [...POINTS_QUERY_KEYS.all, 'redemptionStats', userId] as const,
} as const;

// 缓存时间常量
export const CACHE_TIMES = {
  SUMMARY: 5 * 60 * 1000,      // 5分钟
  TRANSACTIONS: 2 * 60 * 1000,  // 2分钟
  STATS: 10 * 60 * 1000,       // 10分钟
} as const;

// 积分概览数据 Hook
export function usePointsSummary(userId?: string, options?: Partial<UseQueryOptions<UserPointsSummary>>) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.summary(String(targetUserId)),
    queryFn: () => unifiedApi.points.getUserPointsSummary(String(targetUserId)),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.SUMMARY,
    gcTime: CACHE_TIMES.SUMMARY * 2, // 缓存保留时间
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// 积分交易记录 Hook（支持分页）
export function usePointsTransactions(
  userId?: string, 
  page: number = 1, 
  pageSize: number = 10,
  options?: Partial<UseQueryOptions<{ transactions: PointTransaction[]; totalCount: number }>>
) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.transactions(String(targetUserId), page, pageSize),
    queryFn: () => unifiedApi.points.getPointsTransactions(String(targetUserId), page, pageSize),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.TRANSACTIONS,
    gcTime: CACHE_TIMES.TRANSACTIONS * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    keepPreviousData: true, // 分页时保持之前的数据
    ...options,
  });
}

// 月度统计 Hook
export function useMonthlyStats(userId?: string, options?: Partial<UseQueryOptions<MonthlyStats>>) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.monthlyStats(String(targetUserId)),
    queryFn: () => unifiedApi.points.getMonthlyStats(String(targetUserId)),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.STATS,
    gcTime: CACHE_TIMES.STATS * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// 周度统计 Hook
export function useWeeklyStats(userId?: string, options?: Partial<UseQueryOptions<WeeklyStats>>) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.weeklyStats(String(targetUserId)),
    queryFn: () => unifiedApi.points.getWeeklyStats(String(targetUserId)),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.STATS,
    gcTime: CACHE_TIMES.STATS * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// 兑换统计 Hook
export function useRedemptionStats(userId?: string, options?: Partial<UseQueryOptions<RedemptionStats>>) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: POINTS_QUERY_KEYS.redemptionStats(String(targetUserId)),
    queryFn: () => unifiedApi.points.getRedemptionStats(String(targetUserId)),
    enabled: !!targetUserId,
    staleTime: CACHE_TIMES.STATS,
    gcTime: CACHE_TIMES.STATS * 2,
    refetchOnWindowFocus: false,
    retry: 2,
    ...options,
  });
}

// 预取数据 Hook
export function usePrefetchPointsData(userId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const prefetchSummary = () => {
    if (!targetUserId) return;
    
    queryClient.prefetchQuery({
      queryKey: POINTS_QUERY_KEYS.summary(String(targetUserId)),
      queryFn: () => unifiedApi.points.getUserPointsSummary(String(targetUserId)),
      staleTime: CACHE_TIMES.SUMMARY,
    });
  };

  const prefetchTransactions = (page: number = 1, pageSize: number = 10) => {
    if (!targetUserId) return;
    
    queryClient.prefetchQuery({
      queryKey: POINTS_QUERY_KEYS.transactions(String(targetUserId), page, pageSize),
      queryFn: () => unifiedApi.points.getPointsTransactions(String(targetUserId), page, pageSize),
      staleTime: CACHE_TIMES.TRANSACTIONS,
    });
  };

  const prefetchStats = () => {
    if (!targetUserId) return;
    
    // 预取所有统计数据
    const statsQueries = [
      {
        queryKey: POINTS_QUERY_KEYS.monthlyStats(String(targetUserId)),
        queryFn: () => unifiedApi.points.getMonthlyStats(String(targetUserId)),
      },
      {
        queryKey: POINTS_QUERY_KEYS.weeklyStats(String(targetUserId)),
        queryFn: () => unifiedApi.points.getWeeklyStats(String(targetUserId)),
      },
      {
        queryKey: POINTS_QUERY_KEYS.redemptionStats(String(targetUserId)),
        queryFn: () => unifiedApi.points.getRedemptionStats(String(targetUserId)),
      },
    ];

    statsQueries.forEach(query => {
      queryClient.prefetchQuery({
        ...query,
        staleTime: CACHE_TIMES.STATS,
      });
    });
  };

  const prefetchAll = () => {
    prefetchSummary();
    prefetchTransactions();
    prefetchStats();
  };

  return {
    prefetchSummary,
    prefetchTransactions,
    prefetchStats,
    prefetchAll,
  };
}

// 组合 Hook - 获取所有积分相关数据
export function useAllPointsData(userId?: string, page: number = 1, pageSize: number = 10) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const summary = usePointsSummary(targetUserId);
  const transactions = usePointsTransactions(targetUserId, page, pageSize);
  const monthlyStats = useMonthlyStats(targetUserId);
  const weeklyStats = useWeeklyStats(targetUserId);
  const redemptionStats = useRedemptionStats(targetUserId);

  return {
    summary,
    transactions,
    monthlyStats,
    weeklyStats,
    redemptionStats,
    isLoading: summary.isLoading || transactions.isLoading || monthlyStats.isLoading || weeklyStats.isLoading || redemptionStats.isLoading,
    isError: summary.isError || transactions.isError || monthlyStats.isError || weeklyStats.isError || redemptionStats.isError,
    error: summary.error || transactions.error || monthlyStats.error || weeklyStats.error || redemptionStats.error,
  };
}

// 无效化缓存的工具函数
export function useInvalidatePointsData() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateAll = (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    queryClient.invalidateQueries({
      queryKey: POINTS_QUERY_KEYS.all,
    });
  };

  const invalidateSummary = (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    queryClient.invalidateQueries({
      queryKey: POINTS_QUERY_KEYS.summary(String(targetUserId)),
    });
  };

  const invalidateTransactions = (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return;

    queryClient.invalidateQueries({
      queryKey: [...POINTS_QUERY_KEYS.all, 'transactions', String(targetUserId)],
    });
  };

  return {
    invalidateAll,
    invalidateSummary,
    invalidateTransactions,
  };
}
