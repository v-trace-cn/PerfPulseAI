import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "PerfPulseAI API"
    HOST: str      = os.getenv("HOST", "0.0.0.0")
    PORT: int      = int(os.getenv("PORT", 5000))
    # GitHub App  
    GITHUB_APP_ID: str          = os.getenv("GITHUB_APP_ID")
    GITHUB_WEBHOOK_SECRET: str  = os.getenv("GITHUB_WEBHOOK_SECRET")
    GITHUB_PRIVATE_KEY_PATH: str= os.getenv("GITHUB_PRIVATE_KEY_PATH")

settings = Settings()