# PerfPulseAI API 接口文档

## 1. API 概述

### 1.1 基本信息
- **Base URL**: `http://localhost:5000` (开发环境)
- **API 版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8
- **认证方式**: RSA 加密 + 用户会话

### 1.2 通用响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "statusCode": 200
}
```

### 1.3 错误响应格式
```json
{
  "success": false,
  "data": {},
  "message": "错误描述",
  "statusCode": 400
}
```

### 1.4 HTTP 状态码
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

## 2. 认证系统 API

### 2.1 获取公钥
**接口**: `POST /api/auth/public_key`
**描述**: 获取 RSA 公钥用于加密敏感数据
**请求参数**: 无
**响应示例**:
```json
{
  "success": true,
  "data": {
    "public_key": "-----BEGIN PUBLIC KEY-----\n..."
  },
  "message": "获取公钥成功"
}
```

### 2.2 用户登录
**接口**: `POST /api/auth/login`
**描述**: 用户登录认证
**请求参数**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
或加密格式:
```json
{
  "encrypted": "RSA加密后的数据"
}
```
**响应示例**:
```json
{
  "success": true,
  "data": {
    "email": "user@example.com",
    "name": "用户名",
    "userId": 1
  },
  "message": "登录成功"
}
```

### 2.3 用户注册
**接口**: `POST /api/auth/register`
**描述**: 新用户注册
**请求参数**:
```json
{
  "name": "用户名",
  "email": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "email": "user@example.com",
    "name": "用户名"
  },
  "message": "注册成功"
}
```

### 2.4 验证邀请码
**接口**: `POST /api/auth/verify-invite-code`
**描述**: 验证组织邀请码
**请求参数**:
```json
{
  "inviteCode": "INVITE123"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "valid": true
  },
  "message": "邀请码验证成功"
}
```

## 3. 用户管理 API

### 3.1 获取用户信息
**接口**: `GET /api/users/{user_id}`
**描述**: 获取指定用户的详细信息
**路径参数**:
- `user_id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "用户名",
    "email": "user@example.com",
    "position": "开发工程师",
    "phone": "13800138000",
    "githubUrl": "https://github.com/username",
    "avatarUrl": "https://example.com/avatar.jpg",
    "joinDate": "2024-01-01",
    "points": 1500,
    "level": 3,
    "completedTasks": 25,
    "pendingTasks": 5,
    "companyId": 1,
    "departmentId": 1,
    "department": {
      "id": 1,
      "name": "技术部"
    },
    "company": {
      "id": 1,
      "name": "示例公司"
    }
  },
  "message": "获取用户信息成功"
}
```

### 3.2 更新用户信息
**接口**: `POST /api/users/{user_id}/updateInfo`
**描述**: 更新用户基本信息
**路径参数**:
- `user_id`: 用户ID

**请求参数**:
```json
{
  "name": "新用户名",
  "position": "高级开发工程师",
  "phone": "13900139000",
  "githubUrl": "https://github.com/newusername",
  "departmentId": 2
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "新用户名",
    "position": "高级开发工程师"
  },
  "message": "更新用户信息成功"
}
```

### 3.3 上传用户头像
**接口**: `POST /api/users/{user_id}/avatar`
**描述**: 上传用户头像
**路径参数**:
- `user_id`: 用户ID

**请求参数**: 
- `file`: 图片文件 (multipart/form-data)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://example.com/avatars/user_1_avatar.jpg"
  },
  "message": "头像上传成功"
}
```

## 4. 公司管理 API

### 4.1 获取公司列表
**接口**: `GET /api/companies`
**描述**: 获取用户创建的公司列表
**权限要求**: 需要用户认证
**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "示例公司",
      "description": "这是一个示例公司",
      "domain": "example.com",
      "inviteCode": "ABC123",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00",
      "userCount": 10,
      "departmentCount": 3,
      "organizationCount": 5
    }
  ],
  "message": "获取公司列表成功"
}
```

### 4.2 创建公司
**接口**: `POST /api/companies`
**描述**: 创建新公司
**权限要求**: `company.create`
**请求参数**:
```json
{
  "name": "新公司",
  "description": "公司描述",
  "domain": "newcompany.com",
  "creatorUserId": 1
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "新公司",
    "description": "公司描述",
    "domain": "newcompany.com",
    "inviteCode": "XYZ789",
    "isActive": true,
    "createdAt": "2024-01-02T00:00:00",
    "updatedAt": "2024-01-02T00:00:00",
    "userCount": 0,
    "departmentCount": 0,
    "organizationCount": 0
  },
  "message": "创建公司成功"
}
```

### 4.3 更新公司信息
**接口**: `PUT /api/companies/{company_id}`
**描述**: 更新公司信息
**权限要求**: 公司创建者权限
**路径参数**:
- `company_id`: 公司ID

**请求参数**:
```json
{
  "name": "更新后的公司名",
  "description": "更新后的描述",
  "domain": "updated.com"
}
```

### 4.4 删除公司
**接口**: `DELETE /api/companies/{company_id}`
**描述**: 删除公司
**权限要求**: 公司创建者权限
**路径参数**:
- `company_id`: 公司ID

### 4.5 加入公司
**接口**: `POST /api/companies/{company_id}/join`

**描述**: 用户加入公司

**路径参数**:
- `company_id`: 公司ID

**请求参数**:
```json
{
  "userId": 1
}
```

### 4.6 退出公司
**接口**: `POST /api/companies/{company_id}/leave`
**描述**: 用户退出公司
**路径参数**:
- `company_id`: 公司ID
**请求参数**:
```json
{
  "userId": 1
}
```

## 5. 部门管理 API

### 5.1 获取部门列表
**接口**: `GET /api/departments`
**描述**: 获取用户所在公司的部门列表
**权限要求**: 需要用户认证且已加入公司
**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "技术部",
      "companyId": 1,
      "description": "",
      "isActive": true,
      "memberCount": 8,
      "activeMembersCount": 6,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00"
    }
  ],
  "message": "获取组织列表成功"
}
```

### 5.2 创建部门
**接口**: `POST /api/departments`
**描述**: 创建新部门
**权限要求**: `department.create`
**请求参数**:
```json
{
  "name": "新部门",
  "companyId": 1
}
```

### 5.3 获取部门详情
**接口**: `GET /api/departments/{department_id}`
**描述**: 获取部门详细信息和成员列表
**路径参数**:
- `department_id`: 部门ID
**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "技术部",
    "companyId": 1,
    "memberCount": 8,
    "activeMembersCount": 6,
    "members": [
      {
        "id": "1",
        "name": "张三",
        "email": "zhangsan@example.com",
        "avatar": "https://example.com/avatar1.jpg",
        "initials": "张",
        "title": "开发工程师",
        "joinDate": "2024-01-01",
        "performanceScore": 1500,
        "kpis": {
          "codeCommits": 50,
          "leadTasks": 30,
          "bugsFixed": 5,
          "newFeatures": 8
        }
      }
    ]
  },
  "message": "获取组织详情成功"
}
```

### 5.4 加入部门
**接口**: `POST /api/departments/{department_id}/join`
**描述**: 用户加入部门
**路径参数**:
- `department_id`: 部门ID
**请求参数**:
```json
{
  "userId": 1
}
```

### 5.5 批量关联公司
**接口**: `POST /api/departments/associate-company`
**描述**: 将所有部门批量关联到指定公司
**权限要求**: `department.update`
**请求参数**:
```json
{
  "companyId": 1
}
```

## 6. 权限管理 API

### 6.1 获取权限定义
**接口**: `GET /api/permissions/definitions`
**描述**: 获取系统权限定义（无需认证）
**响应示例**:
```json
{
  "success": true,
  "data": {
    "user": {
      "name": "用户管理",
      "permissions": [
        {
          "name": "user.create",
          "displayName": "创建用户",
          "description": "创建新用户的权限"
        }
      ]
    },
    "company": {
      "name": "公司管理",
      "permissions": [
        {
          "name": "company.create",
          "displayName": "创建公司",
          "description": "创建新公司的权限"
        }
      ]
    }
  },
  "message": "获取权限定义成功"
}
```

### 6.2 获取用户权限
**接口**: `GET /api/permissions/user/{user_id}`
**描述**: 获取用户的所有权限
**权限要求**: `permission.read`
**路径参数**:
- `user_id`: 用户ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "userPermissions": ["user.read", "company.read"],
    "rolePermissions": {
      "管理员": [
        {
          "id": 1,
          "name": "user.read",
          "displayName": "查看用户"
        }
      ]
    }
  },
  "message": "获取用户权限成功"
}
```

### 6.3 检查用户权限
**接口**: `GET /api/permissions/check/{user_id}?permissions=user.read,company.read`
**描述**: 检查用户是否具有指定权限
**权限要求**: `permission.read`
**路径参数**:
- `user_id`: 用户ID
**查询参数**:
- `permissions`: 逗号分隔的权限列表

**响应示例**:
```json
{
  "success": true,
  "data": {
    "permissionResults": {
      "user.read": true,
      "company.read": false
    }
  },
  "message": "权限检查完成"
}
```

## 7. 活动管理 API

### 7.1 获取活动列表
**接口**: `GET /api/activities`
**描述**: 获取用户的活动列表
**权限要求**: 需要用户认证
**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 10)
- `status`: 状态筛选 (pending, completed, rejected)

**响应示例**:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "pr_node_id_123",
        "showId": "uuid-123",
        "title": "修复登录bug",
        "description": "修复用户登录时的验证问题",
        "points": 150,
        "status": "completed",
        "activityType": "individual",
        "prUrl": "https://github.com/repo/pull/123",
        "prNumber": 123,
        "repositoryName": "example-repo",
        "createdAt": "2024-01-01T00:00:00",
        "updatedAt": "2024-01-01T00:00:00"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10
  },
  "message": "获取活动列表成功"
}
```

### 7.2 创建活动
**接口**: `POST /api/activities`
**描述**: 创建新活动
**权限要求**: `activity.create`
**请求参数**:
```json
{
  "title": "新功能开发",
  "description": "开发用户管理新功能",
  "points": 200,
  "userId": 1,
  "activityType": "individual"
}
```

## 8. 奖励系统 API
### 8.1 获取奖励列表
**接口**: `GET /api/rewards`
**描述**: 获取可兑换奖励列表
**查询参数**:
- `category`: 奖励分类
- `available`: 是否可用 (true/false)
**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "reward-uuid-123",
      "name": "咖啡券",
      "description": "星巴克咖啡券一张",
      "cost": 100,
      "icon": "https://example.com/coffee-icon.png",
      "available": true,
      "category": "food",
      "likes": 25,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-01T00:00:00"
    }
  ],
  "message": "获取奖励列表成功"
}
```

### 8.2 兑换奖励
**接口**: `POST /api/rewards/{reward_id}/redeem`
**描述**: 兑换指定奖励
**路径参数**:
- `reward_id`: 奖励ID

**请求参数**:
```json
{
  "userId": 1,
  "notes": "兑换备注"
}
```

### 8.3 获取兑换记录
**接口**: `GET /api/redemptions`
**描述**: 获取用户兑换记录
**查询参数**:
- `userId`: 用户ID
- `status`: 状态筛选
- `page`: 页码
- `limit`: 每页数量

## 9. 健康检查 API

### 9.1 健康检查
**接口**: `GET /api/health`
**描述**: 检查API服务器状态
**响应示例**:
```json
{
  "status": "ok",
  "code": 200,
  "message": "API服务器运行正常"
}
```

## 10. 错误处理

### 10.1 常见错误码
- `AUTH_001`: 认证失败
- `PERM_001`: 权限不足
- `VALID_001`: 参数验证失败
- `DB_001`: 数据库操作失败
- `FILE_001`: 文件操作失败

### 10.2 错误响应示例
```json
{
  "success": false,
  "data": {},
  "message": "用户名或密码错误",
  "statusCode": 401,
  "errorCode": "AUTH_001"
}
```
