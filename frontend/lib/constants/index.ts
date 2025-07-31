/**
 * 精简版常量文件 - 只保留实际使用的常量
 */

/**
 * API相关常量
 */
export const API_CONSTANTS = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000',
  TIMEOUT: 30000,
} as const;

/**
 * 本地存储键名常量
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'token', // 实际使用的是 'token'
  THEME: 'theme',
} as const;

/**
 * 正则表达式常量 - 保留实际使用的
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
} as const;

/**
 * 分页常量 - 保留实际使用的
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 5,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50],
} as const;
