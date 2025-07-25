"""
等级服务层 - 处理用户等级相关的业务逻辑
"""
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, asc
from sqlalchemy.orm import joinedload
import logging

from app.models.scoring import UserLevel, PointTransaction
from app.models.user import User

logger = logging.getLogger(__name__)


class LevelService:
    """等级服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_levels(self) -> List[UserLevel]:
        """获取所有等级"""
        result = await self.db.execute(
            select(UserLevel).order_by(asc(UserLevel.min_points))
        )
        return result.scalars().all()
    
    async def get_level_by_points(self, points: int) -> Optional[UserLevel]:
        """根据积分获取对应等级"""
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
        """获取下一个等级"""
        result = await self.db.execute(
            select(UserLevel)
            .filter(UserLevel.min_points > current_points)
            .order_by(asc(UserLevel.min_points))
            .limit(1)
        )
        return result.scalar()
    
    async def get_user_level_info(self, user_id: int) -> Dict[str, Any]:
        """获取用户等级详细信息（返回前端展示格式）"""
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
    
    async def check_level_upgrade(self, user_id: int, new_points: int) -> Tuple[bool, Optional[UserLevel], Optional[UserLevel]]:
        """检查用户是否升级"""
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
        """计算数字等级（用于兼容性）"""
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
    
    async def get_level_statistics(self) -> Dict[str, Any]:
        """获取等级统计信息"""
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
        benefits: Optional[Dict] = None,
        icon: Optional[str] = None,
        color: Optional[str] = None
    ) -> UserLevel:
        """创建新等级"""
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
        """批量更新所有用户的等级"""
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
