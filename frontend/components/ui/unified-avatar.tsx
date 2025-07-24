/**
 * 统一头像组件
 * 用于整个应用中所有需要显示用户头像的地方，确保样式和逻辑的一致性
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface UnifiedAvatarProps {
  /** 用户姓名 */
  name?: string | null;
  /** 用户邮箱 */
  email?: string | null;
  /** 头像尺寸预设 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** 自定义尺寸类名 */
  className?: string;
  /** 是否显示边框 */
  showBorder?: boolean;
  /** 边框样式 */
  borderStyle?: 'light' | 'medium' | 'heavy';
  /** 自定义回退字符 */
  fallbackChar?: string;
  /** 是否使用邮箱优先显示 */
  emailFirst?: boolean;
  /** alt文本 */
  alt?: string;
  /** 点击事件 */
  onClick?: () => void;
}

// 尺寸预设映射
const sizeMap = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
  '2xl': 'h-24 w-24',
} as const;

// 边框样式映射
const borderMap = {
  light: 'border-2 border-primary/10',
  medium: 'border-3 border-primary/20',
  heavy: 'border-4 border-primary/30',
} as const;

// 字体大小映射
const textSizeMap = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
  '2xl': 'text-xl',
} as const;

/**
 * 获取用户头像的回退字符
 */
export function getAvatarFallback(
  name?: string | null,
  email?: string | null,
  emailFirst: boolean = true,
  customFallback?: string
): string {
  if (customFallback) {
    return customFallback.charAt(0).toUpperCase();
  }

  if (emailFirst) {
    // 优先使用邮箱首字母
    if (email) {
      return email.charAt(0).toUpperCase();
    }
    if (name) {
      return name.charAt(0).toUpperCase();
    }
  } else {
    // 优先使用姓名首字母
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    if (email) {
      return email.charAt(0).toUpperCase();
    }
  }

  return 'U';
}

/**
 * 生成头像URL（如果没有提供src）
 */
export function generateAvatarUrl(
  name?: string | null,
  email?: string | null,
  emailFirst: boolean = true
): string {
  const seed = emailFirst ? (email || name) : (name || email);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || 'default')}`;
}

/**
 * 统一头像组件
 */
export function UnifiedAvatar({
  name,
  email,
  size = 'md',
  className,
  showBorder = false,
  borderStyle = 'light',
  fallbackChar,
  emailFirst = true,
  alt,
  onClick,
}: UnifiedAvatarProps) {
  // 计算尺寸类名
  const sizeClass = sizeMap[size];
  
  // 计算边框类名
  const borderClass = showBorder ? borderMap[borderStyle] : '';
  
  // 计算字体大小
  const textSizeClass = textSizeMap[size];
  
  // 计算回退字符
  const fallback = getAvatarFallback(name, email, emailFirst, fallbackChar);
  
  // 计算alt文本
  const altText = alt || email || name || '用户头像';
  
  // 不使用头像图片，只显示字母头像

  return (
    <Avatar
      className={cn(
        sizeClass,
        borderClass,
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      {/* 不显示人物头像，只显示字母头像 */}
      <AvatarFallback
        className={cn(
          'bg-primary/10 text-primary font-medium',
          textSizeClass
        )}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * 预设的头像组件变体
 */

// 导航栏头像
export function NavbarAvatar(props: Omit<UnifiedAvatarProps, 'size' | 'showBorder'>) {
  return (
    <UnifiedAvatar
      {...props}
      size="xs"
      showBorder={true}
      borderStyle="light"
    />
  );
}

// 个人中心头像
export function ProfileAvatar(props: Omit<UnifiedAvatarProps, 'size' | 'showBorder'>) {
  return (
    <UnifiedAvatar
      {...props}
      size="2xl"
      showBorder={true}
      borderStyle="heavy"
    />
  );
}

// 成员列表头像
export function MemberListAvatar(props: Omit<UnifiedAvatarProps, 'size'>) {
  return (
    <UnifiedAvatar
      {...props}
      size="lg"
    />
  );
}

// 卡片头像
export function CardAvatar(props: Omit<UnifiedAvatarProps, 'size'>) {
  return (
    <UnifiedAvatar
      {...props}
      size="md"
    />
  );
}

// 小型头像
export function SmallAvatar(props: Omit<UnifiedAvatarProps, 'size'>) {
  return (
    <UnifiedAvatar
      {...props}
      size="sm"
    />
  );
}

/**
 * 头像工具函数
 */
export const AvatarUtils = {
  /**
   * 获取头像回退字符
   */
  getFallback: getAvatarFallback,
  
  /**
   * 生成头像URL
   */
  generateUrl: generateAvatarUrl,
  
  /**
   * 验证头像URL是否有效
   */
  isValidUrl: (url?: string | null): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * 获取用户显示名称
   */
  getDisplayName: (name?: string | null, email?: string | null, emailFirst: boolean = true): string => {
    if (emailFirst) {
      return email || name || '未知用户';
    }
    return name || email || '未知用户';
  },
};

export default UnifiedAvatar;
