/**
 * 统一的格式化工具函数
 */

/**
 * 日期格式化
 */
export const dateFormatters = {
  /**
   * 格式化为完整日期时间
   */
  full: (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '-';
    }
  },
  
  /**
   * 格式化为日期
   */
  date: (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '-';
    }
  },
  
  /**
   * 格式化为时间
   */
  time: (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '-';
    }
  },
  
  /**
   * 相对时间格式化
   */
  relative: (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    
    try {
      const now = new Date();
      const target = new Date(date);
      const diff = now.getTime() - target.getTime();
      
      if (diff < 0) return '未来';
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      
      if (seconds < 60) return '刚刚';
      if (minutes < 60) return `${minutes}分钟前`;
      if (hours < 24) return `${hours}小时前`;
      if (days < 7) return `${days}天前`;
      if (days < 30) return `${Math.floor(days / 7)}周前`;
      if (days < 365) return `${Math.floor(days / 30)}个月前`;
      
      return `${Math.floor(days / 365)}年前`;
    } catch {
      return '-';
    }
  },
};

/**
 * 数字格式化
 */
export const numberFormatters = {
  /**
   * 格式化积分（带正负号）
   */
  points: (points: number | null | undefined): string => {
    if (points === null || points === undefined) return '0';
    return points > 0 ? `+${points}` : points.toString();
  },
  
  /**
   * 格式化百分比
   */
  percentage: (value: number, total: number, decimals: number = 0): string => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
  },
  
  /**
   * 格式化货币
   */
  currency: (amount: number | null | undefined, symbol: string = '¥'): string => {
    if (amount === null || amount === undefined) return `${symbol}0.00`;
    return `${symbol}${amount.toFixed(2)}`;
  },
  
  /**
   * 格式化大数字（带单位）
   */
  compact: (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    
    if (num < 1000) return num.toString();
    if (num < 10000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000) return `${(num / 10000).toFixed(1)}万`;
    if (num < 100000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 100000000).toFixed(1)}亿`;
  },
};

/**
 * 文本格式化
 */
export const textFormatters = {
  /**
   * 截断文本
   */
  truncate: (text: string | null | undefined, maxLength: number = 50): string => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength)}...`;
  },
  
  /**
   * 首字母大写
   */
  capitalize: (text: string | null | undefined): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },
  
  /**
   * 格式化文件大小
   */
  fileSize: (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined) return '0 B';
    
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },
};

/**
 * 状态格式化
 */
export const statusFormatters = {
  /**
   * 活动类型映射
   */
  activityType: (type: string | null | undefined): string => {
    const typeMap: Record<string, string> = {
      'code_review': '代码审查',
      'pr_review': 'PR审查',
      'meeting': '会议',
      'documentation': '文档编写',
      'coding': '编码',
      'testing': '测试',
      'deployment': '部署',
      'research': '研究',
      'mentoring': '指导',
      'bug_fix': 'Bug修复',
    };
    
    return typeMap[type || ''] || type || '未知类型';
  },
  
  /**
   * 积分交易类型映射
   */
  transactionType: (type: string | null | undefined): string => {
    const typeMap: Record<string, string> = {
      'EARN': '获得',
      'SPEND': '消费',
      'ADJUST': '调整',
      'OBJECTION': '申诉',
    };
    
    return typeMap[type || ''] || type || '未知类型';
  },
  
  /**
   * 争议状态映射
   */
  disputeStatus: (status: string | null | undefined): string => {
    const statusMap: Record<string, string> = {
      'pending': '待处理',
      'approved': '已批准',
      'rejected': '已拒绝',
      'cancelled': '已取消',
    };
    
    return statusMap[status || ''] || status || '未知状态';
  },
};

/**
 * 统一的格式化器导出
 */
export const formatters = {
  date: dateFormatters,
  number: numberFormatters,
  text: textFormatters,
  status: statusFormatters,
};