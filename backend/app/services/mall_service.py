"""
积分商城服务层 - 处理积分商城相关的业务逻辑
"""
import uuid
import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import joinedload
import logging

from app.models.scoring import PointPurchase, PurchaseStatus, PointTransaction
from app.models.user import User
from app.services.point_service import PointService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class MallService:
    """积分商城服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.point_service = PointService(db)
        self.notification_service = NotificationService(db)
    
    async def get_mall_items(self) -> List[Dict[str, Any]]:
        """获取商城商品列表"""
        # 这里可以从数据库或配置文件中获取商品信息
        # 暂时返回静态数据
        return [
            {
                "id": "gift_card_50",
                "name": "50元礼品卡",
                "description": "可在指定商店使用的50元礼品卡",
                "pointsCost": 0,
                "category": "gift_card",
                "image": "/images/gift-card-50.png",
                "stock": 100,
                "isAvailable": True,
                "tags": ["热门", "礼品卡"]
            },
            {
                "id": "gift_card_100",
                "name": "100元礼品卡",
                "description": "可在指定商店使用的100元礼品卡",
                "pointsCost": 0.1,
                "category": "gift_card",
                "image": "/images/gift-card-100.png",
                "stock": 50,
                "isAvailable": True,
                "tags": ["推荐", "礼品卡"]
            },
            {
                "id": "coffee_voucher",
                "name": "咖啡券",
                "description": "星巴克中杯咖啡券一张",
                "pointsCost": 25,
                "category": "food",
                "image": "/images/coffee-voucher.png",
                "stock": 200,
                "isAvailable": True,
                "tags": ["饮品", "日常"]
            },
            {
                "id": "tech_book",
                "name": "技术书籍",
                "description": "精选技术书籍，随机发放",
                "pointsCost": 35,
                "category": "book",
                "image": "/images/tech-book.png",
                "stock": 30,
                "isAvailable": True,
                "tags": ["学习", "书籍"]
            },
            {
                "id": "wireless_mouse",
                "name": "无线鼠标",
                "description": "高品质无线鼠标，办公必备",
                "pointsCost": 40,
                "category": "electronics",
                "image": "/images/wireless-mouse.png",
                "stock": 20,
                "isAvailable": True,
                "tags": ["办公", "电子产品"]
            },
            {
                "id": "team_lunch",
                "name": "团队聚餐券",
                "description": "团队聚餐活动券，可用于团建",
                "pointsCost": 50,
                "category": "activity",
                "image": "/images/team-lunch.png",
                "stock": 10,
                "isAvailable": True,
                "tags": ["团建", "聚餐", "限量"]
            }
        ]
    
    async def get_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取商品信息"""
        items = await self.get_mall_items()
        return next((item for item in items if item["id"] == item_id), None)

    def generate_redemption_code(self, item_name: str) -> str:
        """生成兑换码"""
        # 生成8位随机字符串
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        # 添加时间戳后4位
        timestamp_part = str(int(datetime.now().timestamp()))[-4:]
        # 组合兑换码
        redemption_code = f"RD{random_part}{timestamp_part}"
        return redemption_code
    
    async def can_purchase_item(self, user_id: int, item_id: str) -> Tuple[bool, str]:
        """检查用户是否可以购买商品"""
        # 获取商品信息
        item = await self.get_item_by_id(item_id)
        if not item:
            return False, "商品不存在"
        
        if not item["isAvailable"]:
            return False, "商品暂不可用"
        
        if item["stock"] <= 0:
            return False, "商品库存不足"
        
        # 检查用户积分余额（使用后端存储格式进行比较）
        # 当商品成本为0时，跳过积分余额检查
        if item["pointsCost"] > 0:
            from app.services.point_service import PointConverter

            user_balance_storage = await self.point_service.get_user_balance(user_id)
            item_cost_storage = PointConverter.to_storage(item["pointsCost"])

            if user_balance_storage < item_cost_storage:
                user_balance_display = PointConverter.to_display(user_balance_storage)
                return False, f"积分余额不足，需要 {item['pointsCost']} 积分，当前余额 {user_balance_display}"
        
        return True, "可以购买"
    
    async def purchase_item(
        self,
        user_id: int,
        item_id: str,
        delivery_info: Optional[Dict[str, Any]] = None
    ) -> PointPurchase:
        """购买商品"""
        # 检查是否可以购买
        can_purchase, message = await self.can_purchase_item(user_id, item_id)
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
            redemption_code=redemption_code
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
    ) -> List[PointPurchase]:
        """获取用户购买记录"""
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
    ) -> List[PointPurchase]:
        """获取所有购买记录（管理员用）"""
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
        delivery_info: Optional[Dict[str, Any]] = None
    ) -> PointPurchase:
        """完成购买（发货）"""
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
        """取消购买并退还积分"""
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
        
        # 退还积分
        await self.point_service.earn_points(
            user_id=purchase.user_id,
            amount=purchase.points_cost,
            reference_id=purchase_id,
            reference_type='purchase_refund',
            description=f"购买取消退款: {purchase.item_name}",
            dispute_deadline_days=0  # 退款不支持异议
        )
        
        # 更新购买状态
        purchase.cancel(reason)
        await self.db.commit()
        await self.db.refresh(purchase)
        
        logger.info(f"购买记录 {purchase_id} 已取消，退还 {purchase.points_cost} 积分")
        return purchase
    
    async def get_mall_statistics(self) -> Dict[str, Any]:
        """获取商城统计信息"""
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
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
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
            "totalPointsSpent": int(total_points_spent),
            "popularItems": popular_items,
            "recentPurchases": recent_purchases
        }

    async def get_user_mall_summary(self, user_id: int) -> Dict[str, Any]:
        """获取用户商城使用摘要"""
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
            "currentBalance": balance,
            "totalPurchases": stats.total_purchases or 0,
            "totalPointsSpent": int(stats.total_spent or 0),
            "recentPurchases": [purchase.to_dict() for purchase in recent_purchases]
        }

    async def verify_redemption_code(self, redemption_code: str) -> Optional[PointPurchase]:
        """验证兑换密钥"""
        query = select(PointPurchase).where(
            PointPurchase.redemption_code == redemption_code
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def redeem_with_code(self, redemption_code: str, user_id: int) -> PointPurchase:
        """使用兑换密钥核销商品"""
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
        from sqlalchemy import select
        from app.models.user import User

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
    ) -> List[PointPurchase]:
        """获取用户的购买记录"""
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
    ) -> List[PointPurchase]:
        """获取所有购买记录（管理员）"""
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
    ) -> List[PointPurchase]:
        """获取公司级别的购买记录"""
        from sqlalchemy import select
        from sqlalchemy.orm import joinedload
        from app.models.user import User

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
        """获取公司级别的购买记录总数"""
        from sqlalchemy import select, func
        from app.models.user import User

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
    ) -> Dict[str, Any]:
        """获取公司级别的商城统计信息"""
        from sqlalchemy import select, func, extract
        from app.models.user import User
        from datetime import datetime, timezone

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
                "totalPoints": int(month_stats.total_points or 0),
                "totalUsers": month_stats.total_users or 0
            }

        return stats_by_month
