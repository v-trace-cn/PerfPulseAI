import React, { memo } from 'react';
import {
  Coins,
  TrendingUp,
  Star,
  Package
} from 'lucide-react';
import { formatPoints } from '@/lib/types/points';
import {
  BaseMetricCard,
  ProgressMetricCard,
  MetricCardGrid
} from '@/components/ui/metric-card-enhanced';
import {
  PointsSummaryCardsProps,
  DEFAULT_POINTS_SUMMARY
} from '@/lib/types/dashboard';

export const PointsSummaryCards = memo<PointsSummaryCardsProps>(({
  data = DEFAULT_POINTS_SUMMARY,
  isLoading = false
}) => {
  const {
    currentPoints,
    totalEarned,
    totalSpent,
    level,
    nextLevelPoints,
    redeemCount,
    progressPercentage
  } = data;

  return (
    <MetricCardGrid columns={4}>
      {/* 当前积分 */}
      <BaseMetricCard
        title="当前积分"
        value={formatPoints(currentPoints)}
        icon={Coins}
        color="orange"
        isLoading={isLoading}
      />

      {/* 本月兑换 */}
      <BaseMetricCard
        title="本月兑换"
        value={redeemCount}
        icon={Package}
        color="green"
        isLoading={isLoading}
      />

      {/* 积分等级 */}
      <ProgressMetricCard
        title="积分等级"
        value={`Lv.${level}`}
        icon={Star}
        color="purple"
        progress={progressPercentage}
        progressLabel={`距离下一级别还需 ${nextLevelPoints} 积分`}
        isLoading={isLoading}
      />

      {/* 累计获得 */}
      <BaseMetricCard
        title="累计获得"
        value={totalEarned}
        icon={TrendingUp}
        color="blue"
        subtitle={`已消费 ${totalSpent} 积分`}
        isLoading={isLoading}
      />
    </MetricCardGrid>
  );
});

PointsSummaryCards.displayName = 'PointsSummaryCards';
