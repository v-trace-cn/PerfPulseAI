# PerfPulseAI 核心功能模块文档

## 1. 用户管理模块

### 1.1 模块概述
用户管理模块负责处理用户的注册、登录、信息管理等核心功能，是整个系统的基础模块。

### 1.2 核心功能

#### 1.2.1 用户认证
- **密码加密**: 使用 PBKDF2 算法进行密码哈希
- **RSA 加密**: 敏感数据传输使用 RSA 公钥加密
- **会话管理**: 基于用户ID的会话状态管理

<path="backend/app/models/user.py">
````python
def set_password(self, password):
    """设置密码哈希"""
    self.password_hash = pwd_context.hash(password)

def check_password(self, password):
    """验证密码"""
    return pwd_context.verify(password, self.password_hash)
````

#### 1.2.2 用户信息管理
- **基本信息**: 姓名、邮箱、职位、电话等
- **扩展信息**: GitHub URL、头像、加入日期等
- **组织关系**: 公司归属、部门归属
- **积分等级**: 用户积分、等级、任务统计

#### 1.2.3 头像管理
- **文件上传**: 支持图片文件上传
- **存储路径**: 本地文件系统存储
- **URL 生成**: 自动生成访问URL

### 1.3 数据模型

<path="backend/app/models/user.py">
````python
class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200))
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)
    department_id = Column(Integer, ForeignKey('departments.id'), nullable=True)
````


### 1.4 API 端点
- `GET /api/users/{user_id}`: 获取用户信息
- `POST /api/users/{user_id}/updateInfo`: 更新用户信息
- `POST /api/users/{user_id}/avatar`: 上传头像

## 2. 组织架构模块

### 2.1 模块概述
组织架构模块实现了公司-部门-用户的三级组织结构，支持多公司、多部门的复杂组织管理。

### 2.2 公司管理

#### 2.2.1 核心功能
- **公司创建**: 用户可创建公司并成为创建者
- **邀请码机制**: 每个公司生成唯一邀请码
- **成员管理**: 用户加入/退出公司
- **权限控制**: 创建者拥有公司管理权限

<path="backend/app/models/company.py">
````python
class Company(Base):
    __tablename__ = 'companies'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    invite_code = Column(String(20), unique=True, nullable=False)
    creator_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
````


#### 2.2.2 邀请码生成
```python
def generate_invite_code(self):
    """生成6位随机邀请码"""
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
```

### 2.3 部门管理

#### 2.3.1 核心功能
- **部门创建**: 在公司下创建部门
- **成员管理**: 用户加入部门
- **批量操作**: 部门批量关联公司
- **数据统计**: 部门成员数量统计

<path="backend/app/models/department.py">
````python
class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
````


#### 2.3.2 组织关系约束
- 用户必须先加入公司才能加入部门
- 用户只能加入所属公司的部门
- 部门必须关联到公司

### 2.4 API 端点
- `GET /api/companies`: 获取公司列表
- `POST /api/companies`: 创建公司
- `POST /api/companies/{id}/join`: 加入公司
- `GET /api/departments`: 获取部门列表
- `POST /api/departments`: 创建部门

## 3. 权限管理模块

### 3.1 模块概述
基于角色的访问控制 (RBAC) 系统，实现细粒度的权限管理。

### 3.2 权限模型

#### 3.2.1 权限定义
<path="backend/app/models/permission.py">
````python
class Permission(Base):
    __tablename__ = 'permissions'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
````


#### 3.2.2 角色定义
<path="backend/app/models/role.py">
````python
class Role(Base):
    __tablename__ = 'roles'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    permissions = relationship('Permission', secondary=role_permissions)
````


### 3.3 权限检查机制

#### 3.3.1 装饰器权限检查
<path="backend/app/core/permissions.py">
````python
class PermissionChecker:
    def __init__(self, required_permissions: List[str]):
        self.required_permissions = required_permissions
    
    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        user = await get_current_user(request, db)
        for permission in self.required_permissions:
            if not user.has_permission(permission):
                raise HTTPException(status_code=403, detail="权限不足")
        return user
````


#### 3.3.2 预定义权限检查器
```python
class PermissionCheckers:
    company_create = PermissionChecker(['company.create'])
    company_read = PermissionChecker(['company.read'])
    department_create = PermissionChecker(['department.create'])
    user_update = PermissionChecker(['user.update'])
```

### 3.4 权限分类
- **用户管理**: user.create, user.read, user.update, user.delete
- **公司管理**: company.create, company.read, company.update, company.delete
- **部门管理**: department.create, department.read, department.update, department.delete
- **角色管理**: role.create, role.read, role.update, role.delete
- **权限管理**: permission.create, permission.read, permission.update, permission.delete

## 4. 积分系统模块

### 4.1 模块概述
完整的积分获取、消费、争议处理机制，支持用户等级系统。

### 4.2 积分机制

#### 4.2.1 积分获取
- **活动完成**: 完成代码审查、PR合并等活动
- **AI评分**: 基于代码质量的智能评分
- **手动调整**: 管理员手动调整积分

#### 4.2.2 积分消费
- **奖励兑换**: 使用积分兑换奖励
- **特权购买**: 购买特殊权限或服务

#### 4.2.3 积分争议
- **争议提交**: 用户对积分变动提出争议
- **争议处理**: 管理员审核和处理争议

### 4.3 等级系统
- **等级计算**: 基于积分总数确定用户等级
- **等级权益**: 不同等级享有不同权益
- **等级展示**: 用户等级和进度展示

### 4.4 数据模型
```python
class PointTransaction(Base):
    __tablename__ = 'point_transactions'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    amount = Column(Integer, nullable=False)  # 积分变动数量
    transaction_type = Column(String(20), nullable=False)  # earn/spend
    source = Column(String(50), nullable=False)  # 积分来源
    description = Column(Text)
```

## 5. 活动管理模块

### 5.1 模块概述
管理用户的各种活动，主要包括代码贡献、任务完成等。

### 5.2 活动类型
- **个人活动**: individual - 个人完成的活动
- **团队活动**: team - 团队协作活动
- **系统活动**: system - 系统自动生成的活动

### 5.3 GitHub 集成

#### 5.3.1 PR 活动
<path="backend/app/models/activity.py">
````python
class Activity(Base):
    __tablename__ = 'activities'
    
    id = Column(String(200), primary_key=True)  # PR node_id
    title = Column(String(200), nullable=False)
    points = Column(Integer, default=0)
    user_id = Column(Integer, ForeignKey('users.id'))
    pr_url = Column(String(500))
    pr_number = Column(Integer)
````


#### 5.3.2 活动状态
- **pending**: 待处理
- **completed**: 已完成
- **rejected**: 已拒绝

### 5.4 积分计算
- **基础积分**: 根据活动类型给予基础积分
- **AI评分**: 结合代码质量进行智能评分
- **手动调整**: 管理员可手动调整积分

## 6. 奖励系统模块

### 6.1 模块概述
提供积分兑换奖励的完整流程，包括奖励管理、兑换记录、状态跟踪。

### 6.2 奖励管理

#### 6.2.1 奖励分类
- **实物奖励**: 咖啡券、礼品卡等
- **虚拟奖励**: 特权、徽章等
- **体验奖励**: 培训机会、活动参与等

<path="backend/app/models/reward.py">
````python
class Reward(Base):
    __tablename__ = 'rewards'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    cost = Column(Integer, nullable=False)  # 兑换所需积分
    category = Column(String(50))
    available = Column(Boolean, default=True)
````


### 6.3 兑换流程

#### 6.3.1 兑换记录
```python
class Redemption(Base):
    __tablename__ = 'redemptions'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    reward_id = Column(String(36), ForeignKey('rewards.id'), nullable=False)
    points_used = Column(Integer, nullable=False)
    status = Column(String(20), default='pending')
```

#### 6.3.2 兑换状态
- **pending**: 待处理
- **approved**: 已批准
- **rejected**: 已拒绝
- **completed**: 已完成

### 6.4 奖励建议
- **用户建议**: 用户可以建议新的奖励
- **AI推荐**: 基于用户行为推荐合适的奖励
- **管理审核**: 管理员审核奖励建议

## 7. 积分商城模块

### 7.1 模块概述
积分商城是新一代的积分兑换系统，提供更完善的商品管理、购买流程和核销机制。相比传统奖励系统，商城支持兑换码机制和双向通知系统。

### 7.2 核心功能

#### 7.2.1 商品管理
- **商品展示**: 支持商品图片、描述、分类、标签
- **库存管理**: 商品库存数量和可用性控制
- **分类筛选**: 按分类浏览商品
- **价格管理**: 灵活的积分定价机制

#### 7.2.2 购买流程
- **积分验证**: 购买前验证用户积分余额
- **兑换码生成**: 购买成功后生成唯一兑换码
- **订单管理**: 完整的购买记录和状态管理
- **配送信息**: 支持配送地址和联系方式

#### 7.2.3 核销机制
- **兑换码验证**: 管理员验证兑换码有效性
- **一键核销**: 管理员一键完成商品核销
- **状态更新**: 自动更新购买状态和完成时间
- **双向通知**: 用户和管理员都收到核销通知

### 7.3 业务流程

#### 7.3.1 完整兑换流程
1. **用户购买**: 用户在商城选择商品并使用积分购买
2. **生成兑换码**: 系统生成唯一兑换码
3. **私发管理员**: 用户将兑换码私发给管理员
4. **管理员核销**: 管理员验证并核销兑换码
5. **通知发送**: 系统向双方发送核销通知

#### 7.3.2 通知机制
- **用户通知**: "兑换码核销成功 - 您的兑换码已被管理员核销，商品：{商品名称}"
- **管理员通知**: "核销操作完成 - 您已成功核销用户 {用户名} 的兑换码，商品：{商品名称}"
- **实时推送**: 通过 SSE 实时推送通知
- **持久化存储**: 通知保存到数据库供后续查看

### 7.4 数据模型

#### 7.4.1 购买记录
```python
class PointPurchase(Base):
    __tablename__ = 'point_purchases'

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    item_id = Column(String(50), nullable=False)
    item_name = Column(String(200), nullable=False)
    points_cost = Column(Integer, nullable=False)  # 后端存储格式
    status = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING)
    redemption_code = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
```

#### 7.4.2 通知记录
```python
class Notification(Base):
    __tablename__ = 'notifications'

    id = Column(String(36), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(NotificationStatus), default=NotificationStatus.UNREAD)
    extra_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, nullable=False)
    read_at = Column(DateTime, nullable=True)
```

**性能优化索引：**
```sql
-- 用户通知查询索引
CREATE INDEX idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- 未读通知统计索引
CREATE INDEX idx_notifications_user_status
ON notifications(user_id, status);

-- 通知类型查询索引
CREATE INDEX idx_notifications_user_type_created
ON notifications(user_id, type, created_at DESC);

-- 复合查询索引
CREATE INDEX idx_notifications_user_status_type_created
ON notifications(user_id, status, type, created_at DESC);
```

### 7.5 状态管理

#### 7.5.1 购买状态
- **PENDING**: 待核销（用户已购买，等待管理员核销）
- **COMPLETED**: 已完成（管理员已核销）
- **CANCELLED**: 已取消（取消购买并退还积分）

#### 7.5.2 通知状态
- **UNREAD**: 未读
- **READ**: 已读
- **ARCHIVED**: 已归档

### 7.6 安全特性
- **兑换码唯一性**: 使用 UUID 确保兑换码唯一性
- **一次性使用**: 兑换码核销后立即失效
- **权限控制**: 只有管理员可以核销兑换码
- **事务安全**: 积分扣除和退还都有完整事务记录

## 8. 安全机制

### 7.1 数据加密
- **传输加密**: RSA公钥加密敏感数据传输
- **存储加密**: 密码使用PBKDF2哈希存储
- **会话安全**: 安全的会话管理机制

### 7.2 权限控制
- **API权限**: 每个API端点都有相应的权限要求
- **数据权限**: 用户只能访问有权限的数据
- **操作权限**: 关键操作需要特定权限

### 7.3 输入验证
- **参数验证**: 所有输入参数进行严格验证
- **SQL注入防护**: 使用ORM防止SQL注入
- **XSS防护**: 输出数据进行适当转义

## 9. 异步处理

### 9.1 数据库操作
- **异步查询**: 所有数据库操作使用异步方式
- **连接池**: 使用连接池提高性能
- **事务管理**: 支持异步事务处理

### 9.2 文件操作
- **异步上传**: 文件上传使用异步处理
- **流式处理**: 大文件使用流式处理
- **错误处理**: 完善的异步错误处理机制

### 9.3 外部API调用
- **HTTP客户端**: 使用异步HTTP客户端
- **超时控制**: 设置合理的超时时间
- **重试机制**: 失败请求的重试机制
