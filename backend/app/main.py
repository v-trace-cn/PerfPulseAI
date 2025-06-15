import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.user     import router as user_router
from app.api.activity import router as activity_router
from app.api.reward   import router as reward_router
from app.api.scoring  import router as scoring_router
from app.api.auth     import router as auth_router

from app.core.config import settings
from app.core.database import Base

app = FastAPI(title="PerfPulseAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

# API 路由
app.include_router(user_router)
app.include_router(activity_router)
app.include_router(auth_router)
app.include_router(reward_router)
app.include_router(scoring_router)

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "code": 200, "message": "API服务器运行正常"}

# 添加根路由，可选
@app.get("/", include_in_schema=False)
async def root():
    return {"message": "PerfPulseAI API"}