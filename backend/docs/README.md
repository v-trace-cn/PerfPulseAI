# PerfPulseAI 后端文档中心

## 📚 文档概览

本目录包含 PerfPulseAI 后端系统的完整技术文档，涵盖架构设计、API接口、核心模块、业务流程等各个方面。

## 📖 文档目录

### 🏗️ 架构与设计
- **[后端架构文档](BACKEND_ARCHITECTURE.md)** - 系统整体架构、技术栈、目录结构
- **[数据库设计文档](DATABASE_DESIGN.md)** - 数据模型、表结构、关系设计
- **[核心模块文档](CORE_MODULES.md)** - 各功能模块的详细说明

### 🔌 API 接口
- **[API 接口文档](API_DOCUMENTATION.md)** - 完整的 REST API 接口说明

### 💼 业务流程
- **[积分商城业务流程](MALL_BUSINESS_PROCESS.md)** - 商城购买、兑换码核销、通知机制
- **[GitHub 同步说明](README_GitHub_Sync.md)** - GitHub 数据同步和 PR 分析
- **[积分系统文档](POINTS_SYSTEM.md)** - 积分机制、等级系统、事务处理

### 🔐 安全与认证
- **[安全认证文档](SECURITY_AUTHENTICATION.md)** - RSA 加密、用户认证、权限控制

### 🚀 部署与运维
- **[部署运维文档](DEPLOYMENT_OPERATIONS.md)** - 部署指南、运维操作、监控配置

### 📝 开发记录
- **[重构总结文档](REFACTORING_SUMMARY.md)** - 系统重构历程和改进记录


## 🔧 快速开始

### 1. 环境准备
```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
```

### 2. 数据库初始化
```bash
# 运行数据库迁移
alembic upgrade head
```

### 3. 启动服务
```bash
# 开发模式启动
python app/run.py

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

### 4. API 测试
```bash
# 健康检查
curl http://localhost:5000/api/health

# 获取 API 文档
# 访问 http://localhost:5000/docs
```

## 📋 API 概览

### 认证系统
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出

### 积分系统
- `GET /api/points/balance` - 获取积分余额
- `GET /api/points/summary` - 获取积分统计
- `GET /api/points/transactions` - 获取积分交易记录

### 积分商城
- `GET /api/mall/items` - 获取商品列表
- `POST /api/mall/purchase` - 购买商品
- `POST /api/mall/verify-redemption-code` - 验证兑换码
- `POST /api/mall/redeem-code` - 核销兑换码

### 通知系统
- `GET /api/notifications/stream` - SSE 通知流
- `GET /api/notifications` - 获取通知列表
- `POST /api/notifications/{id}/read` - 标记通知已读

## 🎨 核心特性

### ✅ 已实现功能
- 🔐 **用户认证系统** - RSA 加密、会话管理
- 💰 **积分系统** - 获取、消费、等级、争议处理
- 🛒 **积分商城** - 商品购买、兑换码核销
- 🔔 **通知系统** - 实时通知、SSE 推送
- 👥 **组织管理** - 公司、部门、权限管理
- 📊 **活动管理** - GitHub PR 分析、AI 评分
- 🎁 **奖励系统** - 奖励兑换、记录管理

### 🔄 开发中功能
- 📈 **数据分析** - 用户行为分析、积分趋势
- 🤖 **AI 增强** - 智能推荐、自动评分优化
- 📱 **移动端支持** - 响应式设计、PWA 支持

## 🤝 贡献指南

1. **阅读文档** - 先阅读相关的技术文档
2. **遵循规范** - 遵循代码规范和 API 设计原则
3. **测试覆盖** - 确保新功能有完整的测试覆盖
4. **文档更新** - 及时更新相关文档

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 📧 **邮箱**: info@v-trace.cn
- 💬 **讨论**: GitHub Issues
- 📖 **文档**: 本文档目录

**最后更新**: 2025-07-31  
**版本**: v1.0.0
