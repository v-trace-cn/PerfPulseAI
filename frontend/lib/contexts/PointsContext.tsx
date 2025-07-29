"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserPointsSummary, PointTransaction, MonthlyStats, WeeklyStats, RedemptionStats } from '@/lib/types/points';

// 状态类型定义
interface PointsState {
  summary: UserPointsSummary | null;
  transactions: PointTransaction[];
  monthlyStats: MonthlyStats | null;
  weeklyStats: WeeklyStats | null;
  redemptionStats: RedemptionStats | null;
  loading: {
    summary: boolean;
    transactions: boolean;
    monthlyStats: boolean;
    weeklyStats: boolean;
    redemptionStats: boolean;
  };
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

// 动作类型定义
type PointsAction =
  | { type: 'SET_LOADING'; payload: { key: keyof PointsState['loading']; value: boolean } }
  | { type: 'SET_SUMMARY'; payload: UserPointsSummary }
  | { type: 'SET_TRANSACTIONS'; payload: { transactions: PointTransaction[]; totalPages: number } }
  | { type: 'SET_MONTHLY_STATS'; payload: MonthlyStats }
  | { type: 'SET_WEEKLY_STATS'; payload: WeeklyStats }
  | { type: 'SET_REDEMPTION_STATS'; payload: RedemptionStats }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_PAGE_SIZE'; payload: number }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_STATE' };

// 初始状态
const initialState: PointsState = {
  summary: null,
  transactions: [],
  monthlyStats: null,
  weeklyStats: null,
  redemptionStats: null,
  loading: {
    summary: false,
    transactions: false,
    monthlyStats: false,
    weeklyStats: false,
    redemptionStats: false,
  },
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
};

// Reducer 函数
function pointsReducer(state: PointsState, action: PointsAction): PointsState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.key]: action.payload.value,
        },
      };
    case 'SET_SUMMARY':
      return {
        ...state,
        summary: action.payload,
        loading: { ...state.loading, summary: false },
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload.transactions,
        totalPages: action.payload.totalPages,
        loading: { ...state.loading, transactions: false },
      };
    case 'SET_MONTHLY_STATS':
      return {
        ...state,
        monthlyStats: action.payload,
        loading: { ...state.loading, monthlyStats: false },
      };
    case 'SET_WEEKLY_STATS':
      return {
        ...state,
        weeklyStats: action.payload,
        loading: { ...state.loading, weeklyStats: false },
      };
    case 'SET_REDEMPTION_STATS':
      return {
        ...state,
        redemptionStats: action.payload,
        loading: { ...state.loading, redemptionStats: false },
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: {
          summary: false,
          transactions: false,
          monthlyStats: false,
          weeklyStats: false,
          redemptionStats: false,
        },
      };
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    case 'SET_PAGE_SIZE':
      return {
        ...state,
        pageSize: action.payload,
        currentPage: 1, // 重置到第一页
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

// Context 类型定义
interface PointsContextType {
  state: PointsState;
  dispatch: React.Dispatch<PointsAction>;
  // 便捷方法
  setLoading: (key: keyof PointsState['loading'], value: boolean) => void;
  setSummary: (summary: UserPointsSummary) => void;
  setTransactions: (transactions: PointTransaction[], totalPages: number) => void;
  setMonthlyStats: (stats: MonthlyStats) => void;
  setWeeklyStats: (stats: WeeklyStats) => void;
  setRedemptionStats: (stats: RedemptionStats) => void;
  setError: (error: string) => void;
  clearError: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetState: () => void;
}

const PointsContext = createContext<PointsContextType | undefined>(undefined);

// Provider 组件
export function PointsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(pointsReducer, initialState);
  const { user } = useAuth();

  // 当用户变化时重置状态
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET_STATE' });
    }
  }, [user]);

  // 便捷方法
  const contextValue: PointsContextType = {
    state,
    dispatch,
    setLoading: (key, value) => dispatch({ type: 'SET_LOADING', payload: { key, value } }),
    setSummary: (summary) => dispatch({ type: 'SET_SUMMARY', payload: summary }),
    setTransactions: (transactions, totalPages) => 
      dispatch({ type: 'SET_TRANSACTIONS', payload: { transactions, totalPages } }),
    setMonthlyStats: (stats) => dispatch({ type: 'SET_MONTHLY_STATS', payload: stats }),
    setWeeklyStats: (stats) => dispatch({ type: 'SET_WEEKLY_STATS', payload: stats }),
    setRedemptionStats: (stats) => dispatch({ type: 'SET_REDEMPTION_STATS', payload: stats }),
    setError: (error) => dispatch({ type: 'SET_ERROR', payload: error }),
    clearError: () => dispatch({ type: 'CLEAR_ERROR' }),
    setPage: (page) => dispatch({ type: 'SET_PAGE', payload: page }),
    setPageSize: (size) => dispatch({ type: 'SET_PAGE_SIZE', payload: size }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
  };

  return (
    <PointsContext.Provider value={contextValue}>
      {children}
    </PointsContext.Provider>
  );
}

// Hook
export function usePoints() {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
}
