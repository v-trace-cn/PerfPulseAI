# PerfPulseAI 更新日志

本文档记录 PerfPulseAI 项目的重要更新和变更历史。

---

## 2025-09-10 - 登录体验优化：记住账密 + 默认下次自动登录

### 🆕 新功能 / 🎨 界面优化 / 🔧 调整
- 合并“记住账号/记住密码”为“记住账密”，统一由单一复选项控制；勾选时保存邮箱与密码（密码以 base64 简单编码）用于下次表单回填；取消勾选会同时清理
- 移除“下次自动登录”的界面选项，默认开启下次自动登录（登录 token 存储于 localStorage，重启浏览器仍保持登录）
- 兼容旧数据：初始化时仍会读取 `login_remember_email`/`login_remember_pwd` 作为回退，随后统一使用 `login_remember_creds`
- 调整 Auth 持久化逻辑：
  - 登录：`login(email, password, autoLogin = true)` 支持可选参数；默认持久化至 localStorage；若传 `false` 则使用 sessionStorage
  - 初始化与刷新：优先读取 localStorage 的 token，若无则读取 sessionStorage
  - 登出：同时清理 localStorage 与 sessionStorage 中的 token

### 影响文件
- frontend/app/client-page.tsx
- frontend/lib/auth-context.tsx

### 测试建议
- 勾选“记住账密”登录 → 刷新后邮箱/密码自动回填；取消勾选后再次登录 → 不再回填
- 默认自动登录：登录成功后重启浏览器 → 仍为已登录；登出后 → 两处 token 均被清理
- 旧数据兼容：历史仅勾选过“记住账号”或“记住密码”的用户 → 本次自动等效为“记住账密”


## 2025-08-08 - 功能模块文档合并

### 📚 文档重组优化

#### 1. 通知与时区功能模块合并
- **合并**: 将 `NOTIFICATION_SYSTEM.md` 和 `TIMEZONE_HANDLING.md` 合并为单一功能文档
- **新位置**: `frontend/docs/module/notify-time.md`
- **优势**:
  - 消除重复内容（时区处理在两个文档中都有描述）
  - 统一维护入口，避免内容漂移
  - 符合功能模块化的文档组织原则

#### 2. 文档结构简化
- **新增**: `frontend/docs/module/` 目录专门存放功能性文档
- **简化**: 前端专项功能文档从3个减少到2个
- **命名**: 采用短小精简的命名风格 `notify-time.md`

#### 3. 导航链接更新
- **更新位置**:
  - `frontend/docs/README.md` - 前端文档导航
  - `docs/README.md` - 项目文档中心
  - `frontend/docs/COMPONENTS.md` - 时区处理工具引用
  - `frontend/docs/PERFORMANCE.md` - 时区处理缓存引用
- **兼容性**: 在原文档顶部添加迁移提示，避免外链失效

#### 4. 内容整合优化
- **去重**: 移除时区处理的重复描述
- **增强**: 统一的架构说明和使用示例
- **锚点**: 保留关键章节锚点便于深链接

---

## 2025-08-08 - 文档结构优化

### 📚 文档重组

#### 1. 通知与时区系统文档合并
- **优化**: 将前端通知系统和时区处理文档合并为统一的功能模块文档
- **位置**: `frontend/docs/module/notify-time.md`
- **内容**:
  - 完整的前后端架构说明
  - SSE实时推送系统
  - 时区处理集成
  - 性能优化策略
  - 使用示例和最佳实践

#### 2. 文档结构优化
- **新增**: 专门的 `module/` 目录存放功能性文档
- **合并**: 原 `NOTIFICATION_SYSTEM.md` 和 `TIMEZONE_HANDLING.md` 内容
- **简化**: 前端专项功能从3个文档减少到2个文档

#### 3. 文档交叉引用优化
- **优化**: 建立文档间的交叉引用关系
- **更新**: `COMPONENTS.md` 和 `PERFORMANCE.md` 中的时区处理引用
- **效果**: 避免重复内容，提升文档可维护性

#### 4. CHANGELOG 位置调整
- **移动**: 将 `docs/CHANGELOG.md` 移动到项目根目录
- **优化**: 改进更新日志的结构和分类
- **标准化**: 统一版本记录格式

### 🗂️ 文档结构规范

#### 前端文档分类
- **核心概念**: `README.md`, `ARCHITECTURE.md`
- **开发指南**: `API.md`, `COMPONENTS.md`, `STYLING.md`
- **专项功能**: `module/notify-time.md`, `PERMISSION_MANAGEMENT.md`
- **优化与测试**: `PERFORMANCE.md`

#### 后端文档分类
- **架构设计**: `BACKEND_ARCHITECTURE.md`, `DATABASE_DESIGN.md`
- **核心模块**: `CORE_MODULES.md`, `API_DOCUMENTATION.md`
- **业务流程**: `MALL_BUSINESS_PROCESS.md`, `POINTS_SYSTEM.md`
- **安全与部署**: `SECURITY_AUTHENTICATION.md`, `DEPLOYMENT_OPERATIONS.md`

---

## 2025-08-01 - 通知系统和用户体验优化

### 🔧 修复内容

#### 1. 通知中心时区问题修复
- **问题**: 通知时间显示不正确，未正确转换为中国时区（UTC+8）
- **解决方案**:
  - 后端：在时间序列化时添加'Z'后缀，明确标识为UTC时间
  - 前端：优化时区处理逻辑，确保正确转换为中国时区显示
- **影响文件**:
  - `backend/app/models/notification.py`
  - `backend/app/api/notifications.py`
  - `frontend/lib/timezone-utils.ts`

#### 2. 通知点击跳转功能
- **新增功能**: 点击通知中心的通知项可以跳转到通知详情页面
- **特性**:
  - 支持URL参数高亮显示指定通知
  - 自动滚动到高亮通知位置
  - 高亮样式（黄色背景和边框）
- **影响文件**:
  - `frontend/app/notifications/page.tsx`
  - `frontend/components/notification-center.tsx`

#### 3. 积分商城Toast优化
- **问题**: 兑换成功Toast显示兑换码，存在信息泄露风险
- **解决方案**: Toast只显示商品名称，兑换码信息在通知中心查看
- **影响文件**:
  - `frontend/hooks/useMallRedemption.ts`
  - `frontend/app/org/redemption/page.tsx`

### 🎨 界面优化

#### 1. 网站Logo集成
- **新增**: 将自定义logo.ico集成到网站
- **设置**: 配置favicon和网站标题
- **影响文件**:
  - `frontend/public/favicon.ico`
  - `frontend/app/layout.tsx`

#### 2. 页面显示优化
- **优化**: 兑换记录页面显示文本简化
- **修改**: 移除"共 X 条记录"文本，只保留"显示 X-Y 条"

### 📚 文档更新

#### 1. 前端组件文档
- **更新**: `frontend/docs/COMPONENTS.md`
- **新增内容**:
  - 通知组件的点击跳转功能说明
  - 时区处理工具文档
  - Toast优化说明

#### 2. 后端API文档
- **更新**: `backend/docs/API_DOCUMENTATION.md`
- **新增内容**:
  - 通知系统API完整文档
  - 时间格式说明（UTC+Z后缀）
  - SSE实时推送文档

#### 3. 业务流程文档
- **更新**: `backend/docs/MALL_BUSINESS_PROCESS.md`
- **新增内容**:
  - 用户体验优化章节
  - 安全性考虑说明
  - Toast简化的业务逻辑

### 🔒 安全性改进

#### 1. 兑换码信息保护
- **改进**: 兑换码不在公共Toast中显示
- **保护**: 只有购买者和管理员能在通知中心查看完整信息

#### 2. 权限控制
- **确保**: 通知跳转功能遵循现有权限体系
- **验证**: 用户只能查看自己的通知详情

### 🛠️ 技术改进

#### 1. 时区处理标准化
- **统一**: 后端统一返回UTC时间格式
- **自动**: 前端自动转换为用户本地时区
- **兼容**: 支持多种时间戳格式输入

#### 2. 组件复用性提升
- **优化**: 通知组件支持更多配置选项
- **扩展**: 时区工具函数可复用于其他时间显示场景

### 📋 测试建议

#### 1. 功能测试
- [x] 验证通知时间显示为正确的中国时区
- [x] 测试通知点击跳转和高亮功能
- [x] 确认兑换成功Toast只显示商品名称
- [x] 检查网站favicon是否正确显示

#### 2. 兼容性测试
- [x] 不同浏览器的时区显示一致性
- [x] 移动端通知跳转功能
- [x] 各种时间格式的正确处理

### 🔄 后续计划

#### 1. 功能扩展
- 考虑添加通知分类筛选功能
- 优化通知中心的性能和加载速度
- 添加通知已读状态的批量操作

#### 2. 用户体验
- 考虑添加通知声音提醒
- 优化移动端通知显示
- 添加通知偏好设置功能

---

## 版本记录格式说明

### 版本号规则
- 使用日期格式：YYYY-MM-DD
- 重大更新可添加版本号：v1.0.0

### 更新分类
- 🔧 **修复内容**: Bug修复和问题解决
- 🎨 **界面优化**: UI/UX改进
- 📚 **文档更新**: 文档新增和修改
- 🔒 **安全性改进**: 安全相关的改进
- 🛠️ **技术改进**: 技术架构和性能优化
- ⚡ **性能优化**: 性能相关的改进
- 🆕 **新功能**: 新增功能特性
- 🗂️ **结构调整**: 项目结构和组织调整

### 影响文件标注
每个重要更改都应标注影响的文件路径，便于追踪和回溯。

### 测试建议
重要更新应包含相应的测试建议和验证步骤。
