import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# 确保数据库文件存放在独立目录
DB_DIR = os.getenv("DB_DIR", "db")
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)
db_file = os.getenv("DATABASE_FILE", "perf.db")
default_database_url = f"sqlite:///{os.path.join(DB_DIR, db_file)}"
DATABASE_URL = os.getenv("DATABASE_URL", default_database_url)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=True
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 依赖注入
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()