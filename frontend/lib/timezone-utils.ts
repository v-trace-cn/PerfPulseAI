/**
 * 时区处理工具函数
 * 处理UTC时间到中国时区(UTC+8)的转换
 */

// 时间格式化缓存
interface TimeFormatCache {
  result: string;
  timestamp: number;
}

const formatCache = new Map<string, TimeFormatCache>();
const CACHE_DURATION = 30 * 1000; // 30秒缓存

/**
 * 清理过期的缓存条目
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, cache] of formatCache.entries()) {
    if (now - cache.timestamp > CACHE_DURATION) {
      formatCache.delete(key);
    }
  }
}

/**
 * 将UTC时间戳转换为中国时区时间
 * @param timestamp - UTC时间戳字符串
 * @returns Date对象，已调整为中国时区
 */
export function convertUTCToChinaTime(timestamp: string): Date {
  const utcDate = new Date(timestamp);

  // 如果时间戳已经包含时区信息，直接转换到中国时区
  if (timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')) {
    // 直接使用Date对象，它会自动处理时区转换
    return utcDate;
  }

  // 如果时间戳不包含时区信息，假设它是UTC时间，添加8小时
  const chinaTime = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  return chinaTime;
}

/**
 * 格式化时间为相对时间（几分钟前、几小时前等）
 * 带缓存机制，提升性能
 * @param timestamp - UTC时间戳字符串
 * @returns 格式化的相对时间字符串
 */
export function formatRelativeTime(timestamp: string): string {
  // 检查缓存
  const cacheKey = timestamp;
  const cached = formatCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  try {
    // 确保时间戳有正确的UTC标识
    let normalizedTimestamp = timestamp;
    if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
      normalizedTimestamp = timestamp + 'Z';
    }

    // 创建目标时间（UTC）
    const targetTime = new Date(normalizedTimestamp);

    // 检查时间是否有效
    if (isNaN(targetTime.getTime())) {
      return '时间无效';
    }

    // 获取当前时间（本地时间）
    const currentTime = new Date();

    // 计算时间差（毫秒）
    const diff = currentTime.getTime() - targetTime.getTime();

    // 转换为各种时间单位
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let result: string;
    if (seconds < 60) {
      result = '刚刚';
    } else if (minutes < 60) {
      result = `${minutes}分钟前`;
    } else if (hours < 24) {
      result = `${hours}小时前`;
    } else if (days < 7) {
      result = `${days}天前`;
    } else {
      // 超过7天显示具体日期（使用中国时区）
      result = targetTime.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    }

    // 缓存结果
    formatCache.set(cacheKey, {
      result,
      timestamp: now
    });

    // 定期清理过期缓存（每100次调用清理一次）
    if (formatCache.size > 100) {
      cleanExpiredCache();
    }

    return result;
  } catch (error) {
    console.error('Error formatting relative time:', error, timestamp);
    return '时间格式错误';
  }
}

/**
 * 获取完整的中国时区时间字符串
 * 带缓存机制，提升性能
 * @param timestamp - UTC时间戳字符串
 * @returns 格式化的完整时间字符串
 */
export function getFullChinaTime(timestamp: string): string {
  // 检查缓存
  const cacheKey = `full_${timestamp}`;
  const cached = formatCache.get(cacheKey);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.result;
  }

  // 确保时间戳有正确的UTC标识
  let normalizedTimestamp = timestamp;
  if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
    normalizedTimestamp = timestamp + 'Z';
  }

  const targetTime = new Date(normalizedTimestamp);

  const result = targetTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  });

  // 缓存结果
  formatCache.set(cacheKey, {
    result,
    timestamp: now
  });

  return result;
}

/**
 * 检查时间戳是否为今天（中国时区）
 * @param timestamp - UTC时间戳字符串
 * @returns 是否为今天
 */
export function isToday(timestamp: string): boolean {
  const chinaTime = convertUTCToChinaTime(timestamp);
  const now = new Date();
  const nowChina = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  
  return chinaTime.toDateString() === nowChina.toDateString();
}

/**
 * 检查时间戳是否为昨天（中国时区）
 * @param timestamp - UTC时间戳字符串
 * @returns 是否为昨天
 */
export function isYesterday(timestamp: string): boolean {
  const chinaTime = convertUTCToChinaTime(timestamp);
  const now = new Date();
  const nowChina = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  const yesterday = new Date(nowChina.getTime() - 24 * 60 * 60 * 1000);
  
  return chinaTime.toDateString() === yesterday.toDateString();
}

/**
 * 格式化时间为智能显示格式
 * 今天：显示时间
 * 昨天：显示"昨天 HH:mm"
 * 更早：显示日期
 * @param timestamp - UTC时间戳字符串
 * @returns 格式化的时间字符串
 */
export function formatSmartTime(timestamp: string): string {
  const chinaTime = convertUTCToChinaTime(timestamp);
  
  if (isToday(timestamp)) {
    return chinaTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    });
  }
  
  if (isYesterday(timestamp)) {
    return `昨天 ${chinaTime.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    })}`;
  }
  
  return chinaTime.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 获取缓存统计信息（用于性能监控）
 */
export function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [, cache] of formatCache.entries()) {
    if (now - cache.timestamp < CACHE_DURATION) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    totalEntries: formatCache.size,
    validEntries,
    expiredEntries,
    cacheDuration: CACHE_DURATION,
    hitRate: validEntries / (validEntries + expiredEntries) || 0
  };
}

/**
 * 清空所有缓存（用于测试或重置）
 */
export function clearCache() {
  formatCache.clear();
}
