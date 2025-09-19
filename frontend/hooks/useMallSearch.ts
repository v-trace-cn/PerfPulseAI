/**
 * 商城搜索相关的 hooks - 按照编码共识标准设计
 */
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context-rq'
import { useState, useCallback, useMemo } from 'react'

// 类型定义
export interface SearchFilters {
  category?: string
  minPoints?: number
  maxPoints?: number
  sortBy?: 'relevance' | 'points_asc' | 'points_desc' | 'popularity'
}

export interface SearchParams extends SearchFilters {
  q: string
  limit?: number
  offset?: number
}

export interface SearchResult {
  items: any[]
  total: number
  query: string
  filters: SearchFilters
  pagination: {
    limit: number
    offset: number
  }
}

export interface RecommendationResult {
  recommendations: any[]
  userBalance: number
  preferredCategories: string[]
  total: number
}

// 使用新的 mall hooks
import { usePublicMallItems } from '@/lib/mall-hooks'

// Hooks
export function useMallSearch() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null)

  // 使用公开商品搜索（无需认证）
  const searchQuery = usePublicMallItems({
    category: searchParams?.category,
    is_available: true,
  })

  const search = useCallback((params: SearchParams) => {
    setSearchParams(params)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchParams(null)
  }, [])

  // 过滤搜索结果
  const filteredData = useMemo(() => {
    if (!searchQuery.data || !searchParams) return []

    let results = searchQuery.data

    // 按关键词过滤
    if (searchParams.query) {
      const query = searchParams.query.toLowerCase()
      results = results.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    // 按价格范围过滤
    if (searchParams.priceRange) {
      const [min, max] = searchParams.priceRange
      results = results.filter(item =>
        item.points_cost >= min && item.points_cost <= max
      )
    }

    return results
  }, [searchQuery.data, searchParams])

  return {
    search,
    clearSearch,
    searchParams,
    data: filteredData,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    isSearching: !!searchParams
  }
}

export function useMallRecommendations(limit: number = 10) {
  const { user } = useAuth()

  // 使用公开商品作为推荐，按推荐标志过滤
  return usePublicMallItems({
    is_featured: true, // 获取推荐商品
    is_available: true,
    limit
  })
}

// 搜索历史管理
export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mall-search-history')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  const addToHistory = useCallback((query: string) => {
    if (!query.trim()) return

    setHistory(prev => {
      const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 10)
      localStorage.setItem('mall-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    localStorage.removeItem('mall-search-history')
  }, [])

  const removeFromHistory = useCallback((query: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item !== query)
      localStorage.setItem('mall-search-history', JSON.stringify(newHistory))
      return newHistory
    })
  }, [])

  return {
    history,
    addToHistory,
    clearHistory,
    removeFromHistory
  }
}

// 热门搜索词
export function usePopularSearches() {
  // 这里可以从API获取热门搜索词，暂时返回静态数据
  return {
    popularSearches: [
      '礼品卡',
      '咖啡券',
      '技术书籍',
      '无线鼠标',
      '充电宝',
      '团建',
      '健身'
    ]
  }
}
