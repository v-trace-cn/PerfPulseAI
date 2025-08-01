# 性能优化指南

## 性能优化概述

PerfPulseAI 前端采用多层次的性能优化策略，从代码分割到缓存策略，确保应用的快速加载和流畅运行。

## 代码优化

### 1. 组件优化

#### React.memo 使用
```typescript
// 防止不必要的重渲染
export const ExpensiveComponent = React.memo<Props>(({ data, onUpdate }) => {
  return (
    <div>
      {/* 组件内容 */}
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数
  return prevProps.data.id === nextProps.data.id;
});
```

#### useMemo 和 useCallback 优化
```typescript
function OptimizedComponent({ items, filter, onItemClick }) {
  // 缓存计算结果
  const filteredItems = useMemo(() => {
    return items.filter(item => item.category === filter);
  }, [items, filter]);

  // 缓存回调函数
  const handleItemClick = useCallback((id: string) => {
    onItemClick(id);
  }, [onItemClick]);

  // 缓存复杂计算
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  return (
    <div>
      {filteredItems.map(item => (
        <Item 
          key={item.id} 
          item={item} 
          onClick={handleItemClick}
        />
      ))}
    </div>
  );
}
```

#### 虚拟滚动
```typescript
// 大列表虚拟滚动实现
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ItemComponent item={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

### 2. 状态管理优化

#### 状态分割
```typescript
// 避免大型状态对象
// ❌ 不推荐
const [appState, setAppState] = useState({
  user: null,
  notifications: [],
  settings: {},
  ui: {}
});

// ✅ 推荐
const [user, setUser] = useState(null);
const [notifications, setNotifications] = useState([]);
const [settings, setSettings] = useState({});
const [ui, setUI] = useState({});
```

#### Context 优化
```typescript
// 分离不同关注点的 Context
const UserContext = createContext();
const NotificationsContext = createContext();
const UIContext = createContext();

// 使用 Provider 组合
function AppProviders({ children }) {
  return (
    <UserProvider>
      <NotificationsProvider>
        <UIProvider>
          {children}
        </UIProvider>
      </NotificationsProvider>
    </UserProvider>
  );
}
```

## 代码分割

### 1. 路由级别分割

```typescript
// 动态导入页面组件
import dynamic from 'next/dynamic';

const DashboardPage = dynamic(() => import('./dashboard/page'), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

const NotificationsPage = dynamic(() => import('./notifications/page'), {
  loading: () => <NotificationsSkeleton />
});
```

### 2. 组件级别分割

```typescript
// 懒加载重型组件
const ChartComponent = dynamic(() => import('./chart-component'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

// 条件加载
function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        显示图表
      </button>
      {showChart && <ChartComponent />}
    </div>
  );
}
```

### 3. 第三方库分割

```typescript
// 动态导入第三方库
async function loadChart() {
  const { Chart } = await import('chart.js');
  return Chart;
}

// 使用时再加载
function ChartWrapper() {
  const [Chart, setChart] = useState(null);

  useEffect(() => {
    loadChart().then(setChart);
  }, []);

  if (!Chart) return <div>加载中...</div>;

  return <Chart {...props} />;
}
```

## 资源优化

### 1. 图片优化

```typescript
// Next.js Image 组件优化
import Image from 'next/image';

function OptimizedImage({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={400}
      height={300}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      loading="lazy"
      quality={85}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### 2. 字体优化

```typescript
// next/font 优化
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

### 3. CSS 优化

```css
/* 关键 CSS 内联 */
.critical {
  /* 首屏必需样式 */
}

/* 非关键 CSS 延迟加载 */
@media print {
  /* 打印样式 */
}

/* 使用 CSS 变量减少重复 */
:root {
  --primary-color: #B4A2FA;
  --secondary-color: #F1F5F9;
}
```

## 缓存策略

### 1. HTTP 缓存

```typescript
// Next.js 静态资源缓存
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  // 处理请求
}
```

### 2. SWR 缓存配置

```typescript
// SWR 全局配置
import { SWRConfig } from 'swr';

const swrConfig = {
  refreshInterval: 0,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  cache: new Map(), // 自定义缓存
};

function App({ Component, pageProps }) {
  return (
    <SWRConfig value={swrConfig}>
      <Component {...pageProps} />
    </SWRConfig>
  );
}
```

### 3. 本地存储缓存

```typescript
// 智能缓存策略
class CacheManager {
  private cache = new Map();
  private maxSize = 100;
  private ttl = 5 * 60 * 1000; // 5分钟

  set(key: string, value: any) {
    // LRU 缓存实现
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }
}
```

## 渲染优化

### 1. 服务端渲染 (SSR)

```typescript
// 页面级 SSR
export async function getServerSideProps(context) {
  const data = await fetchData();
  
  return {
    props: {
      data,
    },
  };
}

export default function Page({ data }) {
  return <div>{/* 使用预取数据 */}</div>;
}
```

### 2. 静态生成 (SSG)

```typescript
// 静态生成
export async function getStaticProps() {
  const data = await fetchStaticData();
  
  return {
    props: {
      data,
    },
    revalidate: 3600, // 1小时重新生成
  };
}

export async function getStaticPaths() {
  const paths = await getStaticPaths();
  
  return {
    paths,
    fallback: 'blocking',
  };
}
```

### 3. 增量静态再生 (ISR)

```typescript
// ISR 配置
export async function getStaticProps() {
  const data = await fetchData();
  
  return {
    props: {
      data,
    },
    revalidate: 60, // 60秒后重新生成
  };
}
```

## 网络优化

### 1. 请求优化

```typescript
// 请求去重
const requestCache = new Map();

async function dedupeRequest(key: string, fn: () => Promise<any>) {
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }

  const promise = fn();
  requestCache.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    requestCache.delete(key);
  }
}
```

### 2. 预加载策略

```typescript
// 路由预加载
import { useRouter } from 'next/router';

function NavigationLink({ href, children }) {
  const router = useRouter();

  const handleMouseEnter = () => {
    router.prefetch(href);
  };

  return (
    <Link href={href} onMouseEnter={handleMouseEnter}>
      {children}
    </Link>
  );
}
```

### 3. 批量请求

```typescript
// 请求批处理
class RequestBatcher {
  private batch: Array<{ key: string; resolve: Function; reject: Function }> = [];
  private timer: NodeJS.Timeout | null = null;

  add(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batch.push({ key, resolve, reject });
      
      if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), 10);
      }
    });
  }

  private async flush() {
    const currentBatch = [...this.batch];
    this.batch = [];
    this.timer = null;

    try {
      const keys = currentBatch.map(item => item.key);
      const results = await this.batchFetch(keys);
      
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error);
      });
    }
  }

  private async batchFetch(keys: string[]) {
    // 批量获取数据
    const response = await fetch('/api/batch', {
      method: 'POST',
      body: JSON.stringify({ keys })
    });
    return response.json();
  }
}
```

## 监控和分析

### 1. 性能监控

```typescript
// Web Vitals 监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // 发送到分析服务
  console.log(metric);
}

// 监控核心指标
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 2. 错误监控

```typescript
// 错误边界
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // 发送错误报告
    this.reportError(error, errorInfo);
  }

  reportError(error, errorInfo) {
    // 发送到错误监控服务
    fetch('/api/errors', {
      method: 'POST',
      body: JSON.stringify({
        error: error.toString(),
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      })
    });
  }
}
```

### 3. 性能分析

```typescript
// 性能分析工具
class PerformanceAnalyzer {
  static measureComponent(name: string) {
    return function(WrappedComponent) {
      return function MeasuredComponent(props) {
        useEffect(() => {
          const startTime = performance.now();
          
          return () => {
            const endTime = performance.now();
            console.log(`${name} 渲染时间: ${endTime - startTime}ms`);
          };
        });

        return <WrappedComponent {...props} />;
      };
    };
  }

  static measureFunction(fn: Function, name: string) {
    return function(...args) {
      const startTime = performance.now();
      const result = fn.apply(this, args);
      const endTime = performance.now();
      
      console.log(`${name} 执行时间: ${endTime - startTime}ms`);
      return result;
    };
  }
}
```

## 构建优化

### 1. Webpack 优化

```javascript
// next.config.js
module.exports = {
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
  
  // 压缩配置
  compress: true,
  
  // 图片优化
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 2. 包分析

```bash
# 分析包大小
npm run build
npx @next/bundle-analyzer

# 查看依赖关系
npm ls --depth=0
```

### 3. 树摇优化

```typescript
// 按需导入
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// 避免全量导入
// ❌ import * as UI from '@/components/ui';
// ✅ import { Button, Card } from '@/components/ui';
```
