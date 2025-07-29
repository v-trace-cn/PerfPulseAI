# PerfPulseAI

PerfPulseAI 是一个 FastAPI 驱动的全栈应用，用于 AI 绩效管理和激励机制。

## 项目概述

PerfPulseAI 旨在通过 AI 技术自动化梳理员工绩效，提供透明的激励机制，促进团队协作和个人成长。该项目采用 FastAPI 作为全栈解决方案，既提供后端 API 服务，也负责渲染前端页面。

## 部署流程

1. **后端部署**
   - 安装Python和依赖: `pip install -r backend/requirements.txt`
   - 配置环境变量: 复制 `backend/.env.example` 到 `backend/.env` 并修改
   - 启动API服务器: `python backend/app/run.py`

2. **前端部署**
   - 安装Node.js和依赖: `cd frontend && npm install` 或者 `npm install --legacy-peer-deps`
   - 开发模式: `npm run dev`
   - 生产构建: `npm run build`


## 项目结构

```
perfPulseAI/
├── README.md                  # 项目说明文档
├── LICENSE                    # 开源许可证
├── .gitignore                 # Git忽略文件
│
├── docs/                      # 项目文档
│   ├── architecture.md        # 架构设计文档
│   └──deployment.md           # 部署指南
│
├── backend/                   # FastAPI 后端应用
│   ├── app/                   # FastAPI 应用代码
│   │   ├── main.py            # FastAPI 应用入口
│   │   ├── api/               # 路由模块
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── activity.py
│   │   │   ├── reward.py
│   │   │   ├── webhook.py
│   │   │   └── scoring.py
│   ├── requirements.txt       # Python依赖
│   ├── .env.example           # 环境变量示例
│
└── frontend/
   ├── hooks/
   │   ├── use-mobile.tsx          # 统一的移动端检测
   │   └── useApi.ts              # API 调用 hook
   ├── lib/
   │   ├── toast-context.tsx      # Toast Context 提供者
   │   ├── toast-utils.ts         # Toast 工具函数
   │   ├── api.ts                 # Next.js API 路由调用
   │   └── direct-api.ts          # 直接后端 API 调用
   ├── components/ui/
   │   ├── use-toast.ts           # Toast hook 接口
   │   └── toaster.tsx            # Toast 渲染组件
   └── app/
      ├── globals.css            # 主要全局样式
      └── theme-vars.css         # 主题变量
```

## 项目解析

PerfPulseAI 是一个全栈性能管理系统，采用现代化的技术架构：
- 后端：FastAPI (Python) + SQLAlchemy ORM + SQLite 数据库
- 前端：Next.js 15 (TypeScript) + React 19 + Tailwind CSS
- 架构模式：面向服务的架构，REST API，关注点清晰分离

### 后端技术栈

- 核心框架：FastAPI 0.110.0，提供高性能异步API服务
- 数据库：SQLite + SQLAlchemy 2.0 + Alembic（数据库迁移）
- 异步支持：async/await 全栈异步编程
- 安全机制：RSA 加密传输（前端加密，后端解密）
- AI 集成：OpenAI API 集成，支持 AI 代码评审和积分计算
- 邮件服务：fastapi-mail 邮件通知系统

### 前端技术栈

- 核心框架：Next.js 15 + React 19，支持 App Router
- 状态管理：React Query (@tanstack/react-query) 数据获取和缓存
- UI 组件库：Radix UI + 自定义组件
- 样式系统：Tailwind CSS + CSS-in-JS
- 图标库：Lucide React 图标库
- 表单处理：React Hook Form + Zod 验证

### 核心功能模块

#### 积分系统

该核心模块，具有以下特点：
1. 积分存储机制：
   - 后端存储：整数形式，实际值放大10倍存储
   - 前端展示：小数形式，实际值展示
   - 优势：避免浮点数精度问题，支持小数积分展示
2. 事件溯源设计：
   - 所有点变化都是不可变的交易记录
   - 交易类型：EARN(获得)、SPEND(消费)、ADJUST(调整)、OBJECTION(异议)
   - 争议窗口期：7天内可对积分分配提出争议
3. 等级系统：
   - 多等级设计，根据积分数量自动升级
   - 等级福利和权益系统
   - 进度条可视化等级进度
4. 积分商城：
   - 积分兑换系统
   - 商品库存管理
   - 兑换记录跟踪

#### 认证与安全

1. RSA 加密传输：
   - 前端使用公钥加密敏感信息（密码等）
   - 后端使用私钥解密，确保传输安全
2. 用户权限系统：
   - 基于角色的访问控制(RBAC)
   - 多租户支持（公司/部门结构）
   - 权限粒度控制
3. 会话管理：
   - 基于 JWT 的会话机制
   - 用户状态持久化

#### AI 代码评审系统

1. GitHub 集成：
   - PR 自动分析和评分
   - 代码质量评估
   - 创新性评分
2. 智能积分计算：
   - 基于 AI 评分结果自动计算积分
   - 支持重新评分和积分调整

### 数据库设计

核心数据表
- users：用户表，包含基本信息、积分、等级等
- point_transactions：积分交易记录表（事件溯源核心）
- user_levels：用户等级表
- point_purchases：积分商城消费记录表
- point_disputes：积分争议表
- activities：活动记录表
- companies：公司信息表
- departments：部门/组织结构
