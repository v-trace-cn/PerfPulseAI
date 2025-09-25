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
  const isLoading = overview.isLoading || monthlyStats.isLoading;

  // 使用 useMemo 缓存计算结果
  const summaryData = useMemo(() => ({
    currentPoints: overview.data?.balance?.totalPoints || user?.total_points || user?.points || 0,
    totalEarned: overview.data?.yearlyStats?.earned || 0,
    totalSpent: overview.data?.yearlyStats?.spent || 0,
    level: user?.level || 1,
    nextLevelPoints: 0, // TODO: 实现用户等级系统
    monthlyEarned: monthlyStats.data?.monthlyEarned || overview.data?.monthlyStats?.earned || 0,
    monthlySpent: monthlyStats.data?.monthlySpent || overview.data?.monthlyStats?.spent || 0,
    redeemCount: 0, // TODO: 实现兑换统计
    progressPercentage: 0 // TODO: 实现进度计算
  }), [
    overview.data,
    user,
    monthlyStats.data
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
        isLoading={isLoading}
      />

      {/* 详细信息标签页 */}
      <PointsTabs
        currentPoints={summaryData.currentPoints}
        userId={targetUserId}
        redemptionHistory={redemptionHistory}
        isLoading={isLoading}
      />
    </div>
  );
});

PointsOverviewWithStats.displayName = 'PointsOverviewWithStats';
