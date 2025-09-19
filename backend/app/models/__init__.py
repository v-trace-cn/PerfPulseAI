from .activity import Activity
from .company import Company
from .department import Department
from .notification import Notification
from .pr_lifecycle_event import PrEventType, PrLifecycleEvent

# 新的PR表结构 - 基于编码共识的领域驱动设计
from .pr_metadata import PrMetadata, PrMetrics, PrQualityLevel, PrStatus
from .pull_request import PullRequest
from .pull_request_event import PullRequestEvent
from .pull_request_result import PullRequestResult
from .reward import MallCategory, MallItem
from .role import Role
from .scoring import ScoringFactor
from .user import User

# 用户身份管理 - 统一多平台身份
from .user_identity import IdentityPlatform, IdentityStatus, UserIdentity

__all__ = [
    'Activity',
    'MallItem',
    'MallCategory',
    'ScoringFactor',
    'User',
    'Company',
    'Department',
    'Role',
    'PullRequest',
    'PullRequestEvent',
    'PullRequestResult',
    'Notification',
    # 新的PR表结构
    'PrMetadata',
    'PrLifecycleEvent',
    'PrEventType',
    'PrMetrics',
    'PrStatus',
    'PrQualityLevel',
    # 用户身份管理
    'UserIdentity',
    'IdentityPlatform',
    'IdentityStatus',
]
