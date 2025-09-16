# 角色管理 API 设计方案

## 设计原则：混合设计模式

我们采用混合设计模式来平衡单个资源操作和批量操作的需求：

- **单个角色操作**：使用路径参数 `/{role_id}/`
- **批量角色操作**：使用专门的批量接口 `/batch/`

## API 接口设计

### 1. 单个角色操作

#### 1.1 获取角色状态
```
GET /api/roles/{role_id}/state
```
- **用途**：获取单个角色的完整状态信息
- **返回**：角色基础信息、权限列表、用户列表、统计信息

#### 1.2 更新角色状态
```
PUT /api/roles/{role_id}/state
```
- **用途**：更新单个角色的完整状态
- **支持**：基础信息、权限分配、用户分配的全量替换

### 2. 批量角色操作

#### 2.1 批量权限管理
```
PUT /api/roles/batch/permissions
```
- **用途**：批量管理多个角色的权限
- **操作类型**：grant(授予)、revoke(撤销)、replace(替换)

#### 2.2 批量状态管理
```
PUT /api/roles/batch/state
```
- **用途**：批量更新多个角色的完整状态
- **支持**：同时更新多个角色的所有属性

## 使用场景

### 单个角色操作场景
- 角色详情页面的查看和编辑
- 单个角色的权限配置
- 实时的角色状态更新

### 批量操作场景
- 权限管理界面的批量配置
- 角色模板的批量应用
- 组织架构调整时的批量更新

## 请求示例

### 单个角色状态更新
```json
PUT /api/roles/5/state
{
  "name": "高级管理员",
  "description": "拥有高级管理权限的角色",
  "isActive": true,
  "permissionIds": [1, 2, 3, 4],
  "userIds": [10, 20, 30]
}
```

### 批量角色状态更新
```json
PUT /api/roles/batch/state
{
  "companyId": 1,
  "roles": [
    {
      "roleId": 5,
      "name": "管理员",
      "permissionIds": [1, 2, 3],
      "userIds": [10, 20]
    },
    {
      "roleId": 6,
      "name": "普通用户",
      "permissionIds": [1],
      "userIds": [30, 40, 50]
    }
  ]
}
```

### 批量权限操作
```json
PUT /api/roles/batch/permissions
{
  "companyId": 1,
  "operations": [
    {
      "roleId": 5,
      "action": "grant",
      "permissionIds": [1, 2, 3]
    },
    {
      "roleId": 6,
      "action": "revoke",
      "permissionNames": ["user.delete"]
    }
  ]
}
```

## 设计优势

### 1. 语义清晰
- 单个资源操作：URL 直接表达操作对象
- 批量操作：明确的 `/batch/` 前缀表明批量性质

### 2. 性能优化
- 单个操作：最小化数据传输和处理
- 批量操作：减少网络请求次数

### 3. 缓存友好
- 单个资源有独立的缓存键
- 批量操作不影响单个资源的缓存

### 4. 扩展性强
- 可以独立优化单个和批量操作的性能
- 支持不同的权限控制策略

## 前端使用指南

### 角色详情页面
```typescript
// 获取角色状态
const response = await fetch(`/api/roles/${roleId}/state`)
const roleState = await response.json()

// 更新角色状态
await fetch(`/api/roles/${roleId}/state`, {
  method: 'PUT',
  body: JSON.stringify({
    name: '新角色名',
    permissionIds: [1, 2, 3]
  })
})
```

### 权限管理页面
```typescript
// 批量权限操作
await fetch('/api/roles/batch/permissions', {
  method: 'PUT',
  body: JSON.stringify({
    companyId: 1,
    operations: [
      { roleId: 5, action: 'grant', permissionIds: [1, 2] },
      { roleId: 6, action: 'revoke', permissionIds: [3, 4] }
    ]
  })
})

// 批量状态更新
await fetch('/api/roles/batch/state', {
  method: 'PUT',
  body: JSON.stringify({
    companyId: 1,
    roles: [
      { roleId: 5, name: '管理员', permissionIds: [1, 2, 3] },
      { roleId: 6, name: '用户', permissionIds: [1] }
    ]
  })
})
```

## 错误处理

所有接口都遵循统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "data": null
}
```

批量操作会返回详细的操作结果：

```json
{
  "success": true,
  "data": {
    "results": [
      { "roleId": 5, "success": true, "message": "更新成功" },
      { "roleId": 6, "success": false, "message": "权限不足" }
    ],
    "summary": {
      "total": 2,
      "success": 1,
      "failed": 1
    }
  }
}
```

## 权限控制

所有角色管理接口都要求：
- 用户已登录（提供有效的 X-User-Id）
- 用户是公司创建者或超级管理员
- 操作的角色属于用户有权限的公司

这种混合设计确保了 API 的灵活性、性能和可维护性，同时保持了清晰的语义和良好的用户体验。
