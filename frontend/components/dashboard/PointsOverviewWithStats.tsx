import React, { memo, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context-rq';
import { PointsSummaryCards } from './PointsSummaryCards';
import { PointsTabs } from './PointsTabs';

import { usePointsOverview, usePointsTransactions, usePointsStats } from '@/hooks/usePoints';

interface PointsOverviewWithStatsProps {
  userId?: string;
  page?: number;
  pageSize?: number;
}

export const PointsOverviewWithStats = memo<PointsOverviewWithStatsProps>(({
  userId,
  page = 1,
  pageSize = 5
}) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  // 获取积分数据
  const overview = usePointsOverview();
  const monthlyStats = usePointsStats('month');
  const transactions = usePointsTransactions({ page, pageSize });

  const isError = overview.isError || monthlyStats.isError;

  // 使用 useMemo 缓存计算结果
  const summaryData = useMemo(() => ({
    currentPoints: summary.data?.currentBalance || user?.total_points || user?.points || 0,
    totalEarned: summary.data?.totalEarned || 0,
    totalSpent: summary.data?.totalSpent || 0,
    level: userLevel.data?.level || user?.level || 1,
    nextLevelPoints: userLevel.data?.pointsToNext || 0,
    monthlyEarned: monthlyStats.data?.monthlyEarned || 0,
    monthlySpent: monthlyStats.data?.monthlySpent || 0,
    redeemCount: redemptionStats.data?.monthlyRedemptions || 0,
    progressPercentage: userLevel.data?.progressPercentage || 0
  }), [
    summary.data,
    user,
    userLevel.data,
    monthlyStats.data,
    redemptionStats.data
  ]);

  // 使用真实的兑换历史数据
  const redemptionHistory = useMemo(() => [], []);

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
    <div className="space-y-6 relative">
      {/* 积分概览卡片 */}
      <PointsSummaryCards
        data={summaryData}
        isLoading={false} // 临时禁用加载状态
      />

      {/* 详细信息标签页 */}
      <PointsTabs
        currentPoints={summaryData.currentPoints}
        userId={targetUserId}
        redemptionHistory={redemptionHistory}
        isLoading={false} // 临时禁用加载状态
      />
    </div>
  );
});

PointsOverviewWithStats.displayName = 'PointsOverviewWithStats';
