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

### 2.1 用户管理模块

#### 2.1.1 用户表 (users)
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(200),
    company_id INTEGER REFERENCES companies(id),
    department_id INTEGER REFERENCES departments(id),
    position VARCHAR(100),
    phone VARCHAR(20),
    github_url VARCHAR(200) UNIQUE,
    avatar_url VARCHAR(255),
    join_date DATE DEFAULT CURRENT_DATE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    level_id VARCHAR(36) REFERENCES user_levels(id),
    completed_tasks INTEGER DEFAULT 0,
    pending_tasks INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 用户唯一标识符
- `name`: 用户姓名
- `email`: 用户邮箱，用于登录认证
- `password_hash`: 密码哈希值 (PBKDF2)
- `company_id`: 所属公司ID
- `department_id`: 所属部门ID
- `position`: 职位
- `phone`: 联系电话
- `github_url`: GitHub 个人主页
- `avatar_url`: 头像URL
- `join_date`: 加入日期
- `points`: 积分总数
- `level`: 用户等级
- `level_id`: 等级详情ID
- `completed_tasks`: 已完成任务数
- `pending_tasks`: 待处理任务数

**索引**:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_department_id ON users(department_id);
CREATE INDEX idx_users_github_url ON users(github_url);
```

#### 2.1.2 用户等级表 (user_levels)
```sql
CREATE TABLE user_levels (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER,
    benefits TEXT,
    icon VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 组织架构模块

#### 2.2.1 公司表 (companies)
```sql
CREATE TABLE companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    domain VARCHAR(100) UNIQUE,
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    creator_user_id INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 公司唯一标识符
- `name`: 公司名称
- `description`: 公司描述
- `domain`: 公司域名标识
- `invite_code`: 公司邀请码
- `creator_user_id`: 创建者用户ID
- `is_active`: 是否激活状态

**索引**:
```sql
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_invite_code ON companies(invite_code);
CREATE INDEX idx_companies_creator_user_id ON companies(creator_user_id);
```

#### 2.2.2 部门表 (departments)
```sql
CREATE TABLE departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 部门唯一标识符
- `name`: 部门名称
- `company_id`: 所属公司ID

**索引**:
```sql
CREATE INDEX idx_departments_company_id ON departments(company_id);
CREATE UNIQUE INDEX idx_departments_name_company ON departments(name, company_id);
```

### 2.3 权限管理模块

#### 2.3.1 权限表 (permissions)
```sql
CREATE TABLE permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 权限唯一标识符
- `name`: 权限名称 (如: user.create, company.read)
- `display_name`: 显示名称
- `description`: 权限描述
- `category`: 权限分类 (user, company, department等)
- `is_system_permission`: 是否为系统预定义权限

**索引**:
```sql
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_category ON permissions(category);
```

#### 2.3.2 角色表 (roles)
```sql
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    is_system_role BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 角色唯一标识符
- `name`: 角色名称
- `description`: 角色描述
- `company_id`: 所属公司ID
- `is_system_role`: 是否为系统预定义角色
- `is_active`: 是否激活状态

**索引**:
```sql
CREATE INDEX idx_roles_company_id ON roles(company_id);
CREATE UNIQUE INDEX idx_roles_name_company ON roles(name, company_id);
```

#### 2.3.3 角色权限关联表 (role_permissions)
```sql
CREATE TABLE role_permissions (
    role_id INTEGER REFERENCES roles(id),
    permission_id INTEGER REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);
```

#### 2.3.4 用户角色关联表 (user_roles)
```sql
CREATE TABLE user_roles (
    user_id INTEGER REFERENCES users(id),
    role_id INTEGER REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);
```

### 2.4 活动管理模块

#### 2.4.1 活动表 (activities)
```sql
CREATE TABLE activities (
    id VARCHAR(200) PRIMARY KEY,
    show_id VARCHAR(36) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    activity_type VARCHAR(50) DEFAULT 'individual',
    pr_url VARCHAR(500),
    pr_number INTEGER,
    repository_name VARCHAR(200),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 活动唯一标识符 (通常为PR的node_id)
- `show_id`: 显示用的UUID
- `title`: 活动标题
- `description`: 活动描述
- `points`: 获得积分
- `user_id`: 关联用户ID
- `status`: 状态 (pending, completed, rejected)
- `activity_type`: 活动类型
- `pr_url`: Pull Request URL
- `pr_number`: PR 编号
- `repository_name`: 仓库名称

**索引**:
```sql
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_show_id ON activities(show_id);
```

### 2.5 奖励系统模块

#### 2.5.1 奖励表 (rewards)
```sql
CREATE TABLE rewards (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    icon VARCHAR(200),
    available BOOLEAN DEFAULT TRUE,
    category VARCHAR(50),
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 奖励唯一标识符
- `name`: 奖励名称
- `description`: 奖励描述
- `cost`: 兑换所需积分
- `icon`: 奖励图标
- `available`: 是否可用
- `category`: 奖励分类
- `likes`: 点赞数

**索引**:
```sql
CREATE INDEX idx_rewards_category ON rewards(category);
CREATE INDEX idx_rewards_available ON rewards(available);
```

#### 2.5.2 兑换记录表 (redemptions)
```sql
CREATE TABLE redemptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reward_id VARCHAR(36) NOT NULL REFERENCES rewards(id),
    points_used INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**字段说明**:
- `id`: 兑换记录唯一标识符
- `user_id`: 兑换用户ID
- `reward_id`: 兑换奖励ID
- `points_used`: 使用积分数
- `status`: 兑换状态 (pending, approved, rejected)
- `notes`: 备注信息

**索引**:
```sql
CREATE INDEX idx_redemptions_user_id ON redemptions(user_id);
CREATE INDEX idx_redemptions_reward_id ON redemptions(reward_id);
CREATE INDEX idx_redemptions_status ON redemptions(status);
```

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
