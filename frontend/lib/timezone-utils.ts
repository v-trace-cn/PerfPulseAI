/**
 * 时区处理工具函数
 * 处理UTC时间到中国时区(UTC+8)的转换
 */

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
 * @param timestamp - UTC时间戳字符串
 * @returns 格式化的相对时间字符串
 */
export function formatRelativeTime(timestamp: string): string {
  // 确保时间戳有正确的UTC标识
  let normalizedTimestamp = timestamp;
  if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
    normalizedTimestamp = timestamp + 'Z';
  }

  const targetTime = new Date(normalizedTimestamp);
  const now = new Date();

  const diff = now.getTime() - targetTime.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  // 超过7天显示具体日期（使用中国时区）
  return targetTime.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
}

/**
 * 获取完整的中国时区时间字符串
 * @param timestamp - UTC时间戳字符串
 * @returns 格式化的完整时间字符串
 */
export function getFullChinaTime(timestamp: string): string {
  // 确保时间戳有正确的UTC标识
  let normalizedTimestamp = timestamp;
  if (!timestamp.includes('Z') && !timestamp.includes('+') && !timestamp.includes('-')) {
    normalizedTimestamp = timestamp + 'Z';
  }

  const targetTime = new Date(normalizedTimestamp);

  return targetTime.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Shanghai'
  });
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
