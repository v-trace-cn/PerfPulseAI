# PerfPulseAI

PerfPulseAI 是一个企业级的性能管理和积分系统，提供完整的用户管理、积分系统、通知系统和组织管理功能。

## 📖 项目概述

PerfPulseAI 旨在通过现代化的技术栈提供高效的性能管理和激励机制，促进团队协作和个人成长。项目采用前后端分离架构，前端使用 Next.js + React，后端使用 FastAPI + Python。

## 🚀 快速开始

### 环境要求
- **前端**: Node.js 18+, npm/yarn
- **后端**: Python 3.9+, PostgreSQL 12+, Redis 6+

### 本地开发

1. **后端设置**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   pip install -r requirements.txt
   cp .env.example .env  # 配置环境变量
   alembic upgrade head  # 数据库迁移
   python app/run.py     # 启动后端服务
   ```

2. **前端设置**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local  # 配置环境变量
   npm run dev                 # 启动前端服务
   ```

3. **访问应用**
   - 前端: http://localhost:3000
   - 后端 API: http://localhost:5000
   - API 文档: http://localhost:5000/docs


## 📚 文档

完整的项目文档请查看：

- [📋 项目文档中心](./docs/README.md) - 完整的文档导航和项目概述
- [📝 更新日志](./CHANGELOG.md) - 版本更新和变更记录
- [🖥️ 前端文档](./frontend/docs/README.md) - 前端开发指南
- [🔧 后端文档](./backend/docs/README.md) - 后端开发指南

## 🏗️ 项目结构

```
PerfPulseAI/
├── README.md                  # 项目说明文档
├── CHANGELOG.md               # 更新日志
├── LICENSE                    # 开源许可证
├── .gitignore                 # Git忽略文件
│
├── docs/                      # 项目文档中心
│   └── README.md             # 文档导航和概述
│
├── backend/                   # FastAPI 后端应用
│   ├── app/                   # 应用主目录
│   │   ├── api/               # API 路由
│   │   ├── core/              # 核心配置
│   │   ├── models/            # 数据模型
│   │   ├── services/          # 业务逻辑
│   │   └── main.py           # 应用入口
│   ├── docs/                  # 后端文档
│   ├── requirements.txt       # Python依赖
│   └── .env.example          # 环境变量示例
│
└── frontend/                  # Next.js 前端应用
    ├── app/                   # Next.js App Router
    ├── components/            # React 组件
    ├── hooks/                 # 自定义 Hooks
    ├── lib/                   # 工具函数
    ├── docs/                  # 前端文档
    └── package.json          # Node.js 依赖
```

## 🎯 核心功能

- **用户认证系统** - JWT Token 认证、RSA 加密、权限控制
- **积分系统** - 积分获取消费、等级系统、事务处理
- **积分商城** - 商品管理、购买流程、兑换码系统
- **通知系统** - 实时 SSE 推送、通知分类、时区处理
- **组织管理** - 公司部门管理、成员管理、权限分配

## 🛠️ 技术栈

### 前端
- **Next.js 14** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Shadcn/ui** - 组件库

### 后端
- **FastAPI** - Web 框架
- **SQLAlchemy** - ORM
- **PostgreSQL** - 数据库
- **Redis** - 缓存

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码提交规范
```bash
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 获取帮助

- 📖 查看 [项目文档](./docs/README.md)
- 🐛 提交 [Issue](../../issues)
- 💬 参与 [讨论](../../discussions)

---

**最后更新**: 2025-08-08
**项目状态**: 开发中
