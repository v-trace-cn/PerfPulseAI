# 数据库迁移管理指南

## 概述

本项目使用 Alembic 作为数据库迁移管理工具。所有数据库结构变更都应该通过正式的 Alembic 迁移文件进行管理。

## 迁移文件结构

```
backend/alembic/
├── versions/                           # 迁移文件目录
│   ├── consolidated_001_*.py          # 基础多租户设置
│   ├── 002_consolidated_points_*.py   # 积分系统
│   ├── 003_create_notifications_*.py  # 通知系统
│   ├── 004_add_redemption_code_*.py   # 兑换码功能
│   └── ...                           # 其他迁移文件
├── env.py                             # Alembic 环境配置
├── script.py.mako                     # 迁移文件模板
└── alembic.ini                        # Alembic 配置文件
```

## 迁移命名规范

### 文件命名
- 使用语义化的版本号：`001_`, `002_`, `003_`...
- 使用描述性的名称：`create_notifications_table`, `add_redemption_code`
- 格式：`{version}_{description}.py`

### Revision ID 命名
- 使用简短的描述性 ID
- 格式：`{version}_{feature}`
- 示例：`002_consolidated_points`, `003_notifications`

## 创建新迁移

### 1. 自动生成迁移（推荐）
```bash
# 基于模型变更自动生成迁移
alembic revision --autogenerate -m "Add new feature"

# 检查生成的迁移文件并手动调整
```

### 2. 手动创建迁移
```bash
# 创建空白迁移文件
alembic revision -m "Manual migration description"

# 编辑生成的文件，添加 upgrade() 和 downgrade() 函数
```

## 迁移最佳实践

### 1. 迁移文件结构
```python
def upgrade() -> None:
    """Upgrade schema."""
    # 1. 创建表
    # 2. 添加列
    # 3. 创建索引
    # 4. 添加约束
    # 5. 数据迁移
    # 6. 清理工作

def downgrade() -> None:
    """Downgrade schema."""
    # 按相反顺序撤销所有操作
```

### 2. 数据安全
- **备份重要数据**：在数据迁移前创建备份表
- **事务保护**：确保迁移在事务中执行
- **回滚支持**：提供完整的 downgrade 实现
- **数据验证**：迁移后验证数据完整性

### 3. 性能考虑
- **批量操作**：大量数据迁移使用批量操作
- **索引优化**：先删除索引，迁移数据后重建
- **分批处理**：大表迁移分批进行
- **维护窗口**：在低峰期执行大型迁移

### 4. 约束和索引
```python
# 创建约束
op.create_check_constraint(
    'ck_table_column_valid',
    'table_name',
    "column IN ('value1', 'value2')"
)

# 创建索引
op.create_index('idx_table_column', 'table_name', ['column'])

# 创建唯一约束
op.create_unique_constraint(
    'uq_table_column',
    'table_name',
    ['column']
)
```

## 执行迁移

### 开发环境
```bash
# 升级到最新版本
alembic upgrade head

# 升级到指定版本
alembic upgrade 002_consolidated_points

# 查看当前版本
alembic current

# 查看迁移历史
alembic history --verbose
```

### 生产环境
```bash
# 1. 备份数据库
# 2. 检查迁移计划
alembic upgrade --sql head > migration.sql

# 3. 执行迁移
alembic upgrade head

# 4. 验证结果
```

## 回滚迁移

```bash
# 回滚到上一个版本
alembic downgrade -1

# 回滚到指定版本
alembic downgrade 002_consolidated_points

# 查看回滚 SQL（不执行）
alembic downgrade --sql -1
```

## 故障排除

### 常见问题

1. **迁移冲突**
   ```bash
   # 查看分支状态
   alembic branches
   
   # 合并分支
   alembic merge -m "Merge branches" head1 head2
   ```

2. **迁移失败**
   ```bash
   # 标记迁移为已执行（谨慎使用）
   alembic stamp head
   
   # 手动修复数据库后重新执行
   ```

3. **版本不一致**
   ```bash
   # 检查数据库版本
   alembic current
   
   # 重置到指定版本
   alembic stamp version_id
   ```

## 禁止的做法

### ❌ 不要做的事情
1. **直接修改数据库**：绕过迁移系统直接修改数据库结构
2. **修改已提交的迁移**：修改已经在生产环境执行的迁移文件
3. **删除迁移文件**：删除已经执行的迁移文件
4. **跳过迁移**：强制标记迁移为已执行而不实际运行
5. **临时脚本**：使用临时脚本代替正式迁移

### ✅ 正确的做法
1. **使用 Alembic**：所有数据库变更都通过 Alembic 迁移
2. **测试迁移**：在开发环境充分测试后再应用到生产
3. **版本控制**：迁移文件纳入版本控制
4. **文档记录**：重要迁移添加详细注释和文档
5. **团队协作**：迁移变更及时同步给团队成员

## 迁移检查清单

### 提交前检查
- [ ] 迁移文件语法正确
- [ ] upgrade() 和 downgrade() 都已实现
- [ ] 在开发环境测试通过
- [ ] 大型迁移考虑性能影响
- [ ] 添加必要的注释和文档

### 生产部署前检查
- [ ] 数据库已备份
- [ ] 迁移计划已审查
- [ ] 回滚方案已准备
- [ ] 维护窗口已安排
- [ ] 团队已通知
