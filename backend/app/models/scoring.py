import uuid
from datetime import datetime
from enum import Enum as PyEnum

from app.core.database import Base
from sqlalchemy import (
    JSON,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import backref, relationship


class ScoringFactor(Base):
    """评分因素模型"""

    __tablename__ = 'scoring_factors'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    label = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # select, number, checkbox, etc.
    options = Column(JSON, nullable=True)  # 存储选项的JSON数据
    min_value = Column(Integer, nullable=True)
    max_value = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))

    def to_dict(self):
        result = {
            "id": self.id,
            "label": self.label,
            "description": self.description,
            "type": self.type
        }

        if self.options:
            result["options"] = self.options

        if self.type == "number":
            if self.min_value is not None:
                result["min"] = self.min_value
            if self.max_value is not None:
                result["max"] = self.max_value

        return result

class ScoreEntry(Base):
    """评分记录模型"""

    __tablename__ = 'score_entries'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    activity_id = Column(String(200), ForeignKey('activities.id'), nullable=True)
    score = Column(Integer, nullable=False)
    factors = Column(JSON, nullable=True)  # 存储评分因素的JSON数据
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    user = relationship('User', backref=backref('scores', lazy=True))
    activity = relationship('Activity', backref=backref('scores', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "activity_id": self.activity_id,
            "criteria_id": self.criteria_id,
            "score": self.score,
            "factors": self.factors,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at
        }



# 新的积分系统模型

class TransactionType(PyEnum):
    """积分交易类型枚举"""

    EARN = "EARN"           # 获得积分
    SPEND = "SPEND"         # 消费积分
    ADJUST = "ADJUST"       # 管理员调整
    OBJECTION = "OBJECTION" # 异议调整


class DisputeStatus(PyEnum):
    """争议状态枚举"""

    PENDING = "PENDING"     # 待处理
    APPROVED = "APPROVED"   # 已批准
    REJECTED = "REJECTED"   # 已拒绝


class PurchaseStatus(PyEnum):
    """购买状态枚举"""

    PENDING = "PENDING"     # 待处理
    COMPLETED = "COMPLETED" # 已完成
    CANCELLED = "CANCELLED" # 已取消


class PointTransaction(Base):
    """积分交易记录表"""

    __tablename__ = 'point_transactions'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)  # 公司维度（A方案）
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Integer, nullable=False)  # 正数表示增加，负数表示减少
    balance_after = Column(Integer, nullable=False)  # 交易后余额
    reference_id = Column(String(36), nullable=True)  # 关联的活动ID、订单ID等
    reference_type = Column(String(50), nullable=True)  # 关联类型：activity, purchase, adjustment等
    description = Column(Text, nullable=True)
    extra_data = Column(JSON, nullable=True)  # 额外的元数据
    dispute_deadline = Column(DateTime, nullable=True)  # 异议截止时间
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    user = relationship('User', back_populates='point_transactions')
    disputes = relationship('PointDispute', back_populates='transaction', cascade='all, delete-orphan')
    purchases = relationship('PointPurchase', back_populates='transaction', cascade='all, delete-orphan')

    def to_dict(self):
        # 导入转换器
        from app.services.point_service import PointConverter

        return {
            "id": self.id,
            "userId": self.user_id,
            "transactionType": self.transaction_type.value if self.transaction_type else None,
            "amount": PointConverter.format_for_api(self.amount),
            "balanceAfter": PointConverter.format_for_api(self.balance_after),
            "referenceId": self.reference_id,
            "referenceType": self.reference_type,
            "description": self.description,
            "extraData": self.extra_data,
            "disputeDeadline": self.dispute_deadline.isoformat() if self.dispute_deadline else None,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "canDispute": self.can_dispute(),
            "disputeTimeLeft": self.dispute_time_left()
        }

    def can_dispute(self) -> bool:
        """检查是否可以提出异议"""
        if not self.dispute_deadline:
            return False
        return datetime.utcnow() <= self.dispute_deadline and self.transaction_type == TransactionType.EARN

    def dispute_time_left(self) -> int:
        """返回异议剩余天数"""
        if not self.dispute_deadline:
            return 0
        delta = self.dispute_deadline - datetime.utcnow()
        return max(0, delta.days)


class PointDispute(Base):
    """积分争议表"""

    __tablename__ = 'point_disputes'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey('point_transactions.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    reason = Column(Text, nullable=False)
    requested_amount = Column(Integer, nullable=True)  # 用户请求的积分数量
    status = Column(Enum(DisputeStatus), default=DisputeStatus.PENDING)
    admin_response = Column(Text, nullable=True)
    admin_user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # 处理的管理员
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    resolved_at = Column(DateTime, nullable=True)

    # 关联关系
    transaction = relationship('PointTransaction', back_populates='disputes')
    user = relationship('User', foreign_keys=[user_id], back_populates='point_disputes')
    admin_user = relationship('User', foreign_keys=[admin_user_id])

    def to_dict(self):
        return {
            "id": self.id,
            "transactionId": self.transaction_id,
            "userId": self.user_id,
            "reason": self.reason,
            "requestedAmount": self.requested_amount,
            "status": self.status.value if self.status else None,
            "adminResponse": self.admin_response,
            "adminUserId": self.admin_user_id,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "resolvedAt": self.resolved_at.isoformat() if self.resolved_at else None,
            "isPending": self.status == DisputeStatus.PENDING,
            "canEdit": self.status == DisputeStatus.PENDING
        }

    def resolve(self, admin_user_id: int, response: str, approved: bool = True):
        """解决争议"""
        self.admin_user_id = admin_user_id
        self.admin_response = response
        self.status = DisputeStatus.APPROVED if approved else DisputeStatus.REJECTED
        self.resolved_at = datetime.utcnow().replace(microsecond=0)


class UserLevel(Base):
    """用户等级表"""

    __tablename__ = 'user_levels'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(50), nullable=False)
    min_points = Column(Integer, nullable=False)
    max_points = Column(Integer, nullable=True)  # None表示无上限
    benefits = Column(JSON, nullable=True)  # 等级福利
    icon = Column(String(100), nullable=True)  # 等级图标
    color = Column(String(20), nullable=True)  # 等级颜色
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    def to_dict(self):
        # 导入转换器
        try:
            from app.services.point_service import PointConverter
            min_points_display = PointConverter.format_for_api(self.min_points)
            max_points_display = PointConverter.format_for_api(self.max_points) if self.max_points else None
            points_range = f"{min_points_display}-{max_points_display if max_points_display else '∞'}"
        except:
            # 如果转换失败，使用原始值
            min_points_display = self.min_points
            max_points_display = self.max_points
            points_range = f"{self.min_points}-{self.max_points if self.max_points else '∞'}"

        return {
            "id": self.id,
            "name": self.name,
            "minPoints": min_points_display,
            "maxPoints": max_points_display,
            "benefits": self.benefits,
            "icon": self.icon,
            "color": self.color,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "pointsRange": points_range,
            "isUnlimited": self.max_points is None
        }

    @classmethod
    def get_level_for_points(cls, points: int):
        """根据积分获取对应等级"""
        # 这个方法需要在服务层中实现，这里只是定义接口
        pass

    def contains_points(self, points: int) -> bool:
        """检查积分是否在此等级范围内"""
        if points < self.min_points:
            return False
        if self.max_points is None:
            return True
        return points <= self.max_points


class PointPurchase(Base):
    """积分商城消费记录表"""

    __tablename__ = 'point_purchases'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=True)  # 公司维度（A方案）
    item_id = Column(String(36), nullable=False)  # 商品ID
    item_name = Column(String(200), nullable=False)  # 商品名称
    item_description = Column(Text, nullable=True)  # 商品描述
    points_cost = Column(Integer, nullable=False)  # 消费积分数量
    transaction_id = Column(String(36), ForeignKey('point_transactions.id'), nullable=True)  # 免费商品可以没有交易记录
    status = Column(Enum(PurchaseStatus), default=PurchaseStatus.PENDING)
    redemption_code = Column(String(20), nullable=True)  # 兑换码
    delivery_info = Column(JSON, nullable=True)  # 配送信息
    notes = Column(Text, nullable=True)  # 备注
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    completed_at = Column(DateTime, nullable=True)

    # 关联关系
    user = relationship('User', back_populates='point_purchases')
    transaction = relationship('PointTransaction', back_populates='purchases')

    def to_dict(self):
        # 导入转换器
        from app.services.point_service import PointConverter

        return {
            "id": self.id,
            "userId": self.user_id,
            "itemId": self.item_id,
            "itemName": self.item_name,
            "itemDescription": self.item_description,
            "pointsCost": PointConverter.format_for_api(self.points_cost),
            "transactionId": self.transaction_id,
            "status": self.status.value if self.status else None,
            "redemptionCode": self.redemption_code,
            "deliveryInfo": self.delivery_info,
            "notes": self.notes,
            "createdAt": self.created_at.isoformat() if isinstance(self.created_at, datetime) else self.created_at,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "isPending": self.status == PurchaseStatus.PENDING,
            "isCompleted": self.status == PurchaseStatus.COMPLETED,
            "isCancelled": self.status == PurchaseStatus.CANCELLED
        }

    def complete(self, delivery_info: dict = None):
        """完成购买"""
        self.status = PurchaseStatus.COMPLETED
        self.completed_at = datetime.utcnow().replace(microsecond=0)
        if delivery_info:
            self.delivery_info = delivery_info

    def cancel(self, reason: str = None):
        """取消购买"""
        self.status = PurchaseStatus.CANCELLED
        if reason:
            self.notes = f"{self.notes or ''}\n取消原因: {reason}".strip()
