import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

/**
 * 合并CSS类名的工具函数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 日期格式化工具类
 */
export class DateUtils {
  /**
   * 格式化日期为中文格式
   */
  static formatChinese(date: string | Date, formatString = 'yyyy年MM月dd日'): string {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return format(dateObj, formatString, { locale: zhCN })
    } catch {
      return String(date)
    }
  }

  /**
   * 格式化为相对时间
   */
  static formatRelative(date: string | Date): string {
    const now = new Date()
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

    if (diffInSeconds < 60) return '刚刚'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分钟前`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小时前`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}天前`
    
    return this.formatChinese(targetDate)
  }

  /**
   * 检查日期是否为今天
   */
  static isToday(date: string | Date): boolean {
    const today = new Date()
    const targetDate = typeof date === 'string' ? new Date(date) : date
    return today.toDateString() === targetDate.toDateString()
  }
}

/**
 * 数字格式化工具类
 */
export class NumberUtils {
  /**
   * 格式化数字为千分位
   */
  static formatThousands(num: number): string {
    return num.toLocaleString('zh-CN')
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 格式化百分比
   */
  static formatPercentage(value: number, total: number, decimals = 1): string {
    if (total === 0) return '0%'
    return ((value / total) * 100).toFixed(decimals) + '%'
  }

  /**
   * 生成随机数
   */
  static random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

/**
 * 字符串工具类
 */
export class StringUtils {
  /**
   * 截断字符串
   */
  static truncate(str: string, length: number, suffix = '...'): string {
    if (str.length <= length) return str
    return str.substring(0, length) + suffix
  }

  /**
   * 首字母大写
   */
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  /**
   * 驼峰转短横线
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }

  /**
   * 短横线转驼峰
   */
  static kebabToCamel(str: string): string {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
  }

  /**
   * 生成随机字符串
   */
  static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 提取用户名首字母
   */
  static getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
}

/**
 * 数组工具类
 */
export class ArrayUtils {
  /**
   * 数组去重
   */
  static unique<T>(arr: T[]): T[] {
    return [...new Set(arr)]
  }

  /**
   * 数组分组
   */
  static groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce((groups, item) => {
      const group = String(item[key])
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  /**
   * 数组排序
   */
  static sortBy<T>(arr: T[], key: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (aVal === bVal) return 0
      
      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal
      } else {
        comparison = String(aVal).localeCompare(String(bVal))
      }
      
      return direction === 'asc' ? comparison : -comparison
    })
  }

  /**
   * 数组分页
   */
  static paginate<T>(arr: T[], page: number, pageSize: number): {
    data: T[]
    total: number
    totalPages: number
    currentPage: number
    hasNext: boolean
    hasPrev: boolean
  } {
    const total = arr.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const data = arr.slice(startIndex, endIndex)

    return {
      data,
      total,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}

/**
 * 本地存储工具类
 */
export class StorageUtils {
  /**
   * 设置本地存储
   */
  static set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to set localStorage:', error)
    }
  }

  /**
   * 获取本地存储
   */
  static get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue || null
    } catch (error) {
      console.warn('Failed to get localStorage:', error)
      return defaultValue || null
    }
  }

  /**
   * 删除本地存储
   */
  static remove(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove localStorage:', error)
    }
  }

  /**
   * 清空本地存储
   */
  static clear(): void {
    try {
      localStorage.clear()
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
    }
  }
}

/**
 * URL工具类
 */
export class UrlUtils {
  /**
   * 构建查询字符串
   */
  static buildQuery(params: Record<string, any>): string {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.append(key, String(value))
      }
    })
    return searchParams.toString()
  }

  /**
   * 解析查询字符串
   */
  static parseQuery(search: string): Record<string, string> {
    const params = new URLSearchParams(search)
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}
