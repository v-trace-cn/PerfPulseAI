import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gift, CheckCircle, Clock } from 'lucide-react';
import { PointsHistory } from './PointsHistory';
import { PointsMall } from './PointsMall';
import { formatPoints } from '@/lib/types/points';
import { PointsTabsProps, RedemptionRecord } from '@/lib/types/dashboard';

// 兑换明细组件
const RedemptionHistory = memo<{ 
  history: RedemptionRecord[]; 
  isLoading: boolean; 
}>(({ history, isLoading }) => {
  const memoizedHistory = useMemo(() => history, [history]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            兑换明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            加载中...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (memoizedHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="mr-2 h-5 w-5" />
            兑换明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            暂无兑换记录
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="mr-2 h-5 w-5" />
          兑换明细
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {memoizedHistory.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Gift className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{record.item}</p>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {record.category}
                    </Badge>
                    <span>•</span>
                    <span>{record.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold text-blue-600">-{formatPoints(record.points)}</span>
                <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                  {record.status === "completed" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {record.status === "completed" ? "已完成" : "处理中"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

RedemptionHistory.displayName = 'RedemptionHistory';

export const PointsTabs = memo<PointsTabsProps>(({
  currentPoints = 0,
  userId,
  redemptionHistory = [],
  isLoading = false
}) => {
  const displayHistory = redemptionHistory;

  return (
    <Tabs defaultValue="history" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="history">积分明细</TabsTrigger>
        <TabsTrigger value="overview">积分商城</TabsTrigger>
        <TabsTrigger value="redeem">兑换明细</TabsTrigger>
      </TabsList>

      {/* 积分明细 */}
      <TabsContent value="history" className="space-y-4">
        <PointsHistory userId={userId} />
      </TabsContent>

      {/* 积分商城 */}
      <TabsContent value="overview" className="space-y-4">
        <PointsMall currentPoints={currentPoints} />
      </TabsContent>

      {/* 兑换明细 */}
      <TabsContent value="redeem" className="space-y-4">
        <RedemptionHistory history={displayHistory} isLoading={isLoading} />
      </TabsContent>
    </Tabs>
  );
});

PointsTabs.displayName = 'PointsTabs';
