import React, { useState, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { History, ArrowUp, ArrowDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PointTransaction, formatPoints } from '@/lib/types/points';

interface PointsHistoryProps {
  userId?: string | number;
}

export const PointsHistory = memo<PointsHistoryProps>(({ userId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取积分交易记录（分页）
  const { data: pointsTransactions, isLoading, error } = useQuery<{
    transactions: PointTransaction[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }>({
    queryKey: ['points-transactions-paginated', userId, currentPage, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/points/transactions?page=${currentPage}&page_size=${pageSize}`, {
        headers: {
          'X-User-Id': userId?.toString() || '',
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch points transactions: ${response.status}`);
      }
      const data = await response.json();
      return {
        ...data,
        totalPages: Math.ceil(data.totalCount / pageSize)
      };
    },
    staleTime: 10000, // 10秒缓存
    enabled: !!userId, // 只有在用户登录且有ID时才执行
  });

  // 转换积分交易记录为显示格式 - 使用 useMemo 缓存
  const pointsHistory = useMemo(() =>
    pointsTransactions?.transactions?.map(transaction => ({
      id: transaction.id,
      type: transaction.transactionType === 'EARN' ? 'earn' : 'spend',
      amount: transaction.transactionType === 'EARN' ? transaction.amount : -Math.abs(transaction.amount),
      reason: transaction.description || '积分交易',
      date: new Date(transaction.createdAt).toLocaleDateString('zh-CN'),
      category: getTransactionCategory(transaction.transactionType, transaction.referenceType)
    })) || [], [pointsTransactions?.transactions]);

  // 获取交易类别的辅助函数
  function getTransactionCategory(transactionType: string, referenceType?: string) {
    if (transactionType === 'EARN') {
      if (referenceType === 'activity') return '技术贡献';
      if (referenceType === 'bonus') return '奖励积分';
      return '积分获得';
    } else if (transactionType === 'SPEND') {
      if (referenceType === 'redemption') return '福利兑换';
      return '积分消费';
    }
    return '其他';
  }

  const totalPages = pointsTransactions?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            积分明细
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              共 {pointsTransactions?.totalCount || 0} 条记录
            </span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">条/页</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              加载中...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              加载失败: {error.message}
            </div>
          ) : pointsHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无积分记录
            </div>
          ) : (
            pointsHistory.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    record.type === "earn"
                      ? "bg-green-100 text-green-600"
                      : "bg-red-100 text-red-600"
                  }`}>
                    {record.type === "earn" ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{record.reason}</p>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {record.category}
                      </Badge>
                      <span>•</span>
                      <span>{record.date}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-semibold ${
                  record.type === "earn" ? "text-green-600" : "text-red-600"
                }`}>
                  {record.type === "earn" ? "+" : ""}{formatPoints(Math.abs(record.amount))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              显示 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, pointsTransactions?.totalCount || 0)} 条，
              共 {pointsTransactions?.totalCount || 0} 条记录
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PointsHistory.displayName = 'PointsHistory';
