import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# 确保数据库文件存放在独立目录
BASE_DIR = Path(__file__).parent.parent.parent
env_db_dir = os.getenv("DB_DIR")
if env_db_dir:
    db_dir_path = Path(env_db_dir)
    DB_DIR = db_dir_path if db_dir_path.is_absolute() else BASE_DIR / db_dir_path
else:
    DB_DIR = BASE_DIR / "db"
DB_DIR.mkdir(parents=True, exist_ok=True)
db_file = os.getenv("DATABASE_FILE", "perf.db")
DB_PATH = (DB_DIR / db_file).resolve()
path_str = str(DB_PATH).replace("\\", "/")  # 转为正斜杠
default_database_url = f"sqlite:///{path_str}"
print(f"[database] DATABASE_URL = {default_database_url}")
DATABASE_URL = os.getenv("DATABASE_URL", default_database_url)

# 若数据库文件不存在，先创建空文件，避免首次连接时报错
if not DB_PATH.exists():
    try:
        DB_PATH.touch()
    except Exception as e:
        print(f"[database] 无法创建数据库文件 {DB_PATH}: {e}")

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