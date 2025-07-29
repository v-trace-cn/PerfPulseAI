import React, { memo, useMemo, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PointsSummaryCards } from './PointsSummaryCards';
import { PointsTabs } from './PointsTabs';
import { DEFAULT_POINTS_SUMMARY } from '@/lib/types/dashboard';
import { useAllPointsData, usePrefetchPointsData } from '@/hooks/usePointsData';

interface PointsOverviewWithStatsProps {
  userId?: string;
  page?: number;
  pageSize?: number;
}

export const PointsOverviewWithStats = memo<PointsOverviewWithStatsProps>(({
  userId,
  page = 1,
  pageSize = 10
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  // 获取所有积分数据
  const {
    summary,
    monthlyStats,
    redemptionStats,
    isError
  } = useAllPointsData(targetUserId, page, pageSize);

  // 预取数据
  const { prefetchAll } = usePrefetchPointsData(targetUserId);

  // 预取下一页数据
  useEffect(() => {
    if (targetUserId) {
      prefetchAll();
    }
  }, [targetUserId, prefetchAll]);

  // 使用 useMemo 缓存计算结果
  const summaryData = useMemo(() => ({
    currentPoints: summary.data?.currentBalance || user?.total_points || user?.points || 0,
    totalEarned: summary.data?.totalEarned || 0,
    totalSpent: summary.data?.totalSpent || 0,
    level: summary.data?.currentLevel?.level || user?.level || 1,
    nextLevelPoints: summary.data?.pointsToNext || 0,
    monthlyEarned: monthlyStats.data?.monthlyEarned || 0,
    monthlySpent: monthlyStats.data?.monthlySpent || 0,
    redeemCount: redemptionStats.data?.monthlyRedemptions || 0,
    progressPercentage: summary.data?.progressPercentage || 0
  }), [
    summary.data,
    user,
    monthlyStats.data,
    redemptionStats.data
  ]);

  // 模拟兑换历史数据 - 使用 useMemo 缓存
  const redemptionHistory = useMemo(() => [
    { id: 1, item: "星巴克咖啡券", points: 200, status: "completed" as const, date: "2024-01-13", category: "福利" },
    { id: 2, item: "技术书籍《Clean Code》", points: 150, status: "completed" as const, date: "2024-01-11", category: "学习" },
    { id: 3, item: "午餐券", points: 100, status: "pending" as const, date: "2024-01-10", category: "福利" },
  ], []);

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8 text-muted-foreground">
          <p>加载积分数据时出错，请稍后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 积分概览卡片 */}
      <PointsSummaryCards
        data={summaryData}
        isLoading={summary.isLoading}
      />

      {/* 详细信息标签页 */}
      <PointsTabs
        currentPoints={summaryData.currentPoints}
        userId={targetUserId}
        redemptionHistory={redemptionHistory}
        isLoading={redemptionStats.isLoading}
      />
    </div>
  );
});

PointsOverviewWithStats.displayName = 'PointsOverviewWithStats';
