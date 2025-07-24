import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  syncWithUrl?: boolean;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationActions {
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
}

/**
 * 分页管理Hook
 */
export function usePagination(options: UsePaginationOptions = {}) {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [10, 20, 50, 100],
    syncWithUrl = false,
  } = options;
  
  const searchParams = useSearchParams();
  
  // 从URL获取初始值（如果启用了URL同步）
  const getInitialPage = () => {
    if (syncWithUrl && searchParams.get('page')) {
      return Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    }
    return initialPage;
  };
  
  const getInitialPageSize = () => {
    if (syncWithUrl && searchParams.get('pageSize')) {
      const size = parseInt(searchParams.get('pageSize') || '10', 10);
      return pageSizeOptions.includes(size) ? size : initialPageSize;
    }
    return initialPageSize;
  };
  
  const [page, setPageInternal] = useState(getInitialPage());
  const [pageSize, setPageSizeInternal] = useState(getInitialPageSize());
  const [total, setTotal] = useState(0);
  
  // 计算总页数
  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize);
  }, [total, pageSize]);
  
  // 计算是否有上一页/下一页
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  // 更新URL参数（如果启用）
  const updateUrlParams = useCallback((newPage: number, newPageSize: number) => {
    if (!syncWithUrl) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    params.set('pageSize', newPageSize.toString());
    
    // 使用 window.history.replaceState 避免页面刷新
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [searchParams, syncWithUrl]);
  
  // 设置页码
  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPageInternal(validPage);
    updateUrlParams(validPage, pageSize);
  }, [totalPages, pageSize, updateUrlParams]);
  
  // 设置每页条数
  const setPageSize = useCallback((newPageSize: number) => {
    if (!pageSizeOptions.includes(newPageSize)) {
      console.warn(`Invalid page size: ${newPageSize}. Using default.`);
      return;
    }
    
    setPageSizeInternal(newPageSize);
    // 重置到第一页
    setPageInternal(1);
    updateUrlParams(1, newPageSize);
  }, [pageSizeOptions, updateUrlParams]);
  
  // 导航方法
  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(page + 1);
    }
  }, [hasNext, page, setPage]);
  
  const prevPage = useCallback(() => {
    if (hasPrev) {
      setPage(page - 1);
    }
  }, [hasPrev, page, setPage]);
  
  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);
  
  const lastPage = useCallback(() => {
    if (totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, setPage]);
  
  // 重置分页
  const reset = useCallback(() => {
    setPageInternal(initialPage);
    setPageSizeInternal(initialPageSize);
    setTotal(0);
    updateUrlParams(initialPage, initialPageSize);
  }, [initialPage, initialPageSize, updateUrlParams]);
  
  // 返回状态和操作
  const state: PaginationState = {
    page,
    pageSize,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
  
  const actions: PaginationActions = {
    setPage,
    setPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
  
  return {
    ...state,
    ...actions,
    pageSizeOptions,
  };
}

/**
 * 计算分页偏移量
 */
export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * 生成页码数组
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 5
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const halfVisible = Math.floor(maxVisible / 2);
  let start = Math.max(1, currentPage - halfVisible);
  let end = Math.min(totalPages, start + maxVisible - 1);
  
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}