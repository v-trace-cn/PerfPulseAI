import os
from pathlib import Path
from dotenv import load_dotenv

# 自动加载 .env.example 文件（使用 Path）
# env_path = Path(__file__).parent.parent.parent / '.env.example'
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    APP_NAME: str = "PerfPulseAI API"
    HOST: str      = os.getenv("HOST", "0.0.0.0")
    PORT: int      = int(os.getenv("PORT", 5000))
    # GitHub App  
    GITHUB_APP_ID: str          = os.getenv("GITHUB_APP_ID")
    GITHUB_WEBHOOK_SECRET: str  = os.getenv("GITHUB_WEBHOOK_SECRET")
    GITHUB_PRIVATE_KEY_PATH: str= os.getenv("GITHUB_PRIVATE_KEY_PATH")
    DATABASE_URL = os.getenv("DATABASE_URL")

settings = Settings()