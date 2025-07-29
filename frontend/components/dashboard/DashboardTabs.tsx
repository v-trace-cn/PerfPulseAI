import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gauge, Award, BarChart3 as ChartBar, User as UserIcon } from 'lucide-react';

interface DashboardTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs defaultValue="overview" onValueChange={onTabChange} value={activeTab} className="flex-1 ml-8">
      <TabsList className="flex justify-center bg-muted/10 backdrop-blur-sm rounded-full border border-primary/5 p-1 shadow-inner">
        <TabsTrigger
          value="overview"
          className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
        >
          <Gauge className="mr-2 h-4 w-4" />
          <span>智能概览</span>
        </TabsTrigger>
        <TabsTrigger
          value="rewards"
          className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
        >
          <Award className="mr-2 h-4 w-4" />
          <span>积分系统</span>
        </TabsTrigger>
        <TabsTrigger
          value="scoring"
          className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
        >
          <ChartBar className="mr-2 h-4 w-4" />
          <span>治理机制</span>
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="flex items-center px-4 py-2 rounded-full data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all duration-300 hover:bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:opacity-0 after:bg-gradient-to-r after:from-primary/10 after:to-transparent after:transition-opacity after:duration-500 hover:after:opacity-100"
        >
          <UserIcon className="mr-2 h-4 w-4" />
          <span>个人中心</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
