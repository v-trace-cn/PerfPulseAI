from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    admin_user_ids = Column(Text, nullable=True, default='[]')  # JSON array of admin user IDs
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    company = relationship('Company', back_populates='departments')

    def __init__(self, name: str, company_id: int):
        self.name = name
        self.company_id = company_id
        self.admin_user_ids = '[]'

    def get_admin_user_ids(self):
        """获取管理员用户ID列表"""
        try:
            return json.loads(self.admin_user_ids or '[]')
        except (json.JSONDecodeError, TypeError):
            return []

    def set_admin_user_ids(self, user_ids: list):
        """设置管理员用户ID列表"""
        self.admin_user_ids = json.dumps(user_ids)

    def add_admin_user(self, user_id: int):
        """添加管理员用户"""
        current_ids = self.get_admin_user_ids()
        if user_id not in current_ids:
            current_ids.append(user_id)
            self.set_admin_user_ids(current_ids)

    def remove_admin_user(self, user_id: int):
        """移除管理员用户"""
        current_ids = self.get_admin_user_ids()
        if user_id in current_ids:
            current_ids.remove(user_id)
            self.set_admin_user_ids(current_ids)

    def is_admin_user(self, user_id: int):
        """检查用户是否为管理员"""
        return user_id in self.get_admin_user_ids()

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "companyId": self.company_id,
            "adminUserIds": self.get_admin_user_ids(),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }