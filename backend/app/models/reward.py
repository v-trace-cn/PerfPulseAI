"""
Reward model for the PerfPulseAI application.
"""
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Reward(Base):
    """Reward model representing a reward in the system."""
    __tablename__ = 'rewards'
    
    id = Column(String(36), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    cost = Column(Integer, nullable=False)
    icon = Column(String(200))
    available = Column(Boolean, default=True)
    category = Column(String(50))
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))
    
    # 关联关系
    redemptions = relationship('Redemption', back_populates='reward')
    suggestions = relationship('RewardSuggestion', back_populates='reward')
    
    def __init__(self, id, name, description, cost, icon=None, available=True):
        """
        Initialize a new Reward.
        """
        self.id = id
        self.name = name
        self.description = description
        self.cost = cost
        self.icon = icon
        self.available = available
        
    def to_dict(self):
        """
        Convert the reward object to a dictionary.
        
        Returns:
            dict: Dictionary representation of the reward
        """
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "cost": self.cost,
            "icon": self.icon,
            "available": self.available,
            "category": self.category,
            "likes": self.likes or 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }


class Redemption(Base):
    """Redemption model representing a reward redemption in the system."""
    __tablename__ = 'redemptions'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    reward_id = Column(String(36), ForeignKey('rewards.id'), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reward = relationship('Reward', back_populates='redemptions')
    
    def __init__(self, id, user_id, reward_id, timestamp=None, status="pending"):
        """
        Initialize a new Redemption.
        """
        self.id = id
        self.user_id = user_id
        self.reward_id = reward_id
        
        # 处理日期字段
        if isinstance(timestamp, str):
            try:
                self.timestamp = datetime.fromisoformat(timestamp)
            except ValueError:
                self.timestamp = datetime.utcnow()
        elif timestamp is None:
            self.timestamp = datetime.utcnow()
        else:
            self.timestamp = timestamp
            
        self.status = status
        
    def to_dict(self):
        """
        Convert the redemption object to a dictionary.
        
        Returns:
            dict: Dictionary representation of the redemption
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "reward_id": self.reward_id,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class RewardSuggestion(Base):
    """Model for user suggestions about rewards."""
    __tablename__ = 'reward_suggestions'
    
    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=True)  # Nullable to allow anonymous suggestions
    reward_id = Column(String(36), ForeignKey('rewards.id'), nullable=True)  # Nullable for new reward suggestions
    suggestion_text = Column(Text, nullable=False)
    suggested_value = Column(Integer, nullable=True)
    name = Column(String(100), nullable=True)  # For new reward suggestions
    description = Column(Text, nullable=True)  # For new reward suggestions
    category = Column(String(50), nullable=True)  # For new reward suggestions
    is_new_reward = Column(Boolean, default=False)  # Flag to indicate if this is a suggestion for a new reward
    status = Column(String(20), default='pending')  # pending, approved, rejected
    timestamp = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0), onupdate=lambda: datetime.utcnow().replace(microsecond=0))
    
    reward = relationship('Reward', back_populates='suggestions')
    
    def __init__(self, id, user_id, reward_id=None, suggestion_text='', suggested_value=None, 
                 name=None, description=None, category=None, is_new_reward=False, 
                 timestamp=None, status="pending"):
        """
        Initialize a new RewardSuggestion.
        """
        self.id = id
        self.user_id = user_id
        self.reward_id = reward_id
        self.suggestion_text = suggestion_text
        self.suggested_value = suggested_value
        self.name = name
        self.description = description
        self.category = category
        self.is_new_reward = is_new_reward
        
        # 处理日期字段
        if isinstance(timestamp, str):
            try:
                self.timestamp = datetime.fromisoformat(timestamp)
            except ValueError:
                self.timestamp = datetime.utcnow()
        elif timestamp is None:
            self.timestamp = datetime.utcnow()
        else:
            self.timestamp = timestamp
            
        self.status = status
        
    def to_dict(self):
        """
        Convert the suggestion object to a dictionary.
        
        Returns:
            dict: Dictionary representation of the suggestion
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "reward_id": self.reward_id,
            "suggestion_text": self.suggestion_text,
            "suggested_value": self.suggested_value,
            "name": self.name,
            "description": self.description,
            "category": self.category,
            "is_new_reward": self.is_new_reward,
            "status": self.status,
            "timestamp": self.timestamp.isoformat() if isinstance(self.timestamp, datetime) else self.timestamp,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
