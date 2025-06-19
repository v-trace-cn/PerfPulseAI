import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from starlette.staticfiles import StaticFiles

# 自动批量注册 api 路由
import pkgutil
import importlib
from app.api import __path__ as api_path
from app.core.database import engine, Base
from sqlalchemy import inspect, text 
from app.api import pull_request as pr_router

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
app.include_router(pr_router.router)

# # 添加静态文件服务
# app.mount("/static", StaticFiles(directory="./static"), name="static")

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
    # 确保 users 表包含 github_url 和 avatar_url 列
    try:
        inspector = inspect(engine)
        columns = [col['name'] for col in inspector.get_columns('users')]
        # 处理 github_username 到 github_url 的迁移
        if 'github_username' in columns:
            with engine.connect() as conn:
                conn.execute(text('ALTER TABLE users DROP COLUMN github_username'))
                conn.execute(text('ALTER TABLE users ADD COLUMN github_url VARCHAR(200)'))
                print("Migrated github_username to github_url.")
        elif 'github_url' not in columns:
            with engine.connect() as conn:
                conn.execute(text('ALTER TABLE users ADD COLUMN github_url VARCHAR(200)'))
                print("Added github_url column.")

        # 添加 avatar_url 列
        if 'avatar_url' not in columns:
            with engine.connect() as conn:
                conn.execute(text('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)'))
                print("Added avatar_url column.")

    except Exception as e:
        print(f"Database migration failed: {e}") # 打印更详细的错误信息
        pass