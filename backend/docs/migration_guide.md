# 数据库迁移标准操作指南

基于编码共识：Jobs式产品直觉 + Rams式功能纯粹主义

## 🎯 核心原则

1. **永不妥协的品质** - 每个迁移都必须完美无缺
2. **功能纯粹主义** - 每个迁移文件只做一件事
3. **可预测性** - 迁移结果必须可预测和可重现

## 📋 标准工作流程

### 1. 修改模型后的标准流程

```bash
# 1. 查看当前状态
python scripts/migration_manager.py status

# 2. 创建新迁移（自动检测模型变化）
python scripts/migration_manager.py create "描述你的修改"

# 3. 检查生成的迁移文件
# 手动检查 alembic/versions/ 中的新文件

# 4. 应用迁移
python scripts/migration_manager.py apply

# 5. 验证结果
python scripts/migration_manager.py status
```

### 2. 迁移文件命名规范

```
格式：YYYYMMDD_HHMM_功能描述.py
示例：
- 20241219_1500_add_user_avatar.py
- 20241219_1530_create_notification_system.py
- 20241219_1600_optimize_user_indexes.py
```

### 3. 迁移分类

```
01_foundation/     # 基础表结构
02_core_features/  # 核心功能
03_extensions/     # 扩展功能
04_optimizations/  # 性能优化
```

## 🔧 常用命令

### 基础操作

```bash
# 查看当前迁移状态
python -m alembic current

# 查看所有head版本
python -m alembic heads

# 查看迁移历史
python -m alembic history --verbose

# 应用所有迁移
python -m alembic upgrade head

# 回退到指定版本
python -m alembic downgrade <revision_id>
```

### 高级操作

```bash
# 创建空迁移文件
python -m alembic revision -m "描述"

# 自动生成迁移（推荐）
python -m alembic revision --autogenerate -m "描述"

# 合并多个head
python -m alembic merge -m "merge description" head1 head2

# 查看SQL而不执行
python -m alembic upgrade head --sql

# 查看特定版本之间的差异
python -m alembic show <revision_id>

# 标记当前数据库为特定版本（不执行迁移）
python -m alembic stamp <revision_id>
```

## 🚨 紧急情况处理

### 迁移冲突解决

```bash
# 1. 备份当前迁移
python scripts/migration_manager.py backup

# 2. 查看冲突的heads
python -m alembic heads

# 3. 智能清理（保留最近10个文件）
python scripts/migration_manager.py clean

# 4. 智能清理（保留最近5个文件）
python scripts/migration_manager.py clean 5

# 5. 手动合并heads
python -m alembic merge -m "merge heads" head1 head2

# 6. 完全重置（危险操作！）
python scripts/migration_manager.py reset
```

### 数据恢复

```bash
# 1. 从备份恢复迁移文件
cp alembic/versions_backup/backup_YYYYMMDD_HHMMSS/* alembic/versions/

# 2. 重置数据库到指定版本
alembic downgrade <safe_revision>

# 3. 重新应用迁移
alembic upgrade head
```

## 🗂️ 迁移文件管理

### 智能清理策略

当迁移文件过多时，使用智能清理功能：

```bash
# 查看当前迁移文件数量
python scripts/migration_manager.py status

# 备份所有迁移文件
python scripts/migration_manager.py backup

# 智能清理，保留最近10个文件（推荐）
python scripts/migration_manager.py clean 10

# 保守清理，保留最近15个文件
python scripts/migration_manager.py clean 15

# 激进清理，只保留最近5个文件
python scripts/migration_manager.py clean 5
```

### 迁移文件命名最佳实践

```bash
# 好的命名示例
20241219_1500_add_user_avatar.py
20241219_1530_create_notification_system.py
20241219_1600_optimize_user_indexes.py

# 避免的命名
revision_abc123.py
untitled_migration.py
fix_bug.py
```

### 迁移文件组织

```
alembic/versions/
├── 20241201_xxxx_foundation_tables.py      # 基础表
├── 20241202_xxxx_user_system.py            # 用户系统
├── 20241203_xxxx_notification_system.py    # 通知系统
├── 20241204_xxxx_pr_tracking_system.py     # PR跟踪
├── 20241205_xxxx_points_system.py          # 积分系统
└── ...
```

### 调试技巧

```bash
# 查看将要执行的SQL
python -m alembic upgrade head --sql > migration.sql

# 逐步执行迁移
python -m alembic upgrade +1

# 查看详细日志
python -m alembic -x verbose=true upgrade head

# 使用迁移管理器查看状态
python scripts/migration_manager.py status

# 干运行（查看但不执行）
python -m alembic upgrade head --sql
```


## 🎯 总结

遵循这个指南，确保：
- ✅ 每次模型修改都有对应的迁移
- ✅ 迁移文件清晰、可读、可维护
- ✅ 数据安全和完整性
- ✅ 可预测的迁移结果
- ✅ 完善的错误处理和回退机制

**记住：完美的迁移系统是高质量应用的基础！**
