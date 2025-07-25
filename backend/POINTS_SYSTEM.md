# 积分系统实现文档

## 概述

本积分系统采用"后端放大10倍存储，前端缩小10倍展示"的设计，以避免浮点数精度问题，同时支持小数积分的展示。

## 核心设计原则

1. **后端存储**：所有积分以整数形式存储，实际值放大10倍
2. **前端展示**：所有积分以小数形式展示，实际值缩小10倍
3. **自动转换**：后端API自动处理转换，前端无需关心存储格式
4. **内部计算**：所有积分计算使用后端存储格式（整数），避免浮点数精度问题

## 转换规则

### 前端展示格式 → 后端存储格式
- 10.5 积分 → 105 存储
- 5.0 积分 → 50 存储
- 0.1 积分 → 1 存储

### 后端存储格式 → 前端展示格式
- 105 存储 → 10.5 积分
- 50 存储 → 5.0 积分
- 1 存储 → 0.1 积分

## 实现组件

### 1. PointConverter 转换器类

位置：`app/services/point_service.py`

```python
class PointConverter:
    SCALE_FACTOR = 10
    
    @classmethod
    def to_storage(cls, display_points: Union[int, float]) -> int:
        """前端展示格式 → 后端存储格式"""
        return int(float(display_points) * cls.SCALE_FACTOR)
    
    @classmethod
    def to_display(cls, storage_points: Union[int, float]) -> float:
        """后端存储格式 → 前端展示格式"""
        return float(storage_points) / cls.SCALE_FACTOR
    
    @classmethod
    def format_for_api(cls, storage_points: Union[int, float]) -> float:
        """格式化积分用于API返回（保留1位小数）"""
        return round(cls.to_display(storage_points), 1)
```

### 2. PointService 积分服务

主要方法修改：

- `earn_points()`: 支持 `is_display_amount` 参数控制输入格式
- `spend_points()`: 支持 `is_display_amount` 参数控制输入格式
- `get_user_balance_for_display()`: 返回前端展示格式的余额
- `get_user_statistics()`: 返回转换后的统计数据

### 3. 模型序列化

所有相关模型的 `to_dict()` 方法已更新：

- `PointTransaction.to_dict()`: 转换 amount 和 balanceAfter
- `PointPurchase.to_dict()`: 转换 pointsCost
- `User.to_dict()`: 转换 points
- `UserLevel.to_dict()`: 转换 minPoints 和 maxPoints

### 4. AI 服务积分计算

位置：`app/core/ai_service.py`

AI服务中的 `calculate_points_from_analysis()` 函数负责根据AI评分结果计算积分：

```python
async def calculate_points_from_analysis(analysis_score_result: dict) -> dict:
    """根据 AI 评分结果来进行计算积分（返回前端展示格式）"""
    overall_score = analysis_score_result.get("overall_score", 0)
    innovation_score = analysis_score_result.get("innovation_score", 0)

    # 基础积分：总分 * 0.1（前端展示格式）
    bonus_display = overall_score * 0.1

    # 创新加分：创新分数直接作为加分（前端展示格式）
    innovation_bonus_display = innovation_score * 1.0

    # 总积分（前端展示格式）
    total_points_display = bonus_display + innovation_bonus_display

    return {
        "total_points": round(total_points_display, 1),
        "detailed_points": [...],
        "innovation_bonus": round(innovation_bonus_display, 1)
    }
```

### 5. API 端点

所有积分相关的API端点自动返回前端展示格式：

- `/api/points/balance`: 用户积分余额
- `/api/points/summary`: 积分统计摘要
- `/api/points/transactions`: 积分交易记录
- `/api/points/levels`: 等级信息
- `/api/pr/{activity_show_id}/calculate-points`: AI评价积分计算

## 使用示例

### 后端服务层使用

```python
# 用户获得积分（前端输入10.5积分）
transaction = await point_service.earn_points(
    user_id=user_id,
    amount=10.5,
    is_display_amount=True  # 明确指定这是前端展示格式
)

# 用户消费积分（前端输入5.0积分）
transaction = await point_service.spend_points(
    user_id=user_id,
    amount=5.0,
    is_display_amount=True  # 明确指定这是前端展示格式
)

# 获取用户余额（前端展示格式）
balance = await point_service.get_user_balance_for_display(user_id)
```

### AI评价积分使用

```python
# AI评价计算积分（返回前端展示格式）
points_result = await calculate_points_from_analysis(analysis_result)
points_to_award = points_result["total_points"]  # 前端展示格式

# 授予AI评价积分
await point_service.earn_points(
    user_id=user_id,
    amount=points_to_award,
    reference_id=activity_show_id,
    reference_type='activity',
    description=f"PR活动积分",
    is_display_amount=True  # AI计算的积分是前端展示格式
)
```

### AI重新评分积分调整

```python
# 获取现有积分交易记录
existing_transaction = await point_service._check_duplicate_transaction(...)

if existing_transaction:
    # 获取旧积分（后端存储格式）和新积分（前端展示格式）
    old_points_storage = existing_transaction.amount
    old_points_display = PointConverter.format_for_api(old_points_storage)
    new_points_display = new_points  # AI重新计算的积分
    new_points_storage = PointConverter.to_storage(new_points_display)

    # 比较存储格式的积分，确保精确比较
    if old_points_storage != new_points_storage:
        # 计算调整量（前端展示格式）
        adjustment_amount_display = new_points_display - old_points_display

        # 创建积分调整交易
        await point_service.adjust_points(
            user_id=user_id,
            amount=adjustment_amount_display,
            reference_id=activity_show_id,
            reference_type='activity_recalculation',
            description=f"AI重新评分积分调整",
            is_display_amount=True  # 调整量是前端展示格式
        )
```

### 前端API调用

```typescript
// 获取用户积分余额
const response = await fetch('/api/points/balance');
const data = await response.json();
console.log(data.balance); // 显示：10.5（前端展示格式）

// 获取积分交易记录
const transactions = await fetch('/api/points/transactions');
const txData = await transactions.json();
console.log(txData.transactions[0].amount); // 显示：5.5（前端展示格式）
```

## 数据库存储

数据库中的积分字段存储放大10倍的整数值：

```sql
-- 用户表
users.points = 1050  -- 表示105.0积分

-- 积分交易表
point_transactions.amount = 55        -- 表示5.5积分
point_transactions.balance_after = 1105  -- 表示110.5积分

-- 等级表
user_levels.min_points = 1000  -- 表示100.0积分门槛
user_levels.max_points = 5000  -- 表示500.0积分门槛
```

## 兼容性说明

### 现有数据迁移

如果系统中已有积分数据，需要进行数据迁移：

1. 将现有积分值乘以10
2. 确保所有积分字段都是整数类型
3. 更新相关的等级门槛值

### API 向后兼容

- 所有API返回的积分值都是前端展示格式（小数）
- 前端代码无需修改，继续按小数处理积分
- 后端内部计算使用整数，提高精度和性能

## 优势

1. **精度保证**：避免浮点数计算精度问题
2. **性能优化**：整数运算比浮点数运算更快
3. **存储效率**：整数存储比浮点数存储更节省空间
4. **前端友好**：API自动转换，前端无需关心存储细节
5. **扩展性好**：可以轻松调整放大倍数以支持更高精度

## AI重新评分机制

### 问题解决

AI重新评分功能解决了以下关键问题：

1. **积分计算错误**：确保重新评分时积分计算不会出错
2. **增量调整**：重新评分只在原有积分基础上进行加减，不会重置积分
3. **格式一致性**：正确处理前端展示格式和后端存储格式的转换

### 实现原理

1. **精确比较**：使用后端存储格式比较积分，避免浮点数精度问题
2. **增量调整**：计算新旧积分差值，只调整差额部分
3. **格式转换**：自动处理前端展示格式和后端存储格式的转换
4. **事务安全**：所有积分操作都在数据库事务中进行

### 调整流程

```
1. 获取现有积分交易记录（后端存储格式）
2. AI重新计算积分（前端展示格式）
3. 转换新积分为后端存储格式
4. 比较存储格式积分是否有变化
5. 如有变化，计算调整量（前端展示格式）
6. 调用积分服务进行增量调整
7. 更新活动记录（前端展示格式）
```

## 注意事项

1. **精度限制**：当前实现支持1位小数精度（如10.5积分）
2. **数据一致性**：确保所有积分相关操作都使用转换器
3. **测试覆盖**：重点测试转换逻辑和边界情况
4. **文档同步**：API文档需要说明返回的是前端展示格式
5. **重新评分**：AI重新评分使用增量调整，确保积分计算准确性
