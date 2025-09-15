from .database import async_engine, Base
from app.models.user     import User
from app.models.activity import Activity
from app.models.reward   import Reward
from app.models.scoring  import ScoringFactor
from app.models.pull_request_result import PullRequestResult
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent
from app.models.company import Company
from app.models.department import Department
from app.models.role import Role


from .seed_data import seed_data

async def init_db():
    # 创建所有表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # 写入初始数据
    await seed_data()

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())