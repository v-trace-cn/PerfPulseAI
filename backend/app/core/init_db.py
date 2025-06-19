from .database import engine, Base
from app.models.user     import User
from app.models.activity import Activity
from app.models.reward   import Reward
from app.models.scoring  import ScoringCriteria, ScoringFactor, GovernanceMetric
from app.models.pull_request_result import PullRequestResult
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent

from .seed_data import seed_data

def init_db():
    # 创建所有表
    Base.metadata.create_all(bind=engine)
    # 写入初始数据
    seed_data()

if __name__ == "__main__":
    init_db()