import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship, backref
from app.core.database import Base

class ScoringCriteria(Base):
    """积分评分标准模型"""
    __tablename__ = 'scoring_criteria'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    base_points = Column(Integer, default=0)
    weight = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "category": self.category,
            "description": self.description,
            "base_points": self.base_points,
            "weight": self.weight
        }

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
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
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    activity_id = Column(String(36), ForeignKey('activities.id'), nullable=True)
    criteria_id = Column(String(36), ForeignKey('scoring_criteria.id'), nullable=True)
    score = Column(Integer, nullable=False)
    factors = Column(JSON, nullable=True)  # 存储评分因素的JSON数据
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 关联关系
    user = relationship('User', backref=backref('scores', lazy=True))
    activity = relationship('Activity', backref=backref('scores', lazy=True))
    criteria = relationship('ScoringCriteria', backref=backref('score_entries', lazy=True))
    
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

class GovernanceMetric(Base):
    """治理指标模型"""
    __tablename__ = 'governance_metrics'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    dimension = Column(String(50), nullable=False)  # department, global, etc.
    metric_name = Column(String(50), nullable=False)  # 代码质量, 文档完整性, etc.
    value = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            "id": self.id,
            "dimension": self.dimension,
            "metric_name": self.metric_name,
            "value": self.value,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp
        }
