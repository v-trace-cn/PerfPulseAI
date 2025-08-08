# PerfPulseAI 后端文档

欢迎来到 PerfPulseAI 后端技术文档。本文档提供完整的后端开发指南、架构说明和业务流程。

## 📖 文档导航

### 🏗️ 架构设计
- [📋 后端概述](./README.md) - 项目概述和快速开始（本文档）
- [🏛️ 后端架构](./BACKEND_ARCHITECTURE.md) - 系统整体架构、技术栈、目录结构
- [🗄️ 数据库设计](./DATABASE_DESIGN.md) - 数据模型、表结构、关系设计

### 🛠️ 核心模块
- [⚙️ 核心模块](./CORE_MODULES.md) - 各功能模块的详细说明
- [🔌 API 接口](./API_DOCUMENTATION.md) - 完整的 REST API 接口说明

### 🚀 业务流程
- [🛒 积分商城](./MALL_BUSINESS_PROCESS.md) - 商城购买、兑换码核销、通知机制
- [💰 积分系统](./POINTS_SYSTEM.md) - 积分机制、等级系统、事务处理
- [🔗 GitHub 同步](./README_GitHub_Sync.md) - GitHub 数据同步和 PR 分析

### 🔐 安全与部署
- [🔒 安全认证](./SECURITY_AUTHENTICATION.md) - RSA 加密、用户认证、权限控制
- [🚀 部署运维](./DEPLOYMENT_OPERATIONS.md) - 部署指南、运维操作、监控配置

### 📝 开发记录
- [📋 重构总结](./REFACTORING_SUMMARY.md) - 系统重构历程和改进记录

## 🚀 快速开始

### 环境要求
- Python 3.9+
- PostgreSQL 12+
- Redis 6+

### 安装和运行
```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件配置数据库连接等
```

### 数据库初始化
```bash
# 运行数据库迁移
alembic upgrade head

# 创建初始数据（可选）
python scripts/init_data.py
```

### 启动服务
```bash
# 开发模式启动
python app/run.py

# 或使用 uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

### API 测试
```bash
# 健康检查
curl http://localhost:5000/api/health

# 获取 API 文档
# 访问 http://localhost:5000/docs (Swagger UI)
# 访问 http://localhost:5000/redoc (ReDoc)
```

## 🛠️ 技术栈

### 核心框架
- **FastAPI** - 现代、快速的 Web 框架
- **SQLAlchemy** - Python SQL 工具包和 ORM
- **Alembic** - 数据库迁移工具
- **Pydantic** - 数据验证和设置管理

### 数据库
- **PostgreSQL** - 主数据库
- **Redis** - 缓存和会话存储

### 认证和安全
- **JWT** - JSON Web Token 认证
- **RSA** - 非对称加密
- **bcrypt** - 密码哈希

### 开发工具
- **pytest** - 测试框架
- **black** - 代码格式化
- **flake8** - 代码检查

## 📁 项目结构

```
backend/
├── app/                    # 应用主目录
│   ├── api/               # API 路由
│   ├── core/              # 核心配置
│   ├── models/            # 数据模型
│   ├── services/          # 业务逻辑
│   ├── utils/             # 工具函数
│   └── main.py           # 应用入口
├── alembic/               # 数据库迁移
├── tests/                 # 测试文件
├── scripts/               # 脚本文件
└── docs/                  # 技术文档
```

## 📋 API 概览

### 认证系统
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/me` - 获取当前用户信息

### 积分系统
- `GET /api/points/balance` - 获取积分余额
- `GET /api/points/summary` - 获取积分统计
- `GET /api/points/transactions` - 获取积分交易记录
- `POST /api/points/transfer` - 积分转账

### 积分商城
- `GET /api/mall/items` - 获取商品列表
- `POST /api/mall/purchase` - 购买商品
- `POST /api/mall/verify-redemption-code` - 验证兑换码
- `POST /api/mall/redeem-code` - 核销兑换码
- `GET /api/mall/redemption-records` - 获取兑换记录

### 通知系统
- `GET /api/notifications/stream` - SSE 通知流
- `GET /api/notifications` - 获取通知列表
- `POST /api/notifications/mark-read` - 标记已读
- `DELETE /api/notifications/{id}` - 删除通知

### 组织管理
- `GET /api/companies` - 获取公司列表
- `POST /api/companies` - 创建公司
- `GET /api/departments` - 获取部门列表
- `POST /api/departments` - 创建部门

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
- 时区处理

### 5. 组织管理
- 公司管理
- 部门管理
- 成员管理
- 权限分配

## 📝 开发规范

### 代码风格
- 使用 Python 3.9+ 特性
- 遵循 PEP 8 代码规范
- 使用 black 进行代码格式化
- 使用 flake8 进行代码检查

### API 设计
```python
# API 路由示例
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/example", tags=["example"])

@router.get("/")
async def get_examples(
    current_user: User = Depends(get_current_user)
):
    """获取示例列表"""
    return {"examples": []}
```

### 数据模型
```python
# 数据模型示例
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class Example(Base):
    __tablename__ = "examples"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
```

## 🔧 常用命令

```bash
# 开发
python app/run.py        # 启动开发服务器
alembic upgrade head     # 运行数据库迁移
alembic revision --autogenerate -m "message"  # 创建迁移

# 测试
pytest                   # 运行测试
pytest --cov            # 运行测试并生成覆盖率报告

# 代码质量
black .                  # 格式化代码
flake8 .                # 检查代码质量
```

## 🤝 贡献指南

### 开发流程
1. 从 main 分支创建功能分支
2. 进行开发并确保代码质量
3. 运行测试确保功能正常
4. 提交 Pull Request

### 提交规范
```bash
# 提交格式
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "docs: 更新文档"
git commit -m "refactor: 代码重构"
```

## 🆘 故障排除

### 常见问题
1. **数据库连接失败**: 检查 .env 文件中的数据库配置
2. **依赖安装失败**: 确保 Python 版本正确，使用虚拟环境
3. **迁移失败**: 检查数据库权限和连接状态
4. **API 响应慢**: 检查数据库查询和索引

### 获取帮助
- 查看相关文档章节
- 检查日志文件
- 查看项目 Issue 和 PR
- 联系项目维护者

---

**最后更新**: 2025-08-08
**文档版本**: v1.0.0
