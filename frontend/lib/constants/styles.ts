// 样式常量定义文件

// 颜色主题
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
  },
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  yellow: {
    50: '#fefce8',
    100: '#fef3c7',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },
} as const;

// 间距常量
export const SPACING = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const;

// 圆角常量
export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

// 阴影常量
export const SHADOWS = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// 动画常量
export const ANIMATIONS = {
  transition: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// 字体大小常量
export const FONT_SIZES = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
} as const;

// 字体粗细常量
export const FONT_WEIGHTS = {
  thin: '100',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
} as const;

// 布局常量
export const LAYOUT = {
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  sidebar: {
    width: '256px',
    collapsedWidth: '64px',
  },
  header: {
    height: '64px',
  },
  footer: {
    height: '80px',
  },
} as const;

// 组件特定样式常量
export const COMPONENT_STYLES = {
  // 卡片样式
  card: {
    base: 'bg-white rounded-lg border shadow-sm',
    hover: 'hover:shadow-md transition-shadow duration-200',
    interactive: 'cursor-pointer hover:scale-105 transition-transform duration-200',
    gradient: {
      orange: 'bg-gradient-to-br from-orange-50 to-orange-100/50',
      green: 'bg-gradient-to-br from-green-50 to-green-100/50',
      purple: 'bg-gradient-to-br from-purple-50 to-purple-100/50',
      blue: 'bg-gradient-to-br from-blue-50 to-blue-100/50',
      red: 'bg-gradient-to-br from-red-50 to-red-100/50',
      yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50',
    },
  },
  
  // 按钮样式
  button: {
    base: 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
    sizes: {
      sm: 'h-9 px-3',
      md: 'h-10 py-2 px-4',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    },
    variants: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'underline-offset-4 hover:underline text-primary',
    },
  },
  
  // 输入框样式
  input: {
    base: 'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
    error: 'border-destructive focus-visible:ring-destructive',
    success: 'border-green-500 focus-visible:ring-green-500',
  },
  
  // 徽章样式
  badge: {
    base: 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    variants: {
      default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
      secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
      destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
      outline: 'text-foreground',
    },
  },
  
  // 进度条样式
  progress: {
    base: 'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
    indicator: 'h-full w-full flex-1 bg-primary transition-all',
  },
  
  // 分页样式
  pagination: {
    base: 'mx-auto flex w-full justify-center',
    content: 'flex flex-row items-center gap-1',
    item: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2',
    link: 'gap-1 pl-2.5',
    previous: 'gap-1 pr-2.5',
  },
} as const;

// 响应式断点
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Z-index 层级
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// 常用的组合样式类
export const COMMON_CLASSES = {
  // 居中
  center: 'flex items-center justify-center',
  centerX: 'flex justify-center',
  centerY: 'flex items-center',
  
  // 文本
  textCenter: 'text-center',
  textLeft: 'text-left',
  textRight: 'text-right',
  textTruncate: 'truncate',
  textEllipsis: 'text-ellipsis overflow-hidden',
  
  // 间距
  spaceX2: 'space-x-2',
  spaceY2: 'space-y-2',
  spaceX4: 'space-x-4',
  spaceY4: 'space-y-4',
  
  // 网格
  grid2: 'grid grid-cols-2 gap-4',
  grid3: 'grid grid-cols-3 gap-4',
  grid4: 'grid grid-cols-4 gap-4',
  gridResponsive2: 'grid gap-4 md:grid-cols-2',
  gridResponsive3: 'grid gap-4 md:grid-cols-2 lg:grid-cols-3',
  gridResponsive4: 'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
  
  // 弹性布局
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  flexWrap: 'flex flex-wrap',
  flexBetween: 'flex items-center justify-between',
  
  // 滚动
  scrollY: 'overflow-y-auto',
  scrollX: 'overflow-x-auto',
  scrollHidden: 'overflow-hidden',
  
  // 过渡动画
  transition: 'transition-all duration-200 ease-in-out',
  transitionFast: 'transition-all duration-150 ease-in-out',
  transitionSlow: 'transition-all duration-300 ease-in-out',
} as const;
