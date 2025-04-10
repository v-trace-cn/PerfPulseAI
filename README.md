# PerfPulseAI

PerfPulseAI 是一个 Flask 驱动的全栈应用，用于 AI 绩效管理和激励机制。

## 项目概述

PerfPulseAI 旨在通过 AI 技术自动化梳理和管理员工绩效，提供透明的激励机制，促进团队协作和个人成长。该项目采用 Flask 作为全栈解决方案，既提供后端 API 服务，也负责渲染前端页面。

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
├── backend/                   # Flask API服务器
│   ├── app.py                 # Flask应用入口
│   ├── config.py              # 配置文件
│   ├── requirements.txt       # Python依赖
│   ├── .env.example           # 环境变量示例
│   ├── api/                   # API路由
│   │   ├── __init__.py
│   │   ├── user_routes.py
│   │   ├── activity_routes.py
│   │   ├── reward_routes.py
│   │   └── scoring_routes.py
│   └── models/                # 数据模型
│       ├── __init__.py
│       ├── user.py
│       ├── activity.py
│       └── reward.py
│
└── frontend/                  # React前端 (基于ai-governance)
    ├── package.json           # NPM配置文件
    ├── README.md              # 前端说明文档
    ├── public/                # 静态资源
    ├── src/                   # 源代码
    │   ├── components/        # 组件
    │   ├── app/               # 页面
    │   ├── hooks/             # 自定义钩子
    │   ├── api/               # API调用函数
    │   └── styles/            # 样式文件
    └── .env.example           # 环境变量示例
```

## 部署流程

1. **后端部署**
   - 安装Python和依赖: `pip install -r backend/requirements.txt`
   - 配置环境变量: 复制 `.env.example` 到 `.env` 并修改
   - （首次可选）启动数据库: `python backend/init_db.py`
   - 启动API服务器: `python backend/app.py`

2. **前端部署**
   - 安装Node.js和依赖: `cd frontend && npm install` 或者 `npm install --legacy-peer-deps`
   - 开发模式: `npm run dev`
   - 生产构建: `npm run build`

## 项目特点

- **前后端分离**: 清晰的职责划分，易于维护
- **API优先设计**: 提供完整的API文档
- **现代化前端**: 基于React的优雅UI
- **简易部署**: 支持多种部署方式
- **开源友好**: 符合开源标准的项目结构和文档