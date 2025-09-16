# PerfPulseAI 数据库设计文档

## 1. 数据库概述

### 1.1 数据库技术栈

- **开发环境**: SQLite 3.x
- **生产环境**: PostgreSQL 13+
- **ORM**: SQLAlchemy 2.0 (异步)
- **迁移工具**: Alembic
- **连接方式**: 异步连接池

### 1.2 设计原则

- **规范化设计**: 遵循第三范式，减少数据冗余
- **外键约束**: 保证数据完整性和一致性
- **软删除**: 重要数据采用软删除机制
- **审计字段**: 所有表包含创建时间和更新时间
- **索引优化**: 针对查询频繁的字段建立索引
- **类型安全**: 使用 SQLAlchemy 类型注解

## 2. 核心数据模型

| 表名                      | 描述                          | 地址（前缀/backend/app/models）        |
| ----------------------- | --------------------------- | -------------------------------- |
| users                   | 所有账号信息（员工、管理员等）             | #user.py                         |
| companies               | 公司 档案信息                     | #/tables/companies               |
| departments             | 公司下属部门树形结构，支持多级隶属关系         | #/tables/departments             |
| roles                   | 角色定义表，用于 RBAC 权限模型          | #/tables/roles                   |
| permissions             | 细粒度权限项，对应菜单、按钮、 API 等资源     | #/tables/permissions             |
| permission\_assignments | 角色与权限的多对多绑定关系，可级联继承         | #/tables/permission\_assignments |
| activities              | 员工日常行为记录，用于后续积分与治理评分        | #/tables/activities              |
| rewards                 | 可兑换奖品池，维护奖品名称、库存、所需积分等      | #/tables/rewards                 |
| redemptions             | 员工兑换记录，关联用户、奖品、消耗积分及状态      | #/tables/redemptions             |
| scoring\_criteria       | 积分规则头表，定义评分维度与周期            | #/tables/scoring\_criteria       |
| scoring\_factors        | 积分规则因子明细，权重、加减分逻辑、触发事件      | #/tables/scoring\_factors        |
| governance\_metrics     | 公司治理水平量化指标，含 ESG、合规、透明度等维度  | #/tables/governance\_metrics     |
| pull\_request\_results  | PR 合并后质量评估结果，含代码覆盖率、漏洞等级等   | #/tables/pull\_request\_results  |
| pull\_requests          | 代码合并请求主表，关联仓库、提交者、状态、审查人    | #/tables/pull\_requests          |
| pull\_request\_events   | PR 生命周期事件，打开、审查、评论、关闭、合并等   | #/tables/pull\_request\_events   |
| notifications           | 系统通知队列，支持站内、邮件、Webhook 等多通道 | #/tables/notifications           |

## 3. 关系设计

### 3.1 主要关系图

```
Company (1) ←→ (N) Department
Company (1) ←→ (N) User
Company (1) ←→ (N) Role
Department (1) ←→ (N) User
Role (N) ←→ (N) Permission
User (N) ←→ (N) Role
User (1) ←→ (N) Activity
User (1) ←→ (N) Redemption
Reward (1) ←→ (N) Redemption
```

### 3.2 关系约束

- **级联删除**: 公司删除时，相关部门、角色软删除
- **外键约束**: 所有外键关系强制约束
- **唯一约束**: 邮箱、公司名称、邀请码等关键字段唯一
- **检查约束**: 积分、等级等数值字段非负约束

## 4. 数据迁移管理

### 4.1 Alembic 配置

```python
# alembic/env.py
from app.core.database import Base
from app.models import *  # 导入所有模型

target_metadata = Base.metadata
```

### 4.2 迁移文件命名规范

```
YYYY_MM_DD_HHMM_description.py
例如: 2024_01_15_1430_create_user_table.py
```

### 4.3 迁移最佳实践

- 每次迁移只包含相关的变更
- 提供回滚脚本
- 数据迁移与结构迁移分离
- 生产环境迁移前备份

## 5. 性能优化

### 5.1 索引策略

- **主键索引**: 自动创建
- **外键索引**: 手动创建提升关联查询性能
- **唯一索引**: 保证数据唯一性
- **复合索引**: 针对多字段查询优化

### 5.2 查询优化

- 使用 `selectinload` 预加载关联数据
- 避免 N+1 查询问题
- 合理使用分页查询
- 缓存频繁查询结果

### 5.3 连接池配置

```python
# database.py
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=3600
)
```

## 6. 数据安全

### 6.1 敏感数据处理

- 密码使用 PBKDF2 哈希存储
- 个人信息加密存储
- 审计日志记录敏感操作

### 6.2 备份策略

- 定期自动备份
- 增量备份机制
- 异地备份存储
- 备份数据加密

### 6.3 访问控制

- 数据库用户权限最小化
- 连接加密 (SSL/TLS)
- IP 白名单限制
- 审计日志监控
