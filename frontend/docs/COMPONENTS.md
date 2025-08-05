# 组件库文档

## 组件架构

PerfPulseAI 前端采用分层组件架构，从基础 UI 组件到复杂业务组件的层次化设计。

## 组件分类

### 1. 基础 UI 组件 (`components/ui/`)

基于 Shadcn/ui 构建的原子级组件，提供一致的设计语言。

#### Button 组件
```typescript
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// 使用示例
<Button variant="outline" size="sm">
  点击我
</Button>
```

#### Card 组件
```typescript
// 卡片容器组件
<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
    <CardDescription>描述</CardDescription>
  </CardHeader>
  <CardContent>
    内容区域
  </CardContent>
  <CardFooter>
    底部操作
  </CardFooter>
</Card>
```

#### Input 组件
```typescript
interface InputProps {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// 使用示例
<Input 
  type="email" 
  placeholder="请输入邮箱" 
  className="w-full"
/>
```

### 2. 布局组件 (`components/layout/`)

#### Header 组件
```typescript
// 应用顶部导航栏
interface HeaderProps {
  user?: User;
  onLogout?: () => void;
}

<Header user={currentUser} onLogout={handleLogout} />
```

#### Sidebar 组件
```typescript
// 侧边导航栏
interface SidebarProps {
  items: NavigationItem[];
  activeItem?: string;
  collapsed?: boolean;
}
```

### 3. 仪表板组件 (`components/dashboard/`)

#### PointsOverviewWithStats
积分概览组件，显示用户积分统计信息。

```typescript
interface PointsOverviewProps {
  userId: string;
  targetUserId?: string;
}

// 功能特性
- 实时积分余额显示
- 积分等级进度
- 月度统计数据
- 兑换历史记录
```

#### PointsSummaryCards
积分摘要卡片组件。

```typescript
interface PointsSummaryCardsProps {
  data: PointsSummaryData;
  isLoading?: boolean;
}

// 包含的指标
- 当前积分
- 本月兑换
- 积分等级
- 累计获得
```

#### MetricCard
通用指标卡片组件。

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType;
  color: 'blue' | 'green' | 'orange' | 'purple';
  trend?: string;
  isLoading?: boolean;
}
```

### 4. 表单组件 (`components/forms/`)

#### LoginForm
登录表单组件。

```typescript
interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  isLoading?: boolean;
}

// 功能特性
- 表单验证
- 错误处理
- 加载状态
- RSA 加密
```

#### CompanyForm
公司创建/编辑表单。

```typescript
interface CompanyFormProps {
  initialData?: Company;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  mode: 'create' | 'edit';
}
```

### 5. 通知组件 (`components/notification/`)

#### NotificationCenter
通知中心下拉组件。

```typescript
interface NotificationCenterProps {
  maxItems?: number;
  showMarkAllRead?: boolean;
}

// 功能特性
- 实时通知更新
- 分类显示
- 标记已读/未读
- 跳转到通知详情（支持高亮显示）
- 时区自动转换（UTC+8中国时区）
```

#### NotificationItem
单个通知项组件。

```typescript
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  isHighlighted?: boolean;
  onClick?: (notification: Notification) => void;
}

// 功能特性
- 支持点击跳转到通知详情页面
- 高亮显示指定通知
- 时间显示自动转换为中国时区
- 兑换成功Toast只显示商品名称（不显示兑换码）
```

### 6. 时区处理工具 (`lib/timezone-utils.ts`)

#### formatRelativeTime
格式化相对时间显示，带性能优化缓存。

```typescript
function formatRelativeTime(timestamp: string): string

// 功能特性
- 自动处理UTC时间转换为中国时区
- 智能相对时间显示（刚刚、几分钟前、几小时前等）
- 超过7天显示具体日期
- 自动标准化时间戳格式
- 30秒缓存机制，提升性能3-10倍
- 自动清理过期缓存
```

#### getFullChinaTime
获取完整的中国时区时间字符串，带缓存优化。

```typescript
function getFullChinaTime(timestamp: string): string

// 功能特性
- 返回格式化的完整时间字符串
- 自动转换为中国时区（UTC+8）
- 支持多种输入时间格式
- 缓存机制避免重复计算
```

#### 性能监控工具
```typescript
// 获取缓存统计
function getCacheStats(): CacheStats

// 清空缓存
function clearCache(): void

// 功能特性
- 监控缓存命中率
- 性能调试工具
- 内存使用控制
```

## 组件开发规范

### 1. 组件结构
```typescript
// 标准组件结构
import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // 属性定义
}

export const Component = memo<ComponentProps>(({
  // 解构属性
}) => {
  // 组件逻辑

  return (
    <div className={cn("base-styles", className)}>
      {/* 组件内容 */}
    </div>
  );
});

Component.displayName = 'Component';
```

### 2. 样式规范
- 使用 Tailwind CSS 类名
- 通过 `cn()` 函数合并类名
- 支持自定义 className 属性
- 使用 CSS 变量定义主题色彩

### 3. 类型定义
```typescript
// 组件属性接口
interface ComponentProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}

// 扩展 HTML 属性
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
```

### 4. 性能优化
- 使用 `React.memo` 防止不必要的重渲染
- 使用 `useMemo` 和 `useCallback` 优化计算
- 合理使用 `forwardRef` 传递引用

## 自定义 Hooks

### 1. useAuth
用户认证状态管理。

```typescript
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 2. useNotifications
通知数据管理。

```typescript
const useNotifications = (type?: NotificationType) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 获取通知列表
  // 标记已读
  // 删除通知
  
  return {
    notifications,
    loading,
    markAsRead,
    deleteNotification,
    refetch
  };
};
```

### 3. usePoints
积分数据管理。

```typescript
const usePoints = (userId: string) => {
  const { data, error, mutate } = useSWR(
    `/api/points/balance?userId=${userId}`,
    fetcher
  );
  
  return {
    points: data?.points || 0,
    isLoading: !error && !data,
    isError: error,
    refresh: mutate
  };
};
```

## 组件测试

### 1. 单元测试
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });
});
```

### 2. 集成测试
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  it('submits form with correct data', async () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: '登录' }));
    
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });
});
```

## 组件文档化

### 1. Storybook 集成
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
};
```

### 2. JSDoc 注释
```typescript
/**
 * 通用按钮组件
 * 
 * @param variant - 按钮样式变体
 * @param size - 按钮尺寸
 * @param disabled - 是否禁用
 * @param children - 按钮内容
 * @param onClick - 点击事件处理器
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'default',
  disabled = false,
  children,
  onClick,
  ...props
}) => {
  // 组件实现
};
```

## 最佳实践

### 1. 组件设计原则
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 设计时考虑复用场景
- **可组合性**: 通过组合构建复杂功能
- **可测试性**: 便于编写和维护测试

### 2. 性能考虑
- 避免在渲染函数中创建对象和函数
- 合理使用 memo 和 callback
- 懒加载大型组件
- 优化列表渲染

### 3. 可访问性
- 提供适当的 ARIA 标签
- 支持键盘导航
- 确保颜色对比度
- 提供屏幕阅读器支持
