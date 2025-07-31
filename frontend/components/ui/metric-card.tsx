/**
 * Reusable Metric Card Component
 * Used for displaying key performance indicators and metrics
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  progress?: {
    value: number;
    max?: number;
    showPercentage?: boolean;
  };
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  subtitle?: string;
  className?: string;
  animationDelay?: number;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  iconColor = "text-primary",
  bgGradient = "from-primary/10 to-transparent",
  progress,
  trend,
  subtitle,
  className,
  animationDelay = 0,
}: MetricCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 hover:translate-y-[-5px] animate-fadeInSlideUp",
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r",
        bgGradient
      )}>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 rounded-full bg-primary/10">
          <Icon className={cn("h-5 w-5", iconColor)} />
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="text-2xl font-bold">{value}</div>
        
        {progress && (
          <div className="flex items-center mt-1">
            {progress.showPercentage ? (
              <Progress
                value={progress.value}
                max={progress.max || 100}
                className="h-1.5 w-full bg-muted/50"
                indicatorClassName="progress-indicator"
              />
            ) : (
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full progress-indicator"
                  style={{ width: `${progress.value}%` }}
                />
              </div>
            )}
            {trend && (
              <span className={cn(
                "ml-2 text-xs",
                trend.isPositive ? "text-green-400" : "text-red-400"
              )}>
                {trend.isPositive ? "+" : ""}{trend.value}
              </span>
            )}
          </div>
        )}

        {subtitle && (
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">{subtitle}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized metric cards for common use cases
export function GovernanceCard({ value, trend }: { value: number; trend?: string }) {
  return (
    <MetricCard
      title="治理指数"
      value={value}
      icon={require("lucide-react").Shield}
      iconColor="text-primary"
      bgGradient="from-primary/10 to-transparent"
      progress={{
        value: value,
        showPercentage: false,
      }}
      trend={trend ? { value: trend, isPositive: true } : undefined}
      animationDelay={100}
    />
  );
}

export function WeeklyGoalsCard({ value, trend }: { value: number; trend?: string }) {
  return (
    <MetricCard
      title="周期目标"
      value={value}
      icon={require("lucide-react").Brain}
      iconColor="text-blue-500"
      bgGradient="from-blue-500/10 to-transparent"
      progress={{
        value: (value / 200) * 100,
        showPercentage: false,
      }}
      trend={trend ? { value: trend, isPositive: true } : undefined}
      animationDelay={200}
    />
  );
}

export function PointsCard({ points, maxPoints = 2000, trend }: { points: number; maxPoints?: number; trend?: string }) {
  return (
    <MetricCard
      title="积分总数"
      value={points}
      icon={require("lucide-react").Award}
      iconColor="text-accent"
      bgGradient="from-accent/10 to-transparent"
      progress={{
        value: (points / maxPoints) * 100,
        showPercentage: false,
      }}
      trend={trend ? { value: trend, isPositive: true } : undefined}
      animationDelay={300}
    />
  );
}

export function ComplianceCard({ percentage, trend }: { percentage: number; trend?: string }) {
  return (
    <MetricCard
      title="合规状态"
      value={`${percentage}%`}
      icon={require("lucide-react").Cpu}
      iconColor="text-red-500"
      bgGradient="from-red-500/10 to-transparent"
      progress={{
        value: percentage,
        showPercentage: false,
      }}
      trend={trend ? { value: trend, isPositive: true } : undefined}
      animationDelay={400}
    />
  );
}

export default MetricCard;
