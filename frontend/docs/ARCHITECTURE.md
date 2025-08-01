# 前端架构设计

## 整体架构

PerfPulseAI 前端采用现代化的 React 架构，基于 Next.js 14 的 App Router 模式构建。

### 架构层次

```
┌─────────────────────────────────────┐
│           Presentation Layer        │
│         (React Components)          │
├─────────────────────────────────────┤
│           Business Logic            │
│        (Custom Hooks & Utils)       │
├─────────────────────────────────────┤
│           Data Access Layer         │
│         (API & State Management)    │
├─────────────────────────────────────┤
│           Infrastructure            │
│        (Next.js & External APIs)    │
└─────────────────────────────────────┘
```

## 核心设计原则

### 1. 组件化设计
- **原子设计模式**: 从原子组件到页面的层次化设计
- **单一职责**: 每个组件只负责一个功能
- **可复用性**: 组件设计考虑复用场景
- **组合优于继承**: 通过组合构建复杂功能

### 2. 状态管理策略
- **本地状态**: 使用 useState/useReducer
- **全局状态**: 使用 React Context
- **服务器状态**: 使用 SWR 进行数据获取和缓存
- **表单状态**: 使用受控组件模式

### 3. 数据流设计
```
User Action → Component → Hook → API → Backend
     ↓           ↑         ↑      ↑
   UI Update ← State ← Response ← Data
```

## 目录结构设计

### App Router 结构
```
app/
├── (auth)/              # 认证相关页面组
├── dashboard/           # 仪表板页面
├── notifications/       # 通知中心
├── org/                # 组织管理
│   ├── companies/      # 公司管理
│   ├── departments/    # 部门管理
│   └── redemption/     # 兑换中心
├── points/             # 积分系统
├── api/                # API 路由
└── globals.css         # 全局样式
```

### 组件层次结构
```
components/
├── ui/                 # 基础 UI 组件 (Shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── dashboard/          # 仪表板专用组件
│   ├── charts/
│   ├── metrics/
│   └── widgets/
├── forms/              # 表单组件
├── layout/             # 布局组件
└── shared/             # 共享组件
```

## 数据管理架构

### 1. 认证状态管理
```typescript
// lib/auth-context.tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
```

### 2. API 集成模式
```typescript
// lib/unified-api.ts
export const unifiedApi = {
  auth: {
    login: (data) => fetchUnifiedApi('/api/auth/login', { method: 'POST', body: data }),
    logout: () => fetchUnifiedApi('/api/auth/logout', { method: 'POST' })
  },
  points: {
    getBalance: (userId) => fetchUnifiedApi(`/api/points/balance`, { headers: { 'X-User-Id': userId } })
  }
};
```

### 3. 数据获取策略
- **SWR**: 用于服务器状态管理和缓存
- **React Query**: 备选方案，提供更强大的缓存控制
- **本地缓存**: 使用 localStorage 缓存用户偏好

## 路由设计

### 1. App Router 模式
- 基于文件系统的路由
- 支持嵌套布局
- 服务端组件优先
- 客户端组件按需使用

### 2. 路由保护
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');
  
  if (!token && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 3. 动态路由
```
app/
├── org/
│   ├── companies/
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   └── departments/
│       └── [id]/
│           └── page.tsx
```

## 性能优化策略

### 1. 代码分割
- 路由级别的代码分割
- 组件级别的懒加载
- 第三方库的动态导入

### 2. 渲染优化
- React.memo 防止不必要的重渲染
- useMemo 和 useCallback 优化计算
- 虚拟滚动处理大列表

### 3. 资源优化
- 图片懒加载和优化
- 字体优化
- CSS 代码分割

## 错误处理架构

### 1. 错误边界
```typescript
// components/error-boundary.tsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
}
```

### 2. API 错误处理
- 统一的错误响应格式
- 错误重试机制
- 用户友好的错误提示

### 3. 表单验证
- 客户端验证
- 服务端验证
- 实时验证反馈

## 安全考虑

### 1. 认证安全
- JWT 令牌管理
- RSA 加密传输
- 自动令牌刷新

### 2. 数据安全
- XSS 防护
- CSRF 防护
- 输入验证和清理

### 3. 权限控制
- 基于角色的访问控制
- 路由级别的权限检查
- 组件级别的权限控制

## 国际化支持

### 1. 多语言架构
- 基于 next-intl 的国际化
- 动态语言切换
- 时区处理

### 2. 本地化考虑
- 日期时间格式化
- 数字格式化
- 货币显示

## 测试架构

### 1. 测试策略
- 单元测试: Jest + React Testing Library
- 集成测试: Cypress
- 端到端测试: Playwright

### 2. 测试覆盖
- 组件测试
- Hook 测试
- API 集成测试
- 用户流程测试

## 部署架构

### 1. 构建优化
- 静态生成 (SSG)
- 服务端渲染 (SSR)
- 增量静态再生 (ISR)

