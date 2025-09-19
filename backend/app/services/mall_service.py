"""积分商城服务层 - 按照编码共识标准重构的专业商城服务."""
import logging
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from app.models.reward import MallCategory, MallItem
from app.models.scoring import PointPurchase, PurchaseStatus
from app.services.notification_service import NotificationService
from app.services.point_service import PointConverter, PointService
from sqlalchemy import and_, desc, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

logger = logging.getLogger(__name__)


class MallService:
    """积分商城服务类 - 按照编码共识标准重构.

    设计理念：
    - 数据库驱动，告别静态数据
    - 完整的CRUD操作
    - 性能优化的查询策略
    - 公司级别的数据隔离
    - 库存管理和统计分析
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self.point_service = PointService(db)
        self.notification_service = NotificationService(db)

    # ==================== 商品查询相关 ====================

    async def get_mall_items(
        self,
        company_id: Optional[int] = None,
        category: Optional[str] = None,
        is_available: Optional[bool] = None,
        is_featured: Optional[bool] = None,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> list[dict[str, Any]]:
        """获取商城商品列表 - 支持多种过滤条件.

        Args:
            company_id: 公司ID，None表示获取全局商品
            category: 商品分类过滤
            is_available: 是否可用
            is_featured: 是否推荐
            limit: 限制数量
            offset: 偏移量

        """
        query = select(MallItem).where(MallItem.deleted_at.is_(None))

        # 公司隔离：获取全局商品和指定公司商品
        if company_id is not None:
            query = query.where(
                or_(
                    MallItem.company_id.is_(None),  # 全局商品
                    MallItem.company_id == company_id  # 公司专属商品
                )
            )
        else:
            query = query.where(MallItem.company_id.is_(None))  # 只获取全局商品

        # 分类过滤
        if category:
            query = query.where(MallItem.category == category)

        # 可用性过滤
        if is_available is not None:
            if is_available:
                query = query.where(
                    and_(
                        MallItem.is_available,
                        MallItem.stock > 0
                    )
                )
            else:
                query = query.where(
                    or_(
                        not MallItem.is_available,
                        MallItem.stock <= 0
                    )
                )

        # 推荐过滤
        if is_featured is not None:
            query = query.where(MallItem.is_featured == is_featured)

        # 排序：推荐商品优先，然后按排序字段，最后按创建时间
        query = query.order_by(
            desc(MallItem.is_featured),
            MallItem.sort_order,
            desc(MallItem.created_at)
        )

        # 分页
        if limit:
            query = query.limit(limit)
        if offset:
            query = query.offset(offset)

        result = await self.db.execute(query)
        items = result.scalars().all()

        return [item.to_api_response() for item in items]

    async def get_item_by_id(self, item_id: str, company_id: Optional[int] = None) -> Optional[dict[str, Any]]:
        """根据ID获取商品信息.

        Args:
            item_id: 商品ID
            company_id: 公司ID，用于权限检查

        """
        query = select(MallItem).where(
            and_(
                MallItem.id == item_id,
                MallItem.deleted_at.is_(None)
            )
        )

        # 公司权限检查
        if company_id is not None:
            query = query.where(
                or_(
                    MallItem.company_id.is_(None),  # 全局商品
                    MallItem.company_id == company_id  # 公司专属商品
                )
            )

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if item:
            # 增加浏览次数
            await self._increment_view_count(item_id)
            return item.to_api_response()

        return None

    async def _increment_view_count(self, item_id: str):
        """增加商品浏览次数."""
        try:
            await self.db.execute(
                update(MallItem)
                .where(MallItem.id == item_id)
                .values(view_count=MallItem.view_count + 1)
            )
            await self.db.commit()
        except Exception as e:
            logger.warning(f"Failed to increment view count for item {item_id}: {e}")
            await self.db.rollback()

    def generate_redemption_code(self, item_name: str) -> str:
        """生成兑换码."""
        # 生成8位随机字符串
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        # 添加时间戳后4位
        timestamp_part = str(int(datetime.now().timestamp()))[-4:]
        # 组合兑换码
        redemption_code = f"RD{random_part}{timestamp_part}"
        return redemption_code

    async def can_purchase_item(self, user_id: int, item_id: str, company_id: Optional[int] = None) -> tuple[bool, str]:
        """检查用户是否可以购买商品 - 优化版本.

        检查项目：
        1. 商品存在性和权限
        2. 商品可用性
        3. 库存充足性
        4. 用户积分余额
        """
        # 直接从数据库获取商品信息
        query = select(MallItem).where(
            and_(
                MallItem.id == item_id,
                MallItem.deleted_at.is_(None)
            )
        )

        # 公司权限检查
        if company_id is not None:
            query = query.where(
                or_(
                    MallItem.company_id.is_(None),  # 全局商品
                    MallItem.company_id == company_id  # 公司专属商品
                )
            )

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            return False, "商品不存在或无权限访问"

        if not item.is_available:
            return False, "商品暂不可用"

        if item.stock <= 0:
            return False, "商品库存不足"

        # 检查用户积分余额
        if item.points_cost > 0:
            if company_id is not None:
                user_balance_storage = await self.point_service.get_user_balance_by_company(user_id, company_id)
            else:
                user_balance_storage = await self.point_service.get_user_balance(user_id)

            if user_balance_storage < item.points_cost:
                user_balance_display = PointConverter.to_display(user_balance_storage)
                item_cost_display = PointConverter.to_display(item.points_cost)
                return False, f"积分余额不足，需要 {item_cost_display} 积分，当前余额 {user_balance_display}"

        return True, "可以购买"

    async def purchase_item(
        self,
        user_id: int,
        item_id: str,
        delivery_info: Optional[dict[str, Any]] = None,
        company_id: Optional[int] = None
    ) -> PointPurchase:
        """购买商品."""
        # 检查是否可以购买
        can_purchase, message = await self.can_purchase_item(user_id, item_id, company_id)
        if not can_purchase:
            raise ValueError(message)

        # 获取商品信息
        item = await self.get_item_by_id(item_id)

        # 生成兑换码
        redemption_code = self.generate_redemption_code(item["name"])

        # 使用积分服务创建购买记录
        purchase = await self.point_service.create_purchase_record(
            user_id=user_id,
            item_id=item_id,
            item_name=item["name"],
            item_description=item["description"],
            points_cost=item["pointsCost"],
            delivery_info=delivery_info,
            redemption_code=redemption_code,
            company_id=company_id
        )

        # 发送兑换成功通知
        await self.notification_service.create_redemption_notification(
            user_id=user_id,
            item_name=item["name"],
            redemption_code=redemption_code,
            points_cost=item["pointsCost"]
        )

        logger.info(f"用户 {user_id} 购买商品 {item_id}，消费 {item['pointsCost']} 积分，兑换码: {redemption_code}")
        return purchase

    async def get_user_purchases(
        self,
        user_id: int,
        status: Optional[PurchaseStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> list[PointPurchase]:
        """获取用户购买记录."""
        query = select(PointPurchase).options(
            joinedload(PointPurchase.transaction)
        ).filter(PointPurchase.user_id == user_id)

        if status:
            query = query.filter(PointPurchase.status == status)

        query = query.order_by(desc(PointPurchase.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_all_purchases(
        self,
        status: Optional[PurchaseStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> list[PointPurchase]:
        """获取所有购买记录（管理员用）."""
        query = select(PointPurchase).options(
            joinedload(PointPurchase.user),
            joinedload(PointPurchase.transaction)
        )

        if status:
            query = query.filter(PointPurchase.status == status)

        query = query.order_by(desc(PointPurchase.created_at)).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def complete_purchase(
        self,
        purchase_id: str,
        delivery_info: Optional[dict[str, Any]] = None
    ) -> PointPurchase:
        """完成购买（发货）."""
        result = await self.db.execute(
            select(PointPurchase).filter(PointPurchase.id == purchase_id)
        )
        purchase = result.scalar()

        if not purchase:
            raise ValueError("购买记录不存在")

        if purchase.status != PurchaseStatus.PENDING:
            raise ValueError("购买记录状态不正确")

        purchase.complete(delivery_info)
        await self.db.commit()
        await self.db.refresh(purchase)

        logger.info(f"购买记录 {purchase_id} 已完成发货")
        return purchase

    async def cancel_purchase(
        self,
        purchase_id: str,
        reason: str = "用户取消"
    ) -> PointPurchase:
        """取消购买并退还积分."""
        result = await self.db.execute(
            select(PointPurchase)
            .options(joinedload(PointPurchase.transaction))
            .filter(PointPurchase.id == purchase_id)
        )
        purchase = result.scalar()

        if not purchase:
            raise ValueError("购买记录不存在")

        if purchase.status != PurchaseStatus.PENDING:
            raise ValueError("只能取消待处理的购买记录")

        # 退还积分（purchase.points_cost 为后端存储格式）
        await self.point_service.earn_points(
            user_id=purchase.user_id,
            amount=purchase.points_cost,
            reference_id=purchase_id,
            reference_type='purchase_refund',
            description=f"购买取消退款: {purchase.item_name}",
            company_id=purchase.company_id,
            dispute_deadline_days=0,  # 退款不支持异议
            is_display_amount=False   # 注意：这里传入的是存储格式，避免重复放大
        )

        # 更新购买状态
        purchase.cancel(reason)
        await self.db.commit()
        await self.db.refresh(purchase)

        logger.info(f"购买记录 {purchase_id} 已取消，退还 {purchase.points_cost} 积分")
        return purchase

    async def get_mall_statistics(self) -> dict[str, Any]:
        """获取商城统计信息."""
        # 总购买数
        total_result = await self.db.execute(
            select(func.count(PointPurchase.id))
        )
        total_purchases = total_result.scalar() or 0

        # 按状态统计
        status_result = await self.db.execute(
            select(
                PointPurchase.status,
                func.count(PointPurchase.id)
            ).group_by(PointPurchase.status)
        )
        status_stats = {status.value: count for status, count in status_result.fetchall()}

        # 总积分消费
        total_points_result = await self.db.execute(
            select(func.sum(PointPurchase.points_cost))
            .filter(PointPurchase.status != PurchaseStatus.CANCELLED)
        )
        total_points_spent = total_points_result.scalar() or 0

        # 最受欢迎的商品
        popular_items_result = await self.db.execute(
            select(
                PointPurchase.item_id,
                PointPurchase.item_name,
                func.count(PointPurchase.id).label('purchase_count')
            )
            .filter(PointPurchase.status != PurchaseStatus.CANCELLED)
            .group_by(PointPurchase.item_id, PointPurchase.item_name)
            .order_by(desc('purchase_count'))
            .limit(5)
        )
        popular_items = [
            {
                "itemId": item_id,
                "itemName": item_name,
                "purchaseCount": count
            }
            for item_id, item_name, count in popular_items_result.fetchall()
        ]

        # 最近30天的购买数
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_result = await self.db.execute(
            select(func.count(PointPurchase.id))
            .filter(PointPurchase.created_at >= thirty_days_ago)
        )
        recent_purchases = recent_result.scalar() or 0

        return {
            "totalPurchases": total_purchases,
            "statusDistribution": {
                "pending": status_stats.get("PENDING", 0),
                "completed": status_stats.get("COMPLETED", 0),
                "cancelled": status_stats.get("CANCELLED", 0)
            },
            "totalPointsSpent": PointConverter.format_for_api(total_points_spent),
            "popularItems": popular_items,
            "recentPurchases": recent_purchases
        }

    async def get_user_mall_summary(self, user_id: int) -> dict[str, Any]:
        """获取用户商城使用摘要."""
        # 用户积分余额
        balance = await self.point_service.get_user_balance(user_id)

        # 用户购买统计
        purchase_stats_result = await self.db.execute(
            select(
                func.count(PointPurchase.id).label('total_purchases'),
                func.sum(PointPurchase.points_cost).label('total_spent')
            )
            .filter(
                PointPurchase.user_id == user_id,
                PointPurchase.status != PurchaseStatus.CANCELLED
            )
        )
        stats = purchase_stats_result.first()

        # 最近购买
        recent_purchases_result = await self.db.execute(
            select(PointPurchase)
            .filter(PointPurchase.user_id == user_id)
            .order_by(desc(PointPurchase.created_at))
            .limit(3)
        )
        recent_purchases = recent_purchases_result.scalars().all()

        return {
            "currentBalance": PointConverter.format_for_api(balance),
            "totalPurchases": stats.total_purchases or 0,
            "totalPointsSpent": PointConverter.format_for_api(stats.total_spent or 0),
            "recentPurchases": [purchase.to_dict() for purchase in recent_purchases]
        }

    async def verify_redemption_code(self, redemption_code: str) -> Optional[PointPurchase]:
        """验证兑换密钥."""
        query = select(PointPurchase).where(
            PointPurchase.redemption_code == redemption_code
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def redeem_with_code(self, redemption_code: str, user_id: int) -> PointPurchase:
        """使用兑换密钥核销商品."""
        purchase = await self.verify_redemption_code(redemption_code)
        if not purchase:
            raise ValueError("无效的兑换密钥")

        if purchase.status == PurchaseStatus.COMPLETED:
            raise ValueError("该兑换密钥已经使用过")

        if purchase.status == PurchaseStatus.CANCELLED:
            raise ValueError("该兑换密钥已被取消")

        purchase.status = PurchaseStatus.COMPLETED
        purchase.completed_at = datetime.now(timezone.utc).replace(microsecond=0)

        await self.db.commit()
        await self.db.refresh(purchase)

        # 获取购买用户和管理员信息
        from app.models.user import User
        from sqlalchemy import select

        # 获取购买用户信息
        buyer_result = await self.db.execute(
            select(User).filter(User.id == purchase.user_id)
        )
        buyer = buyer_result.scalar()

        # 获取管理员信息
        admin_result = await self.db.execute(
            select(User).filter(User.id == user_id)
        )
        admin = admin_result.scalar()

        # 发送核销成功通知给购买用户
        from app.models.notification import NotificationType
        if buyer:
            await self.notification_service.create_notification(
                user_id=purchase.user_id,  # 发送给购买用户
                notification_type=NotificationType.REDEMPTION,
                title="兑换码核销成功",
                content=f"您的兑换码已被管理员核销，商品：{purchase.item_name}",
                extra_data={
                    "type": "redemption_verified",
                    "item": purchase.item_name,
                    "redemptionCode": purchase.redemption_code,
                    "adminName": admin.name if admin else "管理员",
                    "verifiedAt": purchase.completed_at.isoformat() if purchase.completed_at else None
                }
            )

        # 发送核销确认通知给管理员
        if admin:
            await self.notification_service.create_notification(
                user_id=user_id,  # 发送给管理员
                notification_type=NotificationType.REDEMPTION,
                title="核销操作完成",
                content=f"您已成功核销用户 {buyer.name if buyer else '未知用户'} 的兑换码，商品：{purchase.item_name}",
                extra_data={
                    "type": "redemption_admin_confirmed",
                    "item": purchase.item_name,
                    "redemptionCode": purchase.redemption_code,
                    "buyerName": buyer.name if buyer else "未知用户",
                    "buyerEmail": buyer.email if buyer else None,
                    "verifiedAt": purchase.completed_at.isoformat() if purchase.completed_at else None
                }
            )

        logger.info(f"用户 {user_id} 核销兑换码 {redemption_code}，商品: {purchase.item_name}")
        return purchase

    async def get_user_purchases(
        self,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None
    ) -> list[PointPurchase]:
        """获取用户的购买记录."""
        from sqlalchemy import select

        query = select(PointPurchase).filter(PointPurchase.user_id == user_id)

        if status:
            try:
                status_enum = PurchaseStatus(status.upper())
                query = query.filter(PointPurchase.status == status_enum)
            except ValueError:
                pass  # 忽略无效的状态值

        query = query.order_by(PointPurchase.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_all_purchases(
        self,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> list[PointPurchase]:
        """获取所有购买记录（管理员）."""
        from sqlalchemy import select

        query = select(PointPurchase)

        if user_id:
            query = query.filter(PointPurchase.user_id == user_id)

        if status:
            try:
                status_enum = PurchaseStatus(status.upper())
                query = query.filter(PointPurchase.status == status_enum)
            except ValueError:
                pass  # 忽略无效的状态值

        query = query.order_by(PointPurchase.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_company_purchases(
        self,
        company_id: int,
        limit: int = 20,
        offset: int = 0,
        status: Optional[str] = None
    ) -> list[PointPurchase]:
        """获取公司级别的购买记录."""
        from app.models.user import User
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload

        # 联接用户表以过滤公司成员的购买记录，并预加载用户信息
        query = select(PointPurchase).options(
            joinedload(PointPurchase.user).joinedload(User.department_rel),
            joinedload(PointPurchase.transaction)
        ).join(
            User, PointPurchase.user_id == User.id
        ).filter(User.company_id == company_id)

        if status:
            try:
                status_enum = PurchaseStatus(status.upper())
                query = query.filter(PointPurchase.status == status_enum)
            except ValueError:
                pass  # 忽略无效的状态值

        query = query.order_by(PointPurchase.created_at.desc()).limit(limit).offset(offset)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_company_purchases_count(
        self,
        company_id: int,
        status: Optional[str] = None
    ) -> int:
        """获取公司级别的购买记录总数."""
        from app.models.user import User
        from sqlalchemy import func, select

        query = select(func.count(PointPurchase.id)).join(
            User, PointPurchase.user_id == User.id
        ).filter(User.company_id == company_id)

        if status:
            try:
                status_enum = PurchaseStatus(status.upper())
                query = query.filter(PointPurchase.status == status_enum)
            except ValueError:
                pass  # 忽略无效的状态值

        result = await self.db.execute(query)
        return result.scalar() or 0

    async def get_company_statistics(
        self,
        company_id: int,
        months: int = 6
    ) -> dict[str, Any]:
        """获取公司级别的商城统计信息."""
        from datetime import datetime, timezone

        from app.models.user import User
        from sqlalchemy import extract, func, select

        # 获取最近几个月的数据
        current_date = datetime.now(timezone.utc)
        stats_by_month = {}

        for i in range(months):
            # 计算目标月份
            target_month = current_date.month - i
            target_year = current_date.year

            if target_month <= 0:
                target_month += 12
                target_year -= 1

            # 查询该月的统计数据
            month_result = await self.db.execute(
                select(
                    func.count(PointPurchase.id).label('total_redemptions'),
                    func.sum(PointPurchase.points_cost).label('total_points'),
                    func.count(func.distinct(PointPurchase.user_id)).label('total_users')
                )
                .join(User, PointPurchase.user_id == User.id)
                .filter(
                    User.company_id == company_id,
                    extract('year', PointPurchase.created_at) == target_year,
                    extract('month', PointPurchase.created_at) == target_month,
                    PointPurchase.status != PurchaseStatus.CANCELLED
                )
            )

            month_stats = month_result.first()
            month_key = f"{target_year}-{target_month:02d}"
            month_name = f"{target_year}年{target_month}月"

            stats_by_month[month_key] = {
                "month": month_name,
                "totalRedemptions": month_stats.total_redemptions or 0,
                "totalPoints": PointConverter.format_for_api(month_stats.total_points or 0),
                "totalUsers": month_stats.total_users or 0
            }

        return stats_by_month

    # ==================== 商品管理相关 ====================

    async def create_mall_item(
        self,
        name: str,
        description: str,
        points_cost: float,
        category: str,
        stock: int = 0,
        company_id: Optional[int] = None,
        **kwargs
    ) -> MallItem:
        """创建新商品.

        Args:
            name: 商品名称
            description: 商品描述
            points_cost: 积分成本（前端展示格式）
            category: 商品分类
            stock: 库存数量
            company_id: 公司ID
            **kwargs: 其他可选参数

        """
        # 转换积分成本为后端存储格式
        points_cost_storage = PointConverter.to_storage(points_cost)

        item = MallItem(
            name=name,
            description=description,
            points_cost=points_cost_storage,
            category=category,
            stock=stock,
            initial_stock=stock,
            company_id=company_id,
            short_description=kwargs.get('short_description'),
            subcategory=kwargs.get('subcategory'),
            tags=kwargs.get('tags', []),
            original_price=kwargs.get('original_price'),
            low_stock_threshold=kwargs.get('low_stock_threshold', 10),
            is_available=kwargs.get('is_available', True),
            is_featured=kwargs.get('is_featured', False),
            is_limited=kwargs.get('is_limited', False),
            image_url=kwargs.get('image_url'),
            image_urls=kwargs.get('image_urls', []),
            icon=kwargs.get('icon'),
            sort_order=kwargs.get('sort_order', 0)
        )

        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)

        logger.info(f"Created mall item: {item.id} - {item.name}")
        return item

    async def update_mall_item(
        self,
        item_id: str,
        company_id: Optional[int] = None,
        **updates
    ) -> Optional[MallItem]:
        """更新商品信息.

        Args:
            item_id: 商品ID
            company_id: 公司ID，用于权限检查
            **updates: 要更新的字段

        """
        # 查询商品
        query = select(MallItem).where(
            and_(
                MallItem.id == item_id,
                MallItem.deleted_at.is_(None)
            )
        )

        # 公司权限检查
        if company_id is not None:
            query = query.where(MallItem.company_id == company_id)

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            return None

        # 处理积分成本转换
        if 'points_cost' in updates:
            updates['points_cost'] = PointConverter.to_storage(updates['points_cost'])

        # 更新字段
        for key, value in updates.items():
            if hasattr(item, key):
                setattr(item, key, value)

        item.updated_at = datetime.now(timezone.utc).replace(microsecond=0)

        await self.db.commit()
        await self.db.refresh(item)

        logger.info(f"Updated mall item: {item.id} - {item.name}")
        return item

    async def delete_mall_item(
        self,
        item_id: str,
        company_id: Optional[int] = None,
        hard_delete: bool = False
    ) -> bool:
        """删除商品（支持软删除和硬删除）.

        Args:
            item_id: 商品ID
            company_id: 公司ID，用于权限检查
            hard_delete: 是否硬删除

        """
        query = select(MallItem).where(MallItem.id == item_id)

        # 公司权限检查
        if company_id is not None:
            query = query.where(MallItem.company_id == company_id)

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            return False

        if hard_delete:
            # 硬删除
            await self.db.delete(item)
        else:
            # 软删除
            item.deleted_at = datetime.now(timezone.utc).replace(microsecond=0)
            item.is_available = False

        await self.db.commit()

        logger.info(f"Deleted mall item: {item.id} - {item.name} (hard_delete={hard_delete})")
        return True

    async def update_stock(
        self,
        item_id: str,
        stock_change: int,
        company_id: Optional[int] = None,
        reason: str = "库存调整"
    ) -> Optional[MallItem]:
        """更新商品库存.

        Args:
            item_id: 商品ID
            stock_change: 库存变化量（正数增加，负数减少）
            company_id: 公司ID
            reason: 变更原因

        """
        query = select(MallItem).where(
            and_(
                MallItem.id == item_id,
                MallItem.deleted_at.is_(None)
            )
        )

        if company_id is not None:
            query = query.where(MallItem.company_id == company_id)

        result = await self.db.execute(query)
        item = result.scalar_one_or_none()

        if not item:
            return None

        # 更新库存
        new_stock = max(0, item.stock + stock_change)
        item.stock = new_stock
        item.updated_at = datetime.now(timezone.utc).replace(microsecond=0)

        # 如果库存为0，设置为不可用
        if new_stock == 0:
            item.is_available = False

        await self.db.commit()
        await self.db.refresh(item)

        logger.info(f"Updated stock for item {item.id}: {stock_change} (new stock: {new_stock}, reason: {reason})")
        return item

    # ==================== 分类管理相关 ====================

    async def get_categories(self, company_id: Optional[int] = None) -> list[dict[str, Any]]:
        """获取商品分类列表."""
        query = select(MallCategory).where(MallCategory.is_active)

        # 公司隔离
        if company_id is not None:
            query = query.where(
                or_(
                    MallCategory.company_id.is_(None),
                    MallCategory.company_id == company_id
                )
            )
        else:
            query = query.where(MallCategory.company_id.is_(None))

        query = query.order_by(MallCategory.sort_order, MallCategory.name)

        result = await self.db.execute(query)
        categories = result.scalars().all()

        return [category.to_dict() for category in categories]

    async def create_category(
        self,
        name: str,
        description: str = None,
        icon: str = None,
        parent_id: str = None,
        company_id: Optional[int] = None,
        sort_order: int = 0
    ) -> MallCategory:
        """创建商品分类."""
        category = MallCategory(
            name=name,
            description=description,
            icon=icon,
            parent_id=parent_id,
            company_id=company_id,
            sort_order=sort_order
        )

        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)

        logger.info(f"Created mall category: {category.id} - {category.name}")
        return category
