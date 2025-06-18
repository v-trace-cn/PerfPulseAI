import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

# 自动批量注册 api 路由
import pkgutil
import importlib
from app.api import __path__ as api_path

from app.core.config import settings
from app.core.database import engine, Base
from sqlalchemy import inspect, text  # 新增用于检查和添加列

app = FastAPI(title="PerfPulseAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# 自动遍历 api 目录并注册所有 router
for _, module_name, _ in pkgutil.iter_modules(api_path):
    module = importlib.import_module(f"app.api.{module_name}")
    if hasattr(module, "router"):
        app.include_router(module.router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "code": 200, "message": "API服务器运行正常"}

# 添加根路由，可选
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "PerfPulseAI API"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

@app.on_event("startup")
async def create_tables():
    # 创建所有表（不包含已存在表的列）
    Base.metadata.create_all(bind=engine)
    # 确保 users 表包含 github_username 列
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        if 'github_username' not in columns:
            with engine.connect() as conn:
                conn.execute(text('ALTER TABLE users ADD COLUMN github_username VARCHAR(100)'))
    except Exception:
        # 若添加列失败（如列已存在或不支持），忽略
        pass