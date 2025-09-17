from logging.config import fileConfig
import sys
import os

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine # 导入 create_async_engine
import asyncio

from alembic import context

# 简化路径配置
# 获取backend目录路径
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# 新增：导入您的 Base 和模型
from app.core.database import Base # 导入您的 Base 对象
from app.models.user import User # 导入所有需要迁移的模型
from app.models.department import Department
from app.models.company import Company
from app.models.role import Role


# 导入其他模型
from app.models.activity import Activity
from app.models.reward import Reward
from app.models.scoring import ScoringFactor 
from app.models.pull_request_result import PullRequestResult
from app.models.pull_request import PullRequest
from app.models.pull_request_event import PullRequestEvent

# 导入新的PR模型
from app.models.pr_metadata import PrMetadata, PrMetrics
from app.models.pr_lifecycle_event import PrLifecycleEvent
from app.models.user_identity import UserIdentity

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata

# 配置命名约定以避免None约束名
from sqlalchemy import MetaData
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# 创建新的metadata实例并应用命名约定
target_metadata = MetaData(naming_convention=naming_convention)
# 复制现有表定义到新的metadata
for table in Base.metadata.tables.values():
    table.tometadata(target_metadata)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        echo=False,
        connect_args={"check_same_thread": False} if config.get_main_option("sqlalchemy.url").startswith("sqlite") else {},
    )

    def do_run_migrations(connection): # 定义一个同步函数来运行迁移
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True  # 新增：为 SQLite 启用批处理模式
        )

        with context.begin_transaction():
            context.run_migrations()

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations) # 使用 connection.run_sync


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
