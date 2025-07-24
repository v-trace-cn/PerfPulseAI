import React, { ReactNode } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, ArrowUpDown } from 'lucide-react';

export interface BaseTableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface BaseTableAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: (record: T) => void;
  disabled?: (record: T) => boolean;
  danger?: boolean;
}

export interface BaseTableProps<T> {
  data: T[];
  columns: BaseTableColumn<T>[];
  actions?: BaseTableAction<T>[];
  loading?: boolean;
  emptyText?: string;
  emptyIcon?: ReactNode;
  rowKey?: keyof T | ((record: T) => string | number);
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  className?: string;
}

/**
 * 通用数据表格组件
 * 支持排序、操作菜单、自定义渲染等功能
 */
export function BaseTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyText = "暂无数据",
  emptyIcon,
  rowKey = 'id',
  onSort,
  sortKey,
  sortDirection,
  className = "",
}: BaseTableProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return record[rowKey] || index;
  };

  const handleSort = (key: string) => {
    if (!onSort) return;
    
    const newDirection = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(key, newDirection);
  };

  const renderCellValue = (column: BaseTableColumn<T>, record: T, index: number) => {
    const value = record[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, record, index);
    }
    
    // 默认渲染逻辑
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    
    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "是" : "否"}
        </Badge>
      );
    }
    
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
      try {
        const date = value instanceof Date ? value : new Date(value);
        return format(date, 'yyyy年MM月dd日', { locale: zhCN });
      } catch {
        return value;
      }
    }
    
    return value;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyIcon && <div className="mb-4">{emptyIcon}</div>}
        <p>{emptyText}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={String(column.key)} 
                style={{ width: column.width }}
                className={`text-${column.align || 'left'}`}
              >
                {column.sortable ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-medium"
                    onClick={() => handleSort(String(column.key))}
                  >
                    {column.title}
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </Button>
                ) : (
                  column.title
                )}
              </TableHead>
            ))}
            {actions.length > 0 && (
              <TableHead className="text-right">操作</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((record, index) => (
            <TableRow key={getRowKey(record, index)}>
              {columns.map((column) => (
                <TableCell 
                  key={String(column.key)}
                  className={`text-${column.align || 'left'}`}
                >
                  {renderCellValue(column, record, index)}
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {actions.map((action) => (
                        <DropdownMenuItem
                          key={action.key}
                          onClick={() => action.onClick(record)}
                          disabled={action.disabled?.(record)}
                          className={action.danger ? "text-red-600" : ""}
                        >
                          {action.icon && <span className="mr-2">{action.icon}</span>}
                          {action.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * 常用的列渲染器
 */
export const columnRenderers = {
  /**
   * 状态徽章渲染器
   */
  status: (activeText = "活跃", inactiveText = "停用") => 
    (value: boolean) => (
      <Badge variant={value ? "default" : "secondary"}>
        {value ? activeText : inactiveText}
      </Badge>
    ),

  /**
   * 日期渲染器
   */
  date: (format_string = 'yyyy年MM月dd日') => 
    (value: string | Date) => {
      try {
        const date = value instanceof Date ? value : new Date(value);
        return format(date, format_string, { locale: zhCN });
      } catch {
        return value;
      }
    },

  /**
   * 数字渲染器
   */
  number: (suffix = '') => 
    (value: number) => (
      <span>{value?.toLocaleString()}{suffix}</span>
    ),

  /**
   * 链接渲染器
   */
  link: (onClick: (value: any, record: any) => void) => 
    (value: any, record: any) => (
      <Button
        variant="link"
        className="h-auto p-0 text-blue-600"
        onClick={() => onClick(value, record)}
      >
        {value}
      </Button>
    ),

  /**
   * 头像渲染器
   */
  avatar: (nameKey = 'name') => 
    (value: string, record: any) => (
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          {value ? (
            <img src={value} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-sm font-medium">
              {record[nameKey]?.[0]?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <span>{record[nameKey]}</span>
      </div>
    ),

  /**
   * 标签列表渲染器
   */
  tags: (colorMap?: Record<string, string>) => 
    (value: string[]) => (
      <div className="flex flex-wrap gap-1">
        {value?.map((tag, index) => (
          <Badge 
            key={index} 
            variant="outline"
            style={colorMap?.[tag] ? { backgroundColor: colorMap[tag] } : {}}
          >
            {tag}
          </Badge>
        ))}
      </div>
    ),
};
