# GitHub数据同步工具使用说明

## 概述

本工具用于将GitHub仓库的PR数据同步到PerfPulseAI系统中，自动创建活动记录并生成积分。

## 脚本文件

### 1. `sync_github_data.py` - 完整版同步脚本

**功能特性:**
- 支持真实GitHub API调用（需要Personal Access Token）
- 自动匹配GitHub用户名到系统用户
- 智能积分计算（基于代码变更量）
- 支持预览模式和执行模式
- 自动重新生成积分交易记录

**使用方法:**
```bash
python sync_github_data.py
```

**配置要求:**
- GitHub Personal Access Token（可选，不提供则使用模拟数据）
- 需要安装 `aiohttp` 库：`pip install aiohttp`

### 2. `simple_github_sync.py` - 简化版同步脚本

**功能特性:**
- 预配置的仓库和用户映射
- 基于现有活动数据的模拟PR数据
- 一键同步，无需额外配置
- 自动处理重复数据

**使用方法:**
```bash
python simple_github_sync.py
```

**预配置信息:**
- 仓库: PerfPulseAI, ai-agent, agent-pro, frontend
- 用户映射: 6个GitHub用户到系统用户的映射

## 积分计算规则

### 基础积分
- 每个PR基础积分: 5分

### 额外积分
- 代码新增: 每10行 +1分（最多+5分）
- 代码删除: 每20行 +1分（最多+3分）
- 修改文件: 每个文件 +1分（最多+3分）

### 积分上限
- 单个PR最多: 15分

## 用户映射配置

在 `simple_github_sync.py` 中修改 `USER_MAPPING` 字典：

```python
USER_MAPPING = {
    "github_username": user_id,  # GitHub用户名 -> 系统用户ID
    "yanruyu-zhao": 1,           # 示例
    "juxiong-huang": 3,
    # ... 更多映射
}
```

## 数据同步流程

1. **检查现有数据**: 避免重复创建活动
2. **匹配用户**: 根据GitHub用户名匹配系统用户
3. **创建/更新活动**: 
   - 新PR -> 创建新活动
   - 已存在PR -> 更新活动信息
4. **计算积分**: 根据PR代码变更量计算积分
5. **重新生成积分记录**: 更新积分交易记录和用户余额

## 安全特性

- **预览模式**: 可以先预览同步结果，不实际修改数据
- **重复检测**: 自动检测并处理重复的活动记录
- **事务处理**: 使用数据库事务确保数据一致性
- **错误处理**: 完善的错误处理和回滚机制

## 故障排除

### 常见错误

1. **UNIQUE constraint failed: activities.id**
   - 原因: 活动ID重复
   - 解决: 使用安全模式脚本清理重复数据

2. **Module not found: aiohttp**
   - 原因: 缺少依赖库
   - 解决: `pip install aiohttp`

3. **GitHub API rate limit**
   - 原因: API调用频率过高
   - 解决: 使用Personal Access Token或减少调用频率

### 数据修复

如果数据出现问题，可以使用以下步骤修复：

1. 备份数据库
2. 清理重复活动记录
3. 重新生成积分交易记录
4. 验证用户积分余额

## 最佳实践

1. **首次使用**: 建议先使用预览模式查看同步结果
2. **定期同步**: 建议每周或每月同步一次
3. **数据备份**: 同步前备份数据库
4. **用户映射**: 及时更新GitHub用户名映射
5. **积分规则**: 根据团队需要调整积分计算规则

## 扩展功能

### 添加新仓库
在 `GITHUB_REPOS` 列表中添加新的仓库URL：

```python
GITHUB_REPOS = [
    "https://github.com/your-org/repo1",
    "https://github.com/your-org/repo2",
    # 添加新仓库
]
```

### 自定义积分规则
修改 `calculate_pr_points` 方法来实现自定义积分计算逻辑。

### 添加新用户
在 `USER_MAPPING` 中添加新的用户映射关系。

## 技术架构

- **数据库**: SQLite with SQLAlchemy ORM
- **异步处理**: asyncio + aiosqlite
- **GitHub API**: REST API v3
- **错误处理**: 完整的异常捕获和日志记录

## 更新日志

- **v1.0**: 基础同步功能
- **v1.1**: 添加积分计算和用户匹配
- **v1.2**: 增加安全模式和错误处理
- **v1.3**: 支持周统计和完善的数据验证

## 联系支持

如有问题或建议，请联系开发团队。
