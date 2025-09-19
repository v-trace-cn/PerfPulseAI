import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).parent.parent.parent
env_path = BACKEND_DIR / '.env'
load_dotenv(dotenv_path=env_path)

class Settings:
    APP_NAME: str = "PerfPulseAI API"
    HOST: str      = os.getenv("HOST", "0.0.0.0")
    PORT: int      = int(os.getenv("PORT", 5000))

    # GitHub App
    GITHUB_APP_ID: str          = os.getenv("GITHUB_APP_ID")
    GITHUB_WEBHOOK_SECRET: str  = os.getenv("GITHUB_WEBHOOK_SECRET")
    GITHUB_PRIVATE_KEY_PATH: str= os.getenv("GITHUB_PRIVATE_KEY_PATH")
    GITHUB_PAT: str             = os.getenv("GITHUB_PAT", "")

    DATABASE_URL = f"sqlite+aiosqlite:///{str(BACKEND_DIR / 'db' / 'perf.db')}"

    # 豆包 AI API 配置
    DOUBAO_URLS: str = os.getenv("DOUBAO_URLS", "")
    DOUBAO_MODEL: str = os.getenv("DOUBAO_MODEL", "")
    DOUBAO_API_KEY: str = os.getenv("DOUBAO_API_KEY", "")


    # Email settings
    MAIL_USERNAME: str = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD: str = os.getenv("MAIL_PASSWORD")
    MAIL_FROM: str = os.getenv("MAIL_FROM")
    MAIL_PORT: int = int(os.getenv("MAIL_PORT", 587))  # 默认 SMTP 端口
    MAIL_SERVER: str = os.getenv("MAIL_SERVER")
    MAIL_TLS: bool = os.getenv("MAIL_TLS", "True").lower() == "true"
    MAIL_SSL: bool = os.getenv("MAIL_SSL", "False").lower() == "true"
    USE_CREDENTIALS: bool = os.getenv("USE_CREDENTIALS", "True").lower() == "true"
    VALIDATE_CERTS: bool = os.getenv("VALIDATE_CERTS", "True").lower() == "true"

settings = Settings()
