# PerfPulseAI 项目文档

欢迎来到 PerfPulseAI 项目文档中心。本文档提供完整的项目概览、技术文档导航和开发指南。

## 📖 项目概述

PerfPulseAI 是一个企业级的性能管理和积分系统，提供完整的用户管理、积分系统、通知系统和组织管理功能。项目采用前后端分离架构，前端使用 Next.js + React，后端使用 FastAPI + Python。

## 🏗️ 系统架构

```
PerfPulseAI
├── 前端 (Next.js + React + TypeScript)
│   ├── 用户界面和交互
│   ├── 状态管理和数据获取
│   └── 组件库和样式系统
├── 后端 (FastAPI + Python)
│   ├── API 接口和业务逻辑
│   ├── 数据库模型和服务
│   └── 认证和权限控制
└── 数据库 (PostgreSQL + Redis)
    ├── 主数据存储
    └── 缓存和会话管理
```

## 📚 文档导航

### 🎯 快速开始
- [📋 项目概述](./README.md) - 项目介绍和文档导航（本文档）
- [📝 更新日志](./docs/CHANGELOG.md) - 版本更新和变更记录

### 🖥️ 前端文档
- [📋 前端概述](../frontend/docs/README.md)                    - 前端项目概述和快速开始
- [🏛️ 架构设计](../frontend/docs/ARCHITECTURE.md)              - 前端架构和设计原则
- [🧩 组件库  ](../frontend/docs/COMPONENTS.md)                - 组件使用指南和开发规范
- [🔌 API 集成](../frontend/docs/API.md)                       - API 调用和数据管理
- [🎨 样式指南](../frontend/docs/STYLING.md)                   - 样式规范和主题系统
- [🔔 通知与时区](../frontend/docs/module/notify-time.md)      - 通知功能与时区处理
- [🔐 权限管理](../frontend/docs/PERMISSION_MANAGEMENT.md)     - 权限控制机制
- [📈 性能优化](../frontend/docs/PERFORMANCE.md)               - 性能优化策略和最佳实践

### 🔧 后端文档
- [📋 后端概述    ](../backend/docs/README.md)                 - 后端项目概述和快速开始
- [🏛️ 后端架构    ](../backend/docs/BACKEND_ARCHITECTURE.md)   - 系统整体架构、技术栈、目录结构
- [🗄️ 数据库设计  ](../backend/docs/DATABASE_DESIGN.md)        - 数据模型、表结构、关系设计
- [⚙️ 核心模块    ](../backend/docs/CORE_MODULES.md)           - 各功能模块的详细说明
- [🔌 API 接口    ](../backend/docs/API_DOCUMENTATION.md)      - 完整的 REST API 接口说明
- [🛒 积分商城    ](../backend/docs/MALL_BUSINESS_PROCESS.md)  - 商城购买、兑换码核销、通知机制
- [💰 积分系统](../backend/docs/POINTS_SYSTEM.md)             - 积分机制、等级系统、事务处理
- [🔗 GitHub 同步](../backend/docs/README_GitHub_Sync.md)     - GitHub 数据同步和 PR 分析
- [🔒 安全认证](../backend/docs/SECURITY_AUTHENTICATION.md)   - RSA 加密、用户认证、权限控制
- [🚀 部署运维](../backend/docs/DEPLOYMENT_OPERATIONS.md)     - 部署指南、运维操作、监控配置
- [📋 重构总结](../backend/docs/REFACTORING_SUMMARY.md)       - 系统重构历程和改进记录

## 🚀 快速开始

### 环境要求
- **前端**: Node.js 18+, npm/yarn
- **后端**: Python 3.9+, PostgreSQL 12+, Redis 6+
- **开发工具**: Git, Docker (可选)

### 本地开发环境搭建

#### 1. 克隆项目
```bash
git clone <repository-url>
cd PerfPulseAI
```

#### 2. 后端设置
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 数据库迁移
alembic upgrade head

# 启动后端服务
python app/run.py
```

#### 3. 前端设置
```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 启动前端服务
npm run dev
```

#### 4. 访问应用
- 前端: http://localhost:3000
- 后端 API: http://localhost:5000
- API 文档: http://localhost:5000/docs

## 🎯 核心功能

### 1. 用户认证系统
- JWT Token 认证
- RSA 加密登录
- 权限控制
- 会话管理

### 2. 积分系统
- 积分获取和消费
- 等级系统
- 事务处理
- 积分转账

### 3. 积分商城
- 商品管理
- 购买流程
- 兑换码系统
- 核销机制

### 4. 通知系统
- 实时 SSE 推送
- 通知分类
- 批量操作
- 时区自动转换

### 5. 组织管理
- 公司管理
- 部门管理
- 成员管理
- 权限分配

## 🛠️ 技术栈

### 前端技术栈
- **Next.js 14** - React 全栈框架
- **React 18** - 用户界面库
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Shadcn/ui** - 组件库
- **SWR** - 数据获取

### 后端技术栈
- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **PostgreSQL** - 主数据库
- **Redis** - 缓存
- **Alembic** - 数据库迁移
- **JWT** - 认证

## 📝 开发规范

### 代码提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

### 分支管理
- `main` - 主分支，生产环境代码
- `develop` - 开发分支，集成测试
- `feature/*` - 功能分支
- `hotfix/*` - 热修复分支

## 🔧 常用命令

### 前端命令
```bash
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run type-check   # 类型检查
```

### 后端命令
```bash
python app/run.py                    # 启动开发服务器
alembic upgrade head                 # 数据库迁移
alembic revision --autogenerate     # 创建迁移
pytest                              # 运行测试
black .                             # 代码格式化
```

## 🚀 部署指南

### Docker 部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 生产环境配置
1. 配置环境变量
2. 设置数据库连接
3. 配置 Redis 缓存
4. 设置反向代理
5. 配置 SSL 证书

## 🤝 贡献指南

### 参与贡献
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

### 文档贡献
- 发现文档错误或不足时，欢迎提交 Issue 或 PR
- 新增功能需要同步更新相关文档
- 遵循文档格式和风格规范

## 🆘 获取帮助

### 常见问题
- 查看相关文档章节
- 搜索已有的 Issue
- 检查环境配置

### 联系方式
- 提交 GitHub Issue
- 查看项目文档
- 联系项目维护者

---

**最后更新**: 2025-08-08  
**文档版本**: v1.0.0  
**项目状态**: 开发中
