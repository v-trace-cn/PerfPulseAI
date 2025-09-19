"""PR元数据和指标模型 - PR的基础信息和聚合计算结果
"""
from datetime import datetime
from enum import Enum

from app.core.database import Base
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship


class PrStatus(Enum):
    """PR状态枚举"""

    OPEN = "open"
    CLOSED = "closed"
    MERGED = "merged"
    DRAFT = "draft"


class PrQualityLevel(Enum):
    """PR质量等级"""

    EXCELLENT = "excellent"  # 90-100分
    GOOD = "good"           # 70-89分
    AVERAGE = "average"     # 50-69分
    POOR = "poor"          # 30-49分
    CRITICAL = "critical"   # 0-29分


class PrMetadata(Base):
    """PR元数据表 - 存储不可变的PR基础信息
    
    设计理念：
    - 一次写入，永不修改（除非数据源错误）
    - 只存储来自GitHub的原始元数据
    - 作为其他PR相关表的权威数据源
    """

    __tablename__ = 'pr_metadata'

    # 主键：使用GitHub的node_id作为自然主键
    pr_node_id = Column(String(100), primary_key=True)

    # GitHub原始数据（不可变）
    pr_number = Column(Integer, nullable=False, index=True)
    repository = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)

    # 作者身份关联（优化后的设计）
    author_identity_id = Column(Integer, ForeignKey('user_identities.id'), nullable=True, index=True)
    author_platform_username = Column(String(100), nullable=False, index=True)  # 冗余字段，便于查询

    # 提交信息
    head_commit_sha = Column(String(100), nullable=False)
    base_commit_sha = Column(String(100), nullable=True)
    commit_message = Column(Text, nullable=True)

    # 文件变更统计（GitHub API提供的原始数据）
    files_changed = Column(Integer, default=0)
    additions = Column(Integer, default=0)
    deletions = Column(Integer, default=0)

    # URL信息
    github_url = Column(String(500), nullable=False)
    diff_url = Column(String(500), nullable=True)
    patch_url = Column(String(500), nullable=True)

    # 时间戳（来自GitHub，不可变）
    github_created_at = Column(DateTime, nullable=False)
    github_updated_at = Column(DateTime, nullable=False)

    # 系统时间戳
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    lifecycle_events = relationship('PrLifecycleEvent', back_populates='pr_metadata', lazy='dynamic')
    metrics = relationship('PrMetrics', back_populates='pr_metadata', uselist=False)
    author_identity = relationship('UserIdentity', foreign_keys=[author_identity_id])

    def __init__(self, **kwargs):
        """初始化PR元数据
        
        Args:
            pr_node_id: GitHub PR node_id
            pr_number: PR编号
            repository: 仓库名称
            title: PR标题
            author: 作者
            github_created_at: GitHub创建时间
            **kwargs: 其他字段

        """
        super().__init__(**kwargs)

        # 确保时间精度为秒级
        if self.github_created_at:
            self.github_created_at = self.github_created_at.replace(microsecond=0)
        if self.github_updated_at:
            self.github_updated_at = self.github_updated_at.replace(microsecond=0)
        if self.created_at:
            self.created_at = self.created_at.replace(microsecond=0)

    def to_dict(self):
        """转换为字典格式"""
        return {
            "pr_node_id": self.pr_node_id,
            "pr_number": self.pr_number,
            "repository": self.repository,
            "title": self.title,
            "description": self.description,
            "author_identity_id": self.author_identity_id,
            "author_platform_username": self.author_platform_username,
            "head_commit_sha": self.head_commit_sha,
            "base_commit_sha": self.base_commit_sha,
            "commit_message": self.commit_message,
            "files_changed": self.files_changed,
            "additions": self.additions,
            "deletions": self.deletions,
            "github_url": self.github_url,
            "diff_url": self.diff_url,
            "patch_url": self.patch_url,
            "github_created_at": self.github_created_at.isoformat() if self.github_created_at else None,
            "github_updated_at": self.github_updated_at.isoformat() if self.github_updated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @classmethod
    def from_github_data(cls, github_pr_data, author_identity_id=None):
        """从GitHub API数据创建PR元数据

        Args:
            github_pr_data: GitHub API返回的PR数据
            author_identity_id: 作者身份ID（可选）

        Returns:
            PrMetadata: 新的PR元数据实例

        """
        return cls(
            pr_node_id=github_pr_data.get("node_id"),
            pr_number=github_pr_data.get("number"),
            repository=github_pr_data.get("base", {}).get("repo", {}).get("full_name"),
            title=github_pr_data.get("title"),
            description=github_pr_data.get("body"),
            author_identity_id=author_identity_id,
            author_platform_username=github_pr_data.get("user", {}).get("login"),
            head_commit_sha=github_pr_data.get("head", {}).get("sha"),
            base_commit_sha=github_pr_data.get("base", {}).get("sha"),
            commit_message=github_pr_data.get("head", {}).get("commit", {}).get("message"),
            files_changed=github_pr_data.get("changed_files", 0),
            additions=github_pr_data.get("additions", 0),
            deletions=github_pr_data.get("deletions", 0),
            github_url=github_pr_data.get("html_url"),
            diff_url=github_pr_data.get("diff_url"),
            patch_url=github_pr_data.get("patch_url"),
            github_created_at=datetime.fromisoformat(
                github_pr_data.get("created_at").replace('Z', '+00:00')
            ) if github_pr_data.get("created_at") else None,
            github_updated_at=datetime.fromisoformat(
                github_pr_data.get("updated_at").replace('Z', '+00:00')
            ) if github_pr_data.get("updated_at") else None,
        )

    def __repr__(self):
        return f"<PrMetadata(pr_node_id='{self.pr_node_id}', pr_number={self.pr_number}, repository='{self.repository}')>"


class PrMetrics(Base):
    """PR指标表 - 存储聚合计算的PR评估结果

    设计理念：
    - 定时修改
    - 缓存复杂计算结果，提升查询性能
    - 支持增量更新，避免重复计算
    - 提供多维度的PR质量评估
    - 作为积分计算和排行榜的数据源
    """

    __tablename__ = 'pr_metrics'

    # 主键：使用PR节点ID作为自然主键（一对一关系）
    pr_node_id = Column(String(100), ForeignKey('pr_metadata.pr_node_id'), primary_key=True)

    # PR状态信息
    current_status = Column(String(20), nullable=False, index=True)  # open, closed, merged, draft
    is_merged = Column(Boolean, default=False, index=True)
    merged_at = Column(DateTime, nullable=True)

    # 代码质量指标
    total_score = Column(Float, nullable=True, index=True)  # 0-100分的综合质量评分
    quality_level = Column(String(20), nullable=True, index=True)  # excellent, good, average, poor, critical
    code_quality = Column(Float, nullable=True)  # 代码质量评分
    innovation = Column(Float, nullable=True)  # 创新性评分
    observability = Column(Float, nullable=True)  # 文档完整性评分
    performance_optimization = Column(Float, nullable=True)  # 性能优化评分
    complexity_score = Column(Float, nullable=True)  # 代码复杂度评分
    maintainability_score = Column(Float, nullable=True)  # 可维护性评分

    # 可选
    test_coverage_score = Column(Float, nullable=True)  # 测试覆盖率评分
    security_score = Column(Float, nullable=True)  # 安全性评分
    vulnerability_count = Column(Integer, default=0)  # 漏洞数量
    critical_issues_count = Column(Integer, default=0)  # 严重问题数量
    review_count = Column(Integer, default=0)  # 审查次数
    comment_count = Column(Integer, default=0)  # 评论数量
    reviewer_count = Column(Integer, default=0)  # 审查者数量

    time_to_first_review = Column(Integer, nullable=True)  # 首次审查时间（分钟）
    time_to_merge = Column(Integer, nullable=True)  # 合并时间（分钟）
    active_days = Column(Integer, default=0)  # 活跃天数

    # 积分相关
    base_points = Column(Integer, default=0)  # 基础积分
    innovation_bonus = Column(Integer, default=0)  # 协作奖励积分
    total_points = Column(Integer, default=0, index=True)  # 总积分

    # AI分析结果
    ai_analysis_status = Column(String(20), default='pending')  # pending, completed, failed
    ai_analysis_result = Column(JSON, nullable=True)  # AI分析的详细结果
    ai_summary = Column(Text, nullable=True)  # AI分析摘要

    # 计算状态
    metrics_version = Column(String(10), default='1.0')  # 指标计算版本
    last_calculated_at = Column(DateTime, nullable=True)  # 最后计算时间
    needs_recalculation = Column(Boolean, default=True)  # 是否需要重新计算

    # 系统字段
    created_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))
    updated_at = Column(DateTime, default=lambda: datetime.utcnow().replace(microsecond=0))

    # 关联关系
    pr_metadata = relationship('PrMetadata', back_populates='metrics')

    def __init__(self, **kwargs):
        """初始化PR指标

        Args:
            pr_node_id: PR节点ID
            **kwargs: 其他字段

        """
        super().__init__(**kwargs)

        # 确保时间精度为秒级
        if self.merged_at:
            self.merged_at = self.merged_at.replace(microsecond=0)
        if self.last_calculated_at:
            self.last_calculated_at = self.last_calculated_at.replace(microsecond=0)
        if self.created_at:
            self.created_at = self.created_at.replace(microsecond=0)
        if self.updated_at:
            self.updated_at = self.updated_at.replace(microsecond=0)

    def to_dict(self):
        """转换为字典格式"""
        return {
            "pr_node_id": self.pr_node_id,
            "current_status": self.current_status,
            "is_merged": self.is_merged,
            "merged_at": self.merged_at.isoformat() if self.merged_at else None,
            "total_score": self.total_score,
            "quality_level": self.quality_level,
            "code_quality": self.code_quality,
            "innovation": self.innovation,
            "observability": self.observability,
            "performance_optimization": self.performance_optimization,
            "complexity_score": self.complexity_score,
            "maintainability_score": self.maintainability_score,
            "test_coverage_score": self.test_coverage_score,
            "security_score": self.security_score,
            "vulnerability_count": self.vulnerability_count,
            "critical_issues_count": self.critical_issues_count,
            "review_count": self.review_count,
            "comment_count": self.comment_count,
            "reviewer_count": self.reviewer_count,
            "time_to_first_review": self.time_to_first_review,
            "time_to_merge": self.time_to_merge,
            "active_days": self.active_days,
            "base_points": self.base_points,
            "innovation_bonus": self.innovation_bonus,
            "total_points": self.total_points,
            "ai_analysis_status": self.ai_analysis_status,
            "ai_analysis_result": self.ai_analysis_result,
            "ai_summary": self.ai_summary,
            "metrics_version": self.metrics_version,
            "last_calculated_at": self.last_calculated_at.isoformat() if self.last_calculated_at else None,
            "needs_recalculation": self.needs_recalculation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    def calculate_quality_level(self):
        """根据质量评分计算质量等级"""
        if self.total_score is None:
            return None

        if self.total_score >= 90:
            return PrQualityLevel.EXCELLENT.value
        elif self.total_score >= 70:
            return PrQualityLevel.GOOD.value
        elif self.total_score >= 50:
            return PrQualityLevel.AVERAGE.value
        elif self.total_score >= 30:
            return PrQualityLevel.POOR.value
        else:
            return PrQualityLevel.CRITICAL.value

    def calculate_total_points(self):
        """计算总积分"""
        self.total_points = (self.base_points or 0) + (self.innovation_bonus or 0)
        return self.total_points

    def mark_for_recalculation(self):
        """标记需要重新计算"""
        self.needs_recalculation = True
        self.updated_at = datetime.utcnow().replace(microsecond=0)

    def mark_calculated(self):
        """标记已完成计算"""
        self.needs_recalculation = False
        self.last_calculated_at = datetime.utcnow().replace(microsecond=0)
        self.updated_at = self.last_calculated_at

    @classmethod
    def create_initial_metrics(cls, pr_node_id, current_status='open'):
        """创建初始指标记录

        Args:
            pr_node_id: PR节点ID
            current_status: 当前状态

        Returns:
            PrMetrics: 新的指标实例

        """
        return cls(
            pr_node_id=pr_node_id,
            current_status=current_status,
            is_merged=False,
            needs_recalculation=True
        )

    def update_status(self, new_status, merged_at=None):
        """更新PR状态

        Args:
            new_status: 新状态
            merged_at: 合并时间（如果是merged状态）

        """
        self.current_status = new_status
        self.is_merged = (new_status == PrStatus.MERGED.value)

        if merged_at:
            self.merged_at = merged_at.replace(microsecond=0)

        self.mark_for_recalculation()

    def __repr__(self):
        return f"<PrMetrics(pr_node_id='{self.pr_node_id}', total_score={self.total_score})>"
