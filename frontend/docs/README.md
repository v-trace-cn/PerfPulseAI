# PerfPulseAI Frontend Documentation

## 概述

PerfPulseAI 前端是一个基于 Next.js 14 构建的现代化 React 应用程序，采用 TypeScript 开发，提供企业级的性能管理和积分系统界面。

## 技术栈

### 核心框架
- **Next.js 14** - React 全栈框架，支持 App Router
- **React 18** - 用户界面库
- **TypeScript** - 类型安全的 JavaScript 超集

### UI 组件库
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Shadcn/ui** - 基于 Radix UI 的组件库
- **Lucide React** - 图标库
- **Recharts** - 图表库

### 状态管理与数据获取
- **React Context** - 用户认证状态管理
- **SWR** - 数据获取和缓存
- **React Hooks** - 本地状态管理

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **PostCSS** - CSS 处理

## 项目结构

```
frontend/
├── app/                    # Next.js App Router 页面
│   ├── api/               # API 路由
│   ├── dashboard/         # 仪表板页面
│   ├── notifications/     # 通知中心
│   ├── org/              # 组织管理
│   └── points/           # 积分系统
├── components/            # 可复用组件
│   ├── ui/               # 基础 UI 组件
│   ├── dashboard/        # 仪表板组件
│   └── forms/            # 表单组件
├── lib/                  # 工具库和配置
│   ├── hooks/            # 自定义 Hooks
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数
├── public/               # 静态资源
└── docs/                 # 文档
```

## 核心功能模块

### 1. 用户认证系统
- JWT 令牌认证
- RSA 加密登录
- 会话管理
- 权限控制

### 2. 仪表板系统
- 实时数据展示
- 图表可视化
- 性能指标监控
- 任务管理

### 3. 积分系统
- 积分获取和消费
- 等级系统
- 兑换记录
- 争议处理

### 4. 组织管理
- 公司管理
- 部门管理
- 成员管理
- 权限分配

### 5. 通知系统
- 实时通知
- 通知分类
- 已读/未读状态
- 通知中心

## 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 开发指南

### 代码规范
- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 组件使用 PascalCase 命名
- 文件使用 kebab-case 命名

### 组件开发
- 优先使用函数组件和 Hooks
- 使用 React.memo 优化性能
- 遵循单一职责原则
- 编写可复用的组件

### 状态管理
- 使用 React Context 管理全局状态
- 使用 SWR 处理服务器状态
- 使用 useState 和 useReducer 管理本地状态

## 部署

### 环境变量
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=PerfPulseAI
```

### Docker 部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 相关文档

- [架构设计](./ARCHITECTURE.md)
- [组件库](./COMPONENTS.md)
- [API 集成](./API.md)
- [样式指南](./STYLING.md)
- [性能优化](./PERFORMANCE.md)
- [测试指南](./TESTING.md)

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License
