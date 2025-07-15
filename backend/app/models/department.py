from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Department(Base):
    __tablename__ = 'departments'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company_id = Column(Integer, ForeignKey('companies.id'), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    company = relationship('Company', back_populates='departments')

    def __init__(self, name: str, company_id: int):
        self.name = name
        self.company_id = company_id

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "companyId": self.company_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }