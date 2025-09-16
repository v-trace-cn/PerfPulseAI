# PerfPulseAI 后端架构文档

## 1. 项目概述

PerfPulseAI 是一个基于 FastAPI 的现代化 Web 应用后端，专注于性能管理和团队协作。系统采用异步架构设计，支持高并发访问，提供完整的用户管理、组织架构、权限控制和积分系统。

### 1.1 技术栈

- **Web 框架**: FastAPI 0.104+
- **数据库**: SQLite (开发环境) / PostgreSQL (生产环境)
- **ORM**: SQLAlchemy 2.0 (异步)
- **数据库迁移**: Alembic
- **认证加密**: RSA 加密 + 密码哈希 (PBKDF2)
- **API 文档**: OpenAPI/Swagger 自动生成
- **测试框架**: Pytest + pytest-asyncio
- **日志系统**: Python logging
- **任务队列**: 内置异步任务处理

### 1.2 核心特性

- 🔐 **安全认证**: RSA 加密传输 + 密码哈希存储
- 👥 **组织管理**: 公司-组织(部门)-用户三级组织架构
- 🛡️ **权限控制**: 基于角色的细粒度权限管理 (RBAC)
- 🎯 **积分系统**: 完整的积分获取、消费、争议处理机制
- 📊 **数据分析**: GitHub 集成的代码质量分析
- 🔄 **异步处理**: 全异步架构，支持高并发
- 📝 **API 文档**: 自动生成的交互式 API 文档

## 2. 项目结构

```
backend/
├── app/                          # 应用主目录
│   ├── main.py                   # FastAPI 应用入口
│   ├── run.py                    # 开发服务器启动脚本
│   ├── api/                      # API 路由模块
│   │   ├── __init__.py
│   │   ├── auth.py               # 认证相关 API
│   │   ├── user.py               # 用户管理 API
│   │   ├── company.py            # 公司管理 API
│   │   ├── department.py         # 部门管理 API
│   │   ├── permission.py         # 权限管理 API
│   │   ├── role.py               # 角色管理 API
│   │   ├── activity.py           # 活动管理 API
│   │   ├── reward.py             # 奖励系统 API
│   │   ├── scoring.py            # 评分系统 API
│   │   ├── webhook.py            # GitHub Webhook API
│   │   └── notification.py       # 通知系统 API
│   ├── core/                     # 核心功能模块
│   │   ├── __init__.py
│   │   ├── config.py             # 配置管理
│   │   ├── database.py           # 数据库连接配置
│   │   ├── security.py           # 安全相关功能
│   │   ├── permissions.py        # 权限检查器
│   │   ├── base_api.py           # API 基类
│   │   ├── decorators.py         # 装饰器
│   │   ├── init_db.py            # 数据库初始化
│   │   ├── seed_data.py          # 初始数据
│   │   └── ai_service.py         # AI 服务集成
│   ├── models/                   # 数据模型
│   │   ├── __init__.py
│   │   ├── user.py               # 用户模型
│   │   ├── company.py            # 公司模型
│   │   ├── department.py         # 部门模型
│   │   ├── role.py               # 角色模型
│   │   ├── permission.py         # 权限模型
│   │   ├── activity.py           # 活动模型
│   │   ├── reward.py             # 奖励模型
│   │   ├── scoring.py            # 评分模型
│   │   ├── pull_request.py       # PR 模型
│   │   └── pull_request_event.py # PR 事件模型
│   ├── repositories/             # 数据访问层
│   ├── services/                 # 业务逻辑层
│   ├── tasks/                    # 异步任务
│   └── static/                   # 静态文件
├── alembic/                      # 数据库迁移
│   ├── versions/                 # 迁移版本文件
│   ├── env.py                    # 迁移环境配置
│   └── alembic.ini               # Alembic 配置
├── tests/                        # 测试代码
│   ├── unit/                     # 单元测试
│   ├── integration/              # 集成测试
│   ├── e2e/                      # 端到端测试
│   └── fixtures/                 # 测试数据
├── docs/                         # 文档
├── logs/                         # 日志文件
├── db/                           # 数据库文件
├── scripts/                      # 脚本工具
├── requirements.txt              # 生产依赖
├── requirements-test.txt         # 测试依赖
└── pytest.ini                    # 测试配置
```

## 3. 架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────┐
│       API Layer (FastAPI)           │  ← HTTP 请求处理
├─────────────────────────────────────┤
│       Service Layer                 │  ← 业务逻辑处理
├─────────────────────────────────────┤
│       Repository Layer              │  ← 数据访问抽象
├─────────────────────────────────────┤
│       Model Layer (SQLAlchemy)      │  ← 数据模型定义
├─────────────────────────────────────┤
│       Database Layer (SQLite)       │  ← 数据持久化
└─────────────────────────────────────┘
```

### 3.2 核心组件

#### 3.2.1 应用入口 (main.py)
- FastAPI 应用实例创建
- CORS 中间件配置
- 自动路由注册机制
- 健康检查端点

#### 3.2.2 数据库层 (database.py)
- 异步 SQLAlchemy 引擎配置
- 会话管理
- 连接池配置
- 数据库依赖注入

#### 3.2.3 安全层 (security.py)
- RSA 密钥对生成和管理
- 数据加密/解密
- 密码哈希验证

#### 3.2.4 权限系统 (permissions.py)
- 基于装饰器的权限检查
- 角色权限映射
- 动态权限验证


## 4. 核心功能模块

### 4.1 认证系统
- RSA 公钥加密传输敏感数据
- 用户登录/注册
- 密码安全存储 (PBKDF2)
- 会话管理

### 4.2 组织架构
- 三级组织结构：公司 → 部门 → 用户
- 公司创建者权限管理
- 部门批量关联操作
- 用户组织关系管理

### 4.3 权限管理
- 基于角色的访问控制 (RBAC)
- 细粒度权限定义
- 动态权限检查
- 权限继承机制

### 4.4 积分系统
- 积分获取和消费
- 积分争议处理
- 积分购买记录
- 等级系统

### 4.5 GitHub 集成
- Webhook 事件处理
- PR 分析和评分
- 代码质量评估
- 自动化工作流
