import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

# 从 app.core.config 导入 settings
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# 如果是 SQLite，确保数据库文件所在的目录存在
if DATABASE_URL and DATABASE_URL.startswith("sqlite"):
    db_file_path_str = DATABASE_URL.split("///")[1]
    db_dir = Path(db_file_path_str).parent
    os.makedirs(db_dir, exist_ok=True)

# 根据 DATABASE_URL 判断数据库类型
is_sqlite = DATABASE_URL.startswith("sqlite")

# 配置数据库引擎
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()