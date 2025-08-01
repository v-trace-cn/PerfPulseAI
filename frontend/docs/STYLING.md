# 样式指南

## 样式架构

PerfPulseAI 前端采用 Tailwind CSS 作为主要样式框架，结合 Shadcn/ui 组件库，提供一致的设计语言和用户体验。

## 设计系统

### 1. 色彩系统

#### 主色调
```css
/* 主品牌色 */
--primary: #B4A2FA;           /* 紫色主色 */
--primary-foreground: #FFFFFF; /* 主色前景 */

/* 次要色彩 */
--secondary: #F1F5F9;         /* 浅灰色 */
--secondary-foreground: #0F172A; /* 次要前景 */

/* 强调色 */
--accent: #F59E0B;            /* 橙色强调 */
--accent-foreground: #FFFFFF;  /* 强调前景 */
```

#### 语义色彩
```css
/* 成功状态 */
--success: #10B981;
--success-foreground: #FFFFFF;

/* 警告状态 */
--warning: #F59E0B;
--warning-foreground: #FFFFFF;

/* 错误状态 */
--destructive: #EF4444;
--destructive-foreground: #FFFFFF;

/* 信息状态 */
--info: #3B82F6;
--info-foreground: #FFFFFF;
```

#### 中性色彩
```css
/* 背景色 */
--background: #FFFFFF;
--foreground: #0F172A;

/* 卡片背景 */
--card: #FFFFFF;
--card-foreground: #0F172A;

/* 弹出层背景 */
--popover: #FFFFFF;
--popover-foreground: #0F172A;

/* 静音色彩 */
--muted: #F1F5F9;
--muted-foreground: #64748B;

/* 边框色 */
--border: #E2E8F0;
--input: #E2E8F0;
```

### 2. 字体系统

#### 字体族
```css
/* 主字体 */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 等宽字体 */
font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

#### 字体大小
```css
/* Tailwind 字体大小映射 */
text-xs: 0.75rem;    /* 12px */
text-sm: 0.875rem;   /* 14px */
text-base: 1rem;     /* 16px */
text-lg: 1.125rem;   /* 18px */
text-xl: 1.25rem;    /* 20px */
text-2xl: 1.5rem;    /* 24px */
text-3xl: 1.875rem;  /* 30px */
text-4xl: 2.25rem;   /* 36px */
```

#### 字重
```css
font-thin: 100;
font-light: 300;
font-normal: 400;
font-medium: 500;
font-semibold: 600;
font-bold: 700;
font-extrabold: 800;
```

### 3. 间距系统

#### 基础间距
```css
/* Tailwind 间距系统 (基于 0.25rem = 4px) */
space-1: 0.25rem;   /* 4px */
space-2: 0.5rem;    /* 8px */
space-3: 0.75rem;   /* 12px */
space-4: 1rem;      /* 16px */
space-5: 1.25rem;   /* 20px */
space-6: 1.5rem;    /* 24px */
space-8: 2rem;      /* 32px */
space-10: 2.5rem;   /* 40px */
space-12: 3rem;     /* 48px */
space-16: 4rem;     /* 64px */
```

#### 组件间距规范
```css
/* 卡片内边距 */
.card-padding {
  @apply p-6;
}

/* 表单元素间距 */
.form-spacing {
  @apply space-y-4;
}

/* 按钮组间距 */
.button-group {
  @apply space-x-2;
}

/* 页面容器间距 */
.page-container {
  @apply px-4 py-8 md:px-8;
}
```

### 4. 圆角系统

```css
/* 圆角大小 */
rounded-none: 0px;
rounded-sm: 0.125rem;   /* 2px */
rounded: 0.25rem;       /* 4px */
rounded-md: 0.375rem;   /* 6px */
rounded-lg: 0.5rem;     /* 8px */
rounded-xl: 0.75rem;    /* 12px */
rounded-2xl: 1rem;      /* 16px */
rounded-full: 9999px;
```

### 5. 阴影系统

```css
/* 阴影层次 */
shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## 组件样式规范

### 1. 按钮样式

```typescript
// 按钮变体样式
const buttonVariants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline"
};

// 按钮尺寸样式
const buttonSizes = {
  default: "h-10 px-4 py-2",
  sm: "h-9 rounded-md px-3",
  lg: "h-11 rounded-md px-8",
  icon: "h-10 w-10"
};
```

### 2. 卡片样式

```css
/* 基础卡片样式 */
.card {
  @apply rounded-lg border bg-card text-card-foreground shadow-sm;
}

/* 卡片头部 */
.card-header {
  @apply flex flex-col space-y-1.5 p-6;
}

/* 卡片内容 */
.card-content {
  @apply p-6 pt-0;
}

/* 卡片底部 */
.card-footer {
  @apply flex items-center p-6 pt-0;
}
```

### 3. 表单样式

```css
/* 输入框样式 */
.input {
  @apply flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50;
}

/* 标签样式 */
.label {
  @apply text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70;
}

/* 表单组样式 */
.form-group {
  @apply space-y-2;
}
```

### 4. 导航样式

```css
/* 导航栏样式 */
.navbar {
  @apply sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
}

/* 导航链接样式 */
.nav-link {
  @apply inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50;
}

/* 活跃导航链接 */
.nav-link-active {
  @apply bg-accent text-accent-foreground;
}
```

## 响应式设计

### 1. 断点系统

```css
/* Tailwind 断点 */
sm: 640px;    /* 小屏幕 */
md: 768px;    /* 中等屏幕 */
lg: 1024px;   /* 大屏幕 */
xl: 1280px;   /* 超大屏幕 */
2xl: 1536px;  /* 超超大屏幕 */
```

### 2. 响应式布局模式

```css
/* 移动优先的网格布局 */
.responsive-grid {
  @apply grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4;
}

/* 响应式容器 */
.responsive-container {
  @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
}

/* 响应式文字大小 */
.responsive-heading {
  @apply text-2xl font-bold md:text-3xl lg:text-4xl;
}
```

### 3. 移动端优化

```css
/* 触摸友好的按钮 */
.touch-button {
  @apply min-h-[44px] min-w-[44px];
}

/* 移动端导航 */
.mobile-nav {
  @apply fixed inset-x-0 bottom-0 z-50 bg-background border-t md:hidden;
}

/* 移动端表单 */
.mobile-form {
  @apply space-y-6 p-4;
}
```

## 动画和过渡

### 1. 过渡效果

```css
/* 基础过渡 */
.transition-base {
  @apply transition-all duration-200 ease-in-out;
}

/* 颜色过渡 */
.transition-colors {
  @apply transition-colors duration-200;
}

/* 变换过渡 */
.transition-transform {
  @apply transition-transform duration-300 ease-out;
}
```

### 2. 动画效果

```css
/* 淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

/* 滑入动画 */
@keyframes slideIn {
  from { transform: translateY(-10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}

/* 脉冲动画 */
.animate-pulse-custom {
  @apply animate-pulse;
}
```

### 3. 悬停效果

```css
/* 按钮悬停 */
.hover-lift {
  @apply transition-transform hover:scale-105;
}

/* 卡片悬停 */
.hover-shadow {
  @apply transition-shadow hover:shadow-lg;
}

/* 链接悬停 */
.hover-underline {
  @apply relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all hover:after:w-full;
}
```

## 主题系统

### 1. 深色模式支持

```css
/* 深色模式变量 */
.dark {
  --background: 222.2% 84% 4.9%;
  --foreground: 210% 40% 98%;
  --card: 222.2% 84% 4.9%;
  --card-foreground: 210% 40% 98%;
  --popover: 222.2% 84% 4.9%;
  --popover-foreground: 210% 40% 98%;
  --primary: 210% 40% 98%;
  --primary-foreground: 222.2% 84% 4.9%;
  --secondary: 217.2% 32.6% 17.5%;
  --secondary-foreground: 210% 40% 98%;
  --muted: 217.2% 32.6% 17.5%;
  --muted-foreground: 215% 20.2% 65.1%;
  --accent: 217.2% 32.6% 17.5%;
  --accent-foreground: 210% 40% 98%;
  --destructive: 0% 62.8% 30.6%;
  --destructive-foreground: 210% 40% 98%;
  --border: 217.2% 32.6% 17.5%;
  --input: 217.2% 32.6% 17.5%;
  --ring: 212.7% 26.8% 83.9%;
}
```

### 2. 主题切换

```typescript
// 主题切换 Hook
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  return { theme, toggleTheme };
}
```

## 性能优化

### 1. CSS 优化

```css
/* 避免重排重绘 */
.optimized-animation {
  transform: translateZ(0); /* 启用硬件加速 */
  will-change: transform;   /* 提示浏览器优化 */
}

/* 字体加载优化 */
@font-face {
  font-family: 'Inter';
  font-display: swap; /* 字体交换策略 */
  src: url('/fonts/inter.woff2') format('woff2');
}
```

### 2. 关键 CSS

```css
/* 首屏关键样式 */
.critical-styles {
  /* 布局相关 */
  @apply container mx-auto;
  
  /* 字体相关 */
  @apply font-sans text-base;
  
  /* 颜色相关 */
  @apply bg-background text-foreground;
}
```

## 可访问性

### 1. 颜色对比度

```css
/* 确保足够的颜色对比度 */
.high-contrast {
  @apply text-gray-900 bg-white;
}

.high-contrast-dark {
  @apply text-white bg-gray-900;
}
```

### 2. 焦点样式

```css
/* 键盘导航焦点样式 */
.focus-visible {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}

/* 跳过链接 */
.skip-link {
  @apply sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground;
}
```

### 3. 屏幕阅读器支持

```css
/* 仅屏幕阅读器可见 */
.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
}

/* 屏幕阅读器不可见 */
.sr-hidden {
  @apply aria-hidden;
}
```
