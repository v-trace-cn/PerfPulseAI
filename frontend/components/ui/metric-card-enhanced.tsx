import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { COMPONENT_STYLES, COMMON_CLASSES } from '@/lib/constants/styles';

// 样式常量
export const METRIC_CARD_STYLES = {
  base: cn(COMPONENT_STYLES.card.base, COMMON_CLASSES.transition, "hover:shadow-md"),
  gradients: {
    orange: "absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 pointer-events-none",
    green: "absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-600/5 pointer-events-none",
    purple: "absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-600/5 pointer-events-none",
    blue: "absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5 pointer-events-none",
    red: "absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-600/5 pointer-events-none",
    yellow: "absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 pointer-events-none",
  },
  icons: {
    orange: cn(COMMON_CLASSES.center, "w-8 h-8 bg-orange-100 rounded-full"),
    green: cn(COMMON_CLASSES.center, "w-8 h-8 bg-green-100 rounded-full"),
    purple: cn(COMMON_CLASSES.center, "w-8 h-8 bg-purple-100 rounded-full"),
    blue: cn(COMMON_CLASSES.center, "w-8 h-8 bg-blue-100 rounded-full"),
    red: cn(COMMON_CLASSES.center, "w-8 h-8 bg-red-100 rounded-full"),
    yellow: cn(COMMON_CLASSES.center, "w-8 h-8 bg-yellow-100 rounded-full"),
  },
  texts: {
    orange: "text-2xl font-bold text-orange-600",
    green: "text-2xl font-bold text-green-600",
    purple: "text-2xl font-bold text-purple-600",
    blue: "text-2xl font-bold text-blue-600",
    red: "text-2xl font-bold text-red-600",
    yellow: "text-2xl font-bold text-yellow-600",
  },
  iconColors: {
    orange: "h-4 w-4 text-orange-600",
    green: "h-4 w-4 text-green-600",
    purple: "h-4 w-4 text-purple-600",
    blue: "h-4 w-4 text-blue-600",
    red: "h-4 w-4 text-red-600",
    yellow: "h-4 w-4 text-yellow-600",
  }
} as const;

export type ColorVariant = keyof typeof METRIC_CARD_STYLES.gradients;

// 基础指标卡片组件
interface BaseMetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: ColorVariant;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BaseMetricCard = memo<BaseMetricCardProps>(({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  isLoading = false,
  className,
  onClick
}) => {
  return (
    <Card
      className={cn(
        METRIC_CARD_STYLES.base,
        "relative", // 确保绝对定位的渐变层正确定位
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className={METRIC_CARD_STYLES.gradients[color]} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={METRIC_CARD_STYLES.icons[color]}>
          <Icon className={METRIC_CARD_STYLES.iconColors[color]} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={METRIC_CARD_STYLES.texts[color]}>
          {isLoading ? '...' : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? '加载中...' : subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

BaseMetricCard.displayName = 'BaseMetricCard';

// 带进度条的指标卡片
interface ProgressMetricCardProps extends BaseMetricCardProps {
  progress: number;
  progressLabel?: string;
}

export const ProgressMetricCard = memo<ProgressMetricCardProps>(({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  progress,
  progressLabel,
  isLoading = false,
  className,
  onClick
}) => {
  return (
    <Card
      className={cn(
        METRIC_CARD_STYLES.base,
        "relative", // 确保绝对定位的渐变层正确定位
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className={METRIC_CARD_STYLES.gradients[color]} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={METRIC_CARD_STYLES.icons[color]}>
          <Icon className={METRIC_CARD_STYLES.iconColors[color]} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={METRIC_CARD_STYLES.texts[color]}>
          {isLoading ? '...' : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {isLoading ? '加载中...' : subtitle}
          </p>
        )}
        <div className="mt-2">
          <Progress value={progress} className="h-2" />
          {progressLabel && (
            <p className="text-xs text-muted-foreground mt-1">
              {isLoading ? '加载中...' : progressLabel}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProgressMetricCard.displayName = 'ProgressMetricCard';

// 带徽章的指标卡片
interface BadgeMetricCardProps extends BaseMetricCardProps {
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export const BadgeMetricCard = memo<BadgeMetricCardProps>(({
  title,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  badge,
  isLoading = false,
  className,
  onClick
}) => {
  return (
    <Card
      className={cn(
        METRIC_CARD_STYLES.base,
        "relative", // 确保绝对定位的渐变层正确定位
        onClick && "cursor-pointer hover:scale-105",
        className
      )}
      onClick={onClick}
    >
      <div className={METRIC_CARD_STYLES.gradients[color]} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {badge && (
            <Badge variant={badge.variant || 'secondary'} className="text-xs">
              {badge.text}
            </Badge>
          )}
        </div>
        <div className={METRIC_CARD_STYLES.icons[color]}>
          <Icon className={METRIC_CARD_STYLES.iconColors[color]} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={METRIC_CARD_STYLES.texts[color]}>
          {isLoading ? '...' : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? '加载中...' : subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

BadgeMetricCard.displayName = 'BadgeMetricCard';

// 统计卡片网格容器
interface MetricCardGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export const MetricCardGrid = memo<MetricCardGridProps>(({
  children,
  columns = 4,
  className
}) => {
  const gridClass = {
    2: COMMON_CLASSES.gridResponsive2,
    3: COMMON_CLASSES.gridResponsive3,
    4: COMMON_CLASSES.gridResponsive4
  }[columns];

  return (
    <div className={cn(gridClass, className)}>
      {children}
    </div>
  );
});

MetricCardGrid.displayName = 'MetricCardGrid';
