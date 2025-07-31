import React, { memo, useMemo } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, Award, BarChart3 as ChartBar, User as UserIcon } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// 标签配置常量，避免重复创建
const TAB_CONFIG = [
  { value: 'overview', icon: Gauge, label: '智能概览' },
  { value: 'rewards', icon: Award, label: '积分系统' },
  { value: 'scoring', icon: ChartBar, label: '治理机制' },
  { value: 'profile', icon: UserIcon, label: '个人中心' },
] as const;

// 通用样式类名，避免重复
const TAB_TRIGGER_CLASSES = "flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100";

export const DashboardTabs = memo<DashboardTabsProps>(({ activeTab, onTabChange }) => {
  // 使用 useMemo 缓存标签渲染
  const tabTriggers = useMemo(() =>
    TAB_CONFIG.map(({ value, icon: Icon, label }) => (
      <TabsTrigger
        key={value}
        value={value}
        className={TAB_TRIGGER_CLASSES}
      >
        <Icon className="mr-2 h-4 w-4" />
        <span>{label}</span>
      </TabsTrigger>
    )), []
  );
  return (
    <Tabs defaultValue="overview" onValueChange={onTabChange} value={activeTab} className="flex-1 ml-8">
      <TabsList className="flex justify-center bg-muted/10 rounded-full border border-primary/5 p-1 shadow-inner">
        {tabTriggers}
      </TabsList>
    </Tabs>
  );
});

DashboardTabs.displayName = 'DashboardTabs';
