/**
 * API相关常量
 */
export const API_CONSTANTS = {
  BASE_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://127.0.0.1:5000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * 路由常量
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COMPANIES: '/companies',
  ORGANIZATIONS: '/org',
  ACTIVITIES: '/activities',
  POINTS: '/points',
  NOTIFICATIONS: '/notifications',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  FORGOT_PASSWORD: '/forgot-password',
} as const;

/**
 * 本地存储键名常量
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
  RECENT_SEARCHES: 'recent_searches',
  PREFERENCES: 'user_preferences',
} as const;

/**
 * 查询键常量
 */
export const QUERY_KEYS = {
  USER: 'user',
  USERS: 'users',
  COMPANIES: 'companies',
  DEPARTMENTS: 'departments',
  ACTIVITIES: 'activities',
  POINTS: 'points',
  NOTIFICATIONS: 'notifications',
  REWARDS: 'rewards',
  LEADERBOARD: 'leaderboard',
  STATS: 'stats',
} as const;

/**
 * 用户角色常量
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest',
} as const;

/**
 * 用户状态常量
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
} as const;

/**
 * 活动状态常量
 */
export const ACTIVITY_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

/**
 * 积分交易类型常量
 */
export const TRANSACTION_TYPES = {
  EARN: 'earn',
  SPEND: 'spend',
  BONUS: 'bonus',
  PENALTY: 'penalty',
  REFUND: 'refund',
} as const;

/**
 * 通知类型常量
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  ANNOUNCEMENT: 'announcement',
  PERSONAL: 'personal',
  BUSINESS: 'business',
} as const;

/**
 * 文件类型常量
 */
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  SPREADSHEET: ['xls', 'xlsx', 'csv'],
  PRESENTATION: ['ppt', 'pptx'],
  ARCHIVE: ['zip', 'rar', '7z', 'tar', 'gz'],
  CODE: ['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml'],
} as const;

/**
 * 文件大小限制常量（字节）
 */
export const FILE_SIZE_LIMITS = {
  AVATAR: 2 * 1024 * 1024, // 2MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const;

/**
 * 分页常量
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

/**
 * 主题常量
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

/**
 * 语言常量
 */
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const;

/**
 * 正则表达式常量
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  GITHUB_URL: /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,20}$/,
  CHINESE_NAME: /^[\u4e00-\u9fa5]{2,10}$/,
} as const;

/**
 * 错误消息常量
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNAUTHORIZED: '未授权访问，请重新登录',
  FORBIDDEN: '权限不足，无法访问',
  NOT_FOUND: '请求的资源不存在',
  VALIDATION_ERROR: '数据验证失败',
  TIMEOUT_ERROR: '请求超时，请重试',
  UNKNOWN_ERROR: '未知错误，请联系管理员',
} as const;

/**
 * 成功消息常量
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '退出成功',
  REGISTER_SUCCESS: '注册成功',
  UPDATE_SUCCESS: '更新成功',
  DELETE_SUCCESS: '删除成功',
  CREATE_SUCCESS: '创建成功',
  SAVE_SUCCESS: '保存成功',
  UPLOAD_SUCCESS: '上传成功',
  SEND_SUCCESS: '发送成功',
} as const;

/**
 * 加载状态文本常量
 */
export const LOADING_MESSAGES = {
  LOADING: '加载中...',
  SAVING: '保存中...',
  UPLOADING: '上传中...',
  PROCESSING: '处理中...',
  SUBMITTING: '提交中...',
  DELETING: '删除中...',
  SENDING: '发送中...',
} as const;

/**
 * 空状态文本常量
 */
export const EMPTY_MESSAGES = {
  NO_DATA: '暂无数据',
  NO_RESULTS: '没有找到相关结果',
  NO_NOTIFICATIONS: '暂无通知',
  NO_ACTIVITIES: '暂无活动',
  NO_COMPANIES: '暂无公司',
  NO_DEPARTMENTS: '暂无部门',
  NO_USERS: '暂无用户',
  NO_POINTS: '暂无积分记录',
} as const;

/**
 * 时间格式常量
 */
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  CHINESE_DATE: 'yyyy年MM月dd日',
  CHINESE_DATETIME: 'yyyy年MM月dd日 HH:mm',
  RELATIVE: 'relative',
} as const;

/**
 * 动画持续时间常量（毫秒）
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

/**
 * 防抖延迟常量（毫秒）
 */
export const DEBOUNCE_DELAY = {
  SEARCH: 300,
  INPUT: 500,
  RESIZE: 250,
  SCROLL: 100,
} as const;

/**
 * 缓存时间常量（毫秒）
 */
export const CACHE_TIME = {
  SHORT: 5 * 60 * 1000, // 5分钟
  MEDIUM: 15 * 60 * 1000, // 15分钟
  LONG: 60 * 60 * 1000, // 1小时
  VERY_LONG: 24 * 60 * 60 * 1000, // 24小时
} as const;

/**
 * 颜色常量
 */
export const COLORS = {
  PRIMARY: '#3b82f6',
  SECONDARY: '#64748b',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#06b6d4',
} as const;

/**
 * 断点常量
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;
