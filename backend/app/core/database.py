import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

# 从 app.core.config 导入 settings
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# 如果是 SQLite，确保数据库文件所在的目录存在
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    # Change the prefix for async SQLite
    DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
    db_file_path_str = DATABASE_URL.split("///")[1]
    db_dir = Path(db_file_path_str).parent
    os.makedirs(db_dir, exist_ok=True)

# 配置异步数据库引擎
async_engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

# 配置异步会话工厂
AsyncSessionLocal = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()