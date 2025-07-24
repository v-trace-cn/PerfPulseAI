import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  TrendingUp, 
  ArrowUp, 
  ArrowDown, 
  Trophy, 
  Gift,
  History,
  Zap 
} from 'lucide-react';
import { PointTransaction, UserPointsSummary } from '@/lib/types/points';

interface PointsOverviewProps {
  pointsSummary?: UserPointsSummary;
  pointsSummaryLoading: boolean;
  pointsTransactions?: PointTransaction[];
  pointsTransactionsLoading: boolean;
  pointsTransactionsError?: any;
}

export function PointsOverview({
  pointsSummary,
  pointsSummaryLoading,
  pointsTransactions,
  pointsTransactionsLoading,
  pointsTransactionsError
}: PointsOverviewProps) {
  if (pointsSummaryLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加载中...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentBalance = pointsSummary?.currentBalance || 0;
  const totalEarned = pointsSummary?.totalEarned || 0;
  const totalSpent = pointsSummary?.totalSpent || 0;
  const rank = pointsSummary?.pointsRank || 0;
  const totalUsers = pointsSummary?.totalUsers || 0;

  return (
    <div className="space-y-6">
      {/* 积分统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">当前积分</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{currentBalance}</div>
            <p className="text-xs text-muted-foreground">
              可用于兑换奖励
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计获得</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalEarned}</div>
            <p className="text-xs text-muted-foreground">
              历史总获得积分
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累计消费</CardTitle>
            <Gift className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalSpent}</div>
            <p className="text-xs text-muted-foreground">
              历史总消费积分
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">积分排名</CardTitle>
            <Trophy className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              #{rank}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {totalUsers} 人
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近交易记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            最近交易记录
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pointsTransactionsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          ) : pointsTransactionsError ? (
            <div className="text-center py-4 text-red-500">
              加载交易记录失败
            </div>
          ) : pointsTransactions && pointsTransactions.length > 0 ? (
            <div className="space-y-3">
              {pointsTransactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.amount > 0 ? (
                        <ArrowUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDown className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </p>
                    <p className="text-sm text-gray-500">
                      余额: {transaction.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
              {pointsTransactions.length > 5 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    查看更多
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Zap className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>暂无交易记录</p>
              <p className="text-sm">完成任务后会显示积分变化</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
