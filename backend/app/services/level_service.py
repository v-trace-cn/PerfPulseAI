"""等级服务层 - 处理用户等级相关的业务逻辑."""
import logging
import uuid
from datetime import datetime
from typing import Any, Optional

from app.models.scoring import UserLevel
from app.models.user import User
from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)


class LevelRuleEngine:
    """等级规则引擎."""

    @staticmethod
    def calculate_level_benefits(level: UserLevel, user_points: int) -> dict[str, Any]:
        """计算等级福利."""
        benefits = level.benefits or {}

        # 基础福利
        base_benefits = {
            "pointsMultiplier": benefits.get("pointsMultiplier", 1.0),
            "specialAccess": benefits.get("specialAccess", []),
            "discountRate": benefits.get("discountRate", 0),
            "prioritySupport": benefits.get("prioritySupport", False)
        }

        # 根据积分动态计算额外福利
        if user_points >= level.min_points * 1.5:  # 超过等级最低要求50%
            base_benefits["bonusMultiplier"] = 1.1

        return base_benefits

    @staticmethod
    def validate_level_progression(levels: list[UserLevel]) -> list[str]:
        """验证等级设置的合理性."""
        issues = []

        if not levels:
            issues.append("没有设置任何等级")
            return issues

        # 检查等级间隔是否合理
        for i in range(len(levels) - 1):
            current = levels[i]
            next_level = levels[i + 1]

            if current.max_points and next_level.min_points <= current.max_points:
                issues.append(f"等级 {current.name} 和 {next_level.name} 积分范围重叠")

            # 检查积分间隔是否过大或过小
            gap = next_level.min_points - current.min_points
            if gap < 100:  # 存储格式，相当于10积分
                issues.append(f"等级 {current.name} 到 {next_level.name} 积分间隔过小")
            elif gap > 10000:  # 存储格式，相当于1000积分
                issues.append(f"等级 {current.name} 到 {next_level.name} 积分间隔过大")

        return issues


class LevelService:
    """等级服务类."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.rule_engine = LevelRuleEngine()

    async def get_all_levels(self) -> list[UserLevel]:
        """获取所有等级."""
        result = await self.db.execute(
            select(UserLevel).order_by(asc(UserLevel.min_points))
        )
        levels = result.scalars().all()

        # 如果没有等级，自动初始化默认等级
        if not levels:
            await self.initialize_default_levels()
            result = await self.db.execute(
                select(UserLevel).order_by(asc(UserLevel.min_points))
            )
            levels = result.scalars().all()

        return levels

    async def initialize_default_levels(self) -> list[UserLevel]:
        """初始化默认等级系统."""
        default_levels = [
            {
                "id": "level_1",
                "name": "新手",
                "min_points": 0,
                "max_points": 500,  # 存储格式，相当于50积分
                "benefits": {
                    "pointsMultiplier": 1.0,
                    "specialAccess": [],
                    "discountRate": 0,
                    "prioritySupport": False
                },
                "icon": "🌱",
                "color": "#10B981"
            },
            {
                "id": "level_2",
                "name": "进阶",
                "min_points": 500,
                "max_points": 1500,  # 存储格式，相当于150积分
                "benefits": {
                    "pointsMultiplier": 1.1,
                    "specialAccess": ["beta_features"],
                    "discountRate": 5,
                    "prioritySupport": False
                },
                "icon": "🚀",
                "color": "#3B82F6"
            },
            {
                "id": "level_3",
                "name": "专家",
                "min_points": 1500,
                "max_points": 5000,  # 存储格式，相当于500积分
                "benefits": {
                    "pointsMultiplier": 1.2,
                    "specialAccess": ["beta_features", "expert_tools"],
                    "discountRate": 10,
                    "prioritySupport": True
                },
                "icon": "⭐",
                "color": "#F59E0B"
            },
            {
                "id": "level_4",
                "name": "大师",
                "min_points": 5000,
                "max_points": 15000,  # 存储格式，相当于1500积分
                "benefits": {
                    "pointsMultiplier": 1.3,
                    "specialAccess": ["beta_features", "expert_tools", "master_privileges"],
                    "discountRate": 15,
                    "prioritySupport": True
                },
                "icon": "👑",
                "color": "#8B5CF6"
            },
            {
                "id": "level_5",
                "name": "传奇",
                "min_points": 15000,
                "max_points": None,  # 无上限
                "benefits": {
                    "pointsMultiplier": 1.5,
                    "specialAccess": ["beta_features", "expert_tools", "master_privileges", "legendary_access"],
                    "discountRate": 20,
                    "prioritySupport": True
                },
                "icon": "🏆",
                "color": "#EF4444"
            }
        ]

        created_levels = []
        for level_data in default_levels:
            level = UserLevel(
                id=level_data["id"],
                name=level_data["name"],
                min_points=level_data["min_points"],
                max_points=level_data["max_points"],
                benefits=level_data["benefits"],
                icon=level_data["icon"],
                color=level_data["color"]
            )
            self.db.add(level)
            created_levels.append(level)

        await self.db.commit()
        logger.info(f"初始化了 {len(created_levels)} 个默认等级")
        return created_levels

    async def get_level_by_points(self, points: int) -> Optional[UserLevel]:
        """根据积分获取对应等级."""
        result = await self.db.execute(
            select(UserLevel)
            .filter(
                UserLevel.min_points <= points,
                (UserLevel.max_points.is_(None)) | (UserLevel.max_points >= points)
            )
            .order_by(desc(UserLevel.min_points))
            .limit(1)
        )
        return result.scalar()

    async def get_next_level(self, current_points: int) -> Optional[UserLevel]:
        """获取下一个等级."""
        result = await self.db.execute(
            select(UserLevel)
            .filter(UserLevel.min_points > current_points)
            .order_by(asc(UserLevel.min_points))
            .limit(1)
        )
        return result.scalar()

    async def get_user_level_info(self, user_id: int) -> dict[str, Any]:
        """获取用户等级详细信息（返回前端展示格式）."""
        try:
            # 导入转换器
            from app.services.point_service import PointConverter

            # 获取用户信息
            user_result = await self.db.execute(
                select(User).options(joinedload(User.user_level)).filter(User.id == user_id)
            )
            user = user_result.scalar()

            if not user:
                raise ValueError(f"用户 {user_id} 不存在")

            # 使用后端存储格式的积分进行计算
            current_points_storage = user.points or 0
            current_level = user.user_level
            next_level = await self.get_next_level(current_points_storage)

            # 计算到下一等级所需积分
            points_to_next_storage = None
            points_to_next_display = None
            progress_percentage = 0

            if next_level:
                points_to_next_storage = max(0, next_level.min_points - current_points_storage)
                points_to_next_display = PointConverter.format_for_api(points_to_next_storage)

                if current_level:
                    level_range = next_level.min_points - current_level.min_points
                    current_progress = current_points_storage - current_level.min_points
                    progress_percentage = (current_progress / level_range) * 100 if level_range > 0 else 100
                else:
                    progress_percentage = (current_points_storage / next_level.min_points) * 100 if next_level.min_points > 0 else 0
            else:
                # 已达到最高等级
                progress_percentage = 100

            return {
                "userId": user_id,
                "currentPoints": PointConverter.format_for_api(current_points_storage),
                "currentLevel": current_level.to_dict() if current_level else None,
                "nextLevel": next_level.to_dict() if next_level else None,
                "pointsToNext": points_to_next_display,
                "progressPercentage": min(100, max(0, progress_percentage)),
                "isMaxLevel": next_level is None
            }
        except Exception as e:
            print(f"获取用户等级信息错误: {e}")
            # 返回默认值而不是抛出异常
            return {
                "userId": user_id,
                "currentPoints": 0.0,
                "currentLevel": None,
                "nextLevel": None,
                "pointsToNext": None,
                "progressPercentage": 0,
                "isMaxLevel": False
            }

    async def validate_level_system(self) -> dict[str, Any]:
        """验证等级系统的完整性."""
        levels = await self.get_all_levels()
        issues = self.rule_engine.validate_level_progression(levels)

        return {
            "isValid": len(issues) == 0,
            "issues": issues,
            "levelCount": len(levels),
            "levels": [level.to_dict() for level in levels]
        }

    async def auto_upgrade_all_users(self) -> dict[str, Any]:
        """自动为所有用户检查并升级等级."""
        # 获取所有用户
        result = await self.db.execute(select(User))
        users = result.scalars().all()

        upgrade_results = []
        for user in users:
            try:
                level_changed, old_level, new_level = await self.check_level_upgrade(user.id, user.points or 0)
                if level_changed:
                    upgrade_results.append({
                        "userId": user.id,
                        "userName": user.name,
                        "oldLevel": old_level.name if old_level else "无",
                        "newLevel": new_level.name if new_level else "无",
                        "points": user.points or 0
                    })
            except Exception as e:
                logger.error(f"用户 {user.id} 等级升级检查失败: {e}")

        return {
            "totalUsers": len(users),
            "upgradedUsers": len(upgrade_results),
            "upgrades": upgrade_results
        }

    async def check_level_upgrade(self, user_id: int, new_points: int) -> tuple[bool, Optional[UserLevel], Optional[UserLevel]]:
        """检查用户是否升级."""
        # 获取用户当前等级
        user_result = await self.db.execute(
            select(User).options(joinedload(User.user_level)).filter(User.id == user_id)
        )
        user = user_result.scalar()

        if not user:
            raise ValueError(f"用户 {user_id} 不存在")

        old_level = user.user_level
        new_level = await self.get_level_by_points(new_points)

        # 检查是否需要更新等级
        level_changed = False
        if old_level != new_level:
            level_changed = True
            # 更新用户等级
            user.level_id = new_level.id if new_level else None
            user.level = self._calculate_numeric_level(new_level) if new_level else 1
            await self.db.commit()

            logger.info(f"用户 {user_id} 等级变化: {old_level.name if old_level else '无'} -> {new_level.name if new_level else '无'}")

        return level_changed, old_level, new_level

    def _calculate_numeric_level(self, level: UserLevel) -> int:
        """计算数字等级（用于兼容性）."""
        if not level:
            return 1

        # 根据等级ID或最小积分计算数字等级
        level_mapping = {
            'level_1': 1,
            'level_2': 2,
            'level_3': 3,
            'level_4': 4,
            'level_5': 5
        }

        return level_mapping.get(level.id, 1)

    async def get_level_statistics(self) -> dict[str, Any]:
        """获取等级统计信息."""
        # 获取所有等级
        levels = await self.get_all_levels()

        # 统计每个等级的用户数量
        level_stats = []
        total_users = 0

        for level in levels:
            user_count_result = await self.db.execute(
                select(func.count(User.id))
                .filter(User.level_id == level.id)
            )
            user_count = user_count_result.scalar() or 0
            total_users += user_count

            level_stats.append({
                "level": level.to_dict(),
                "userCount": user_count
            })

        # 计算百分比
        for stat in level_stats:
            stat["percentage"] = (stat["userCount"] / total_users * 100) if total_users > 0 else 0

        return {
            "totalUsers": total_users,
            "levelDistribution": level_stats,
            "totalLevels": len(levels)
        }

    async def create_level(
        self,
        name: str,
        min_points: int,
        max_points: Optional[int] = None,
        benefits: Optional[dict] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None
    ) -> UserLevel:
        """创建新等级."""
        # 验证积分范围
        if max_points is not None and max_points <= min_points:
            raise ValueError("最大积分必须大于最小积分")

        # 检查是否与现有等级冲突
        existing_levels = await self.get_all_levels()
        for level in existing_levels:
            if (min_points >= level.min_points and
                (level.max_points is None or min_points <= level.max_points)):
                raise ValueError(f"积分范围与等级 '{level.name}' 冲突")

            if (max_points is not None and
                max_points >= level.min_points and
                (level.max_points is None or max_points <= level.max_points)):
                raise ValueError(f"积分范围与等级 '{level.name}' 冲突")

        # 创建新等级
        new_level = UserLevel(
            id=str(uuid.uuid4()),
            name=name,
            min_points=min_points,
            max_points=max_points,
            benefits=benefits,
            icon=icon,
            color=color,
            created_at=datetime.utcnow().replace(microsecond=0)
        )

        self.db.add(new_level)
        await self.db.commit()
        await self.db.refresh(new_level)

        logger.info(f"创建新等级: {name} ({min_points}-{max_points or '∞'})")
        return new_level

    async def update_all_user_levels(self) -> int:
        """批量更新所有用户的等级."""
        # 获取所有用户
        users_result = await self.db.execute(
            select(User).filter(User.points > 0)
        )
        users = users_result.scalars().all()

        updated_count = 0

        for user in users:
            correct_level = await self.get_level_by_points(user.points)
            if user.level_id != (correct_level.id if correct_level else None):
                user.level_id = correct_level.id if correct_level else None
                user.level = self._calculate_numeric_level(correct_level) if correct_level else 1
                updated_count += 1

        await self.db.commit()
        logger.info(f"批量更新用户等级完成，共更新 {updated_count} 个用户")

        return updated_count
