import React, { useState, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { History, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatPoints } from '@/lib/types/points';
import Link from 'next/link';

interface PointsHistoryProps {
  userId?: string | number;
}

export const PointsHistory = memo<PointsHistoryProps>(({ userId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [filterType, setFilterType] = useState<'all' | 'earn' | 'spend'>('all');

  // 获取积分流水（规范版：/api/points/ledger）
  const { data: ledgerData, isLoading, error } = useQuery<{ list: any[]; total: number; totalPages: number }>({
    queryKey: ['points-ledger', userId, currentPage, pageSize, filterType],
    queryFn: async () => {
      const typeParam = filterType === 'all' ? '' : `&type=${filterType}`;
      const response = await fetch(`/api/points/ledger?page=${currentPage}&pageSize=${pageSize}${typeParam}`, {
        headers: {
          'X-User-Id': userId?.toString() || '',
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch points ledger: ${response.status}`);
      }
      const data = await response.json();
      return {
        ...data,
        totalPages: Math.ceil((data.total || 0) / pageSize)
      };
    },
    staleTime: 10000, // 10秒缓存
    enabled: !!userId, // 只有在用户登录且有ID时才执行
  });

  // 转换流水为显示格式 - 使用 useMemo 缓存
  const pointsHistory = useMemo(() =>
    ledgerData?.list?.map(item => ({
      id: item.id,
      type: (item.type || '').toLowerCase() === 'earn' ? 'earn' : 'spend',
      amount: typeof item.change === 'number' ? item.change : 0,
      reason: getLedgerReason(item.type, item.sourceType),
      date: new Date(item.createdAt).toLocaleDateString('zh-CN'),
      category: getLedgerCategory(item.type, item.sourceType),
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      showId: item.showId,
    })) || [], [ledgerData?.list]);

  // 获取流水类别与原因
  function getLedgerCategory(txType?: string, sourceType?: string) {
    const t = (txType || '').toLowerCase();
    const src = (sourceType || '').toLowerCase();
    if (t === 'earn') {
      if (src === 'activity') return '技术贡献';
      if (src === 'task') return '任务积分';
      return '积分获得';
    } else if (t === 'spend') {
      if (src === 'redemption') return '福利兑换';
      return '积分消费';
    }
    return '其他';
  }
  function getLedgerReason(txType?: string, sourceType?: string) {
    const t = (txType || '').toLowerCase();
    const src = (sourceType || '').toLowerCase();
    if (t === 'earn') {
      if (src === 'activity') return '活动积分';
      if (src === 'task') return '任务积分';
      return '积分获得';
    } else if (t === 'spend') {
      if (src === 'redemption') return '福利兑换';
      return '积分消费';
    }
    return '积分交易';
  }

  const totalPages = ledgerData?.totalPages || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <History className="mr-2 h-5 w-5" />
            积分明细
          </div>
          <div className="flex items-center gap-2">
            {/* 类型快速筛选：全部/获取/消费 */}
            <Select value={filterType} onValueChange={(value) => {
              setFilterType(value as 'all' | 'earn' | 'spend');
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue placeholder="筛选类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="earn">获取</SelectItem>
                <SelectItem value="spend">消费</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-sm text-muted-foreground">
              共 {ledgerData?.total || 0} 条记录
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
            pointsHistory.map((record) => {
              const isActivity = record.sourceType === 'activity' && record.sourceId;
              const renderRow = (hover: boolean) => (
                <div className={`relative overflow-hidden flex items-center justify-between p-4 border rounded-lg transition-colors duration-150 select-none ${hover ? 'hover:bg-muted/50 group-active:bg-muted/70 cursor-pointer active:scale-[0.99]' : ''}`}>
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
                      <p className="font-medium">
                        {record.reason}
                      </p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {record.category}
                        </Badge>
                        <span>•</span>
                        <span>{record.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className={`font-semibold ${
                      record.type === "earn" ? "text-green-600" : "text-red-600"
                    }`}>
                      {record.type === "earn" ? "+" : "-"}{formatPoints(Math.abs(record.amount))}
                    </div>
                    {hover && (
                      <ExternalLink className="ml-2 h-4 w-4 text-muted-foreground opacity-70 group-hover:opacity-100" />
                    )}
                  </div>
                </div>
              );
              return isActivity ? (
                <Link key={record.id} href={`/activities/${record.showId || record.sourceId}`} target="_blank" rel="noopener noreferrer" className="block no-underline group">
                  {renderRow(true)}
                </Link>
              ) : (
                <React.Fragment key={record.id}>
                  {renderRow(false)}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* 分页控件 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              显示 {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, ledgerData?.total || 0)} 条
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
