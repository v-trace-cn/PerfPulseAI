# PerfPulseAI

PerfPulseAI 是一个 FastAPI 驱动的全栈应用，用于 AI 绩效管理和激励机制。

## 项目概述

PerfPulseAI 旨在通过 AI 技术自动化梳理员工绩效，提供透明的激励机制，促进团队协作和个人成长。该项目采用 FastAPI 作为全栈解决方案，既提供后端 API 服务，也负责渲染前端页面。

## 部署流程

1. **后端部署**
   - 安装Python和依赖: `pip install -r backend/requirements.txt`
   - 配置环境变量: 复制 `backend/.env.example` 到 `backend/.env` 并修改
   - 启动API服务器: `python backend/app/run.py`

2. **前端部署**
   - 安装Node.js和依赖: `cd frontend && npm install` 或者 `npm install --legacy-peer-deps`
   - 开发模式: `npm run dev`
   - 生产构建: `npm run build`


## 项目结构

```
perfPulseAI/
├── README.md                  # 项目说明文档
├── LICENSE                    # 开源许可证
├── .gitignore                 # Git忽略文件
│
├── docs/                      # 项目文档
│   ├── architecture.md        # 架构设计文档
│   └──deployment.md           # 部署指南
│
├── backend/                   # FastAPI 后端应用
│   ├── app/                   # FastAPI 应用代码
│   │   ├── main.py            # FastAPI 应用入口
│   │   ├── api/               # 路由模块
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── activity.py
│   │   │   ├── reward.py
│   │   │   ├── webhook.py
│   │   │   └── scoring.py
│   ├── requirements.txt       # Python依赖
│   ├── .env.example           # 环境变量示例
│
└── frontend/
   ├── hooks/
   │   ├── use-mobile.tsx          # 统一的移动端检测
   │   └── useApi.ts              # API 调用 hook
   ├── lib/
   │   ├── toast-context.tsx      # Toast Context 提供者
   │   ├── toast-utils.ts         # Toast 工具函数
   │   ├── api.ts                 # Next.js API 路由调用
   │   └── direct-api.ts          # 直接后端 API 调用
   ├── components/ui/
   │   ├── use-toast.ts           # Toast hook 接口
   │   └── toaster.tsx            # Toast 渲染组件
   └── app/
      ├── globals.css            # 主要全局样式
      └── theme-vars.css         # 主题变量
```

## 项目特点

- **前后端分离**: 清晰的职责划分，易于维护
- **API优先设计**: 提供完整的API文档
- **现代化前端**: 基于React的优雅UI
- **简易部署**: 支持多种部署方式
- **开源友好**: 符合开源标准的项目结构和文档