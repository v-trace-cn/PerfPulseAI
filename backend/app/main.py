import importlib
import pkgutil # 自动批量注册 api 路由

from app.api import __path__ as api_path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

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


@app.get("/health")
@app.get("/api/health")
@app.options("/health")
async def health_check():
    return {"status": "ok", "code": 200, "message": "API服务器运行正常"}

# 添加根路由，可选
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "PerfPulseAI API"}

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return Response(status_code=204)

