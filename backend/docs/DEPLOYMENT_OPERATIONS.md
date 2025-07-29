# PerfPulseAI 部署与运维文档

## 1. 部署概述

### 1.1 部署架构
```
┌─────────────────────────────────────┐
│            Load Balancer            │
├─────────────────────────────────────┤
│         Frontend (Next.js)          │
├─────────────────────────────────────┤
│         Backend (FastAPI)           │
├─────────────────────────────────────┤
│        Database (SQLite/PG)         │
└─────────────────────────────────────┘
```

### 1.2 环境要求
- **Python**: 3.9+
- **Node.js**: 18+
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **操作系统**: Linux/Windows/macOS
- **内存**: 最低 2GB，推荐 4GB+
- **存储**: 最低 10GB，推荐 50GB+

## 2. 开发环境部署

### 2.1 后端部署

#### 2.1.1 环境准备
```bash
# 克隆项目
git clone <repository-url>
cd PerfPulseAI

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate     # Windows

# 安装依赖
cd backend
pip install -r requirements.txt
```

#### 2.1.2 环境配置
<path="backend/.env.example">
````bash
# 服务器配置
PORT=5000
HOST=0.0.0.0

GITHUB_APP_ID=your_app_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret

DOUBAO_MODEL=DOUBAO_MODEL
DOUBAO_API_KEY=DOUBAO_API_KEY
DOUBAO_URLS=DOUBAO_URLS

INVITE_CODE="INVITE_CODE"
````


```bash
# 复制配置文件
cp .env.example .env
# 编辑配置文件
nano .env
```

#### 2.1.3 数据库初始化
```bash
# 运行数据库迁移
alembic upgrade head

# 或者使用初始化脚本
python -c "
import asyncio
from app.core.init_db import init_db
asyncio.run(init_db())
"
```

#### 2.1.4 启动服务
```bash
# 启动开发服务器
python app/run.py

# 或者直接使用 uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 5000 --reload
```

### 2.2 前端部署

#### 2.2.1 环境准备
```bash
cd frontend

# 安装依赖
npm install
# 或者使用 legacy-peer-deps 解决依赖冲突
npm install --legacy-peer-deps
```

#### 2.2.2 环境配置
```bash
# 创建环境变量文件
echo "NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000" > .env.local
```

#### 2.2.3 启动服务
```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

### 2.3 健康检查
```bash
# 检查后端服务
curl http://localhost:5000/api/health

# 检查前端服务
curl http://localhost:3000
```

## 3. 生产环境部署

### 3.1 服务器准备

#### 3.1.1 系统要求
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm nginx

# CentOS/RHEL
sudo yum update
sudo yum install python3 python3-pip nodejs npm nginx
```

#### 3.1.2 用户创建
```bash
# 创建应用用户
sudo useradd -m -s /bin/bash perfpulse
sudo usermod -aG sudo perfpulse

# 切换到应用用户
sudo su - perfpulse
```

### 3.2 应用部署

#### 3.2.1 代码部署
```bash
# 克隆代码
git clone <repository-url> /opt/perfpulse
cd /opt/perfpulse

# 设置权限
sudo chown -R perfpulse:perfpulse /opt/perfpulse
```

#### 3.2.2 后端部署
```bash
cd /opt/perfpulse/backend

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑生产配置
nano .env
```

#### 3.2.3 数据库配置
```bash
# PostgreSQL 配置 (推荐生产环境)
sudo apt install postgresql postgresql-contrib

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE perfpulse;
CREATE USER perfpulse WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE perfpulse TO perfpulse;
\q

# 更新数据库URL
echo "DATABASE_URL=postgresql+asyncpg://perfpulse:your_password@localhost/perfpulse" >> .env
```

#### 3.2.4 前端构建
```bash
cd /opt/perfpulse/frontend

# 安装依赖
npm install --production

# 构建生产版本
npm run build
```

### 3.3 服务配置

#### 3.3.1 Systemd 服务配置
```bash
# 创建后端服务文件
sudo tee /etc/systemd/system/perfpulse-backend.service > /dev/null <<EOF
[Unit]
Description=PerfPulseAI Backend
After=network.target

[Service]
Type=simple
User=perfpulse
WorkingDirectory=/opt/perfpulse/backend
Environment=PATH=/opt/perfpulse/backend/venv/bin
ExecStart=/opt/perfpulse/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 5000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 创建前端服务文件
sudo tee /etc/systemd/system/perfpulse-frontend.service > /dev/null <<EOF
[Unit]
Description=PerfPulseAI Frontend
After=network.target

[Service]
Type=simple
User=perfpulse
WorkingDirectory=/opt/perfpulse/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl daemon-reload
sudo systemctl enable perfpulse-backend perfpulse-frontend
sudo systemctl start perfpulse-backend perfpulse-frontend
```

#### 3.3.2 Nginx 配置
```bash
# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/perfpulse > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/perfpulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 4. 数据库管理

### 4.1 迁移管理

#### 4.1.1 Alembic 配置
<path="backend/alembic/env.py">
````python
# 导入所有模型
from app.core.database import Base
from app.models.user import User
from app.models.department import Department
from app.models.company import Company
from app.models.role import Role
from app.models.permission import Permission
````


#### 4.1.2 迁移操作
```bash
# 查看当前版本
alembic current

# 升级到最新版本
alembic upgrade head

# 查看迁移历史
alembic history --verbose

# 生成新迁移
alembic revision --autogenerate -m "描述信息"

# 回滚迁移
alembic downgrade -1
```

### 4.2 备份策略

#### 4.2.1 SQLite 备份
```bash
#!/bin/bash
# backup_sqlite.sh
BACKUP_DIR="/opt/perfpulse/backups"
DB_FILE="/opt/perfpulse/backend/db/perf.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_FILE $BACKUP_DIR/perf_backup_$DATE.db

# 保留最近30天的备份
find $BACKUP_DIR -name "perf_backup_*.db" -mtime +30 -delete
```

#### 4.2.2 PostgreSQL 备份
```bash
#!/bin/bash
# backup_postgresql.sh
BACKUP_DIR="/opt/perfpulse/backups"
DB_NAME="perfpulse"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump $DB_NAME > $BACKUP_DIR/perfpulse_backup_$DATE.sql

# 压缩备份文件
gzip $BACKUP_DIR/perfpulse_backup_$DATE.sql

# 保留最近30天的备份
find $BACKUP_DIR -name "perfpulse_backup_*.sql.gz" -mtime +30 -delete
```

## 5. 日志管理

### 5.1 日志配置
<path="backend/app/core/logging_config.py">
````python
# 文件日志 handler（按天分割，保留60天）
file_handler = TimedRotatingFileHandler(LOG_FILE, when='midnight', backupCount=60, encoding='utf-8')
file_handler.suffix = "%Y-%m-%d.log"
file_handler.setFormatter(logging.Formatter(LOG_FORMAT, DATE_FORMAT))
file_handler.setLevel(logging.INFO)

# 控制台日志 handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(ColorFormatter(LOG_FORMAT, DATE_FORMAT))
console_handler.setLevel(logging.DEBUG)
````


### 5.2 日志轮转
```bash
# 配置 logrotate
sudo tee /etc/logrotate.d/perfpulse > /dev/null <<EOF
/opt/perfpulse/backend/logs/*.log {
    daily
    missingok
    rotate 60
    compress
    delaycompress
    notifempty
    create 644 perfpulse perfpulse
    postrotate
        systemctl reload perfpulse-backend
    endscript
}
EOF
```

### 5.3 日志监控
```bash
# 实时查看日志
tail -f /opt/perfpulse/backend/logs/app.log

# 查看错误日志
grep ERROR /opt/perfpulse/backend/logs/app.log

# 查看最近的日志
journalctl -u perfpulse-backend -f
```

## 6. 监控与告警

### 6.1 健康检查脚本
```bash
#!/bin/bash
# health_check.sh

# 检查后端服务
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "Backend: OK"
else
    echo "Backend: FAILED"
    systemctl restart perfpulse-backend
fi

# 检查前端服务
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "Frontend: OK"
else
    echo "Frontend: FAILED"
    systemctl restart perfpulse-frontend
fi

# 检查数据库连接
if python3 -c "
import asyncio
from app.core.database import async_engine
async def test():
    async with async_engine.begin() as conn:
        await conn.execute('SELECT 1')
asyncio.run(test())
" > /dev/null 2>&1; then
    echo "Database: OK"
else
    echo "Database: FAILED"
fi
```

### 6.2 性能监控
```bash
# 安装监控工具
sudo apt install htop iotop nethogs

# 监控系统资源
htop

# 监控磁盘I/O
iotop

# 监控网络使用
nethogs
```

### 6.3 自动化运维脚本
```bash
#!/bin/bash
# deploy.sh - 自动化部署脚本

set -e

echo "开始部署 PerfPulseAI..."

# 拉取最新代码
cd /opt/perfpulse
git pull origin main

# 更新后端
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head

# 更新前端
cd ../frontend
npm install --production
npm run build

# 重启服务
sudo systemctl restart perfpulse-backend perfpulse-frontend

echo "部署完成！"
```

## 7. 安全配置

### 7.1 防火墙配置
```bash
# UFW 配置
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 或者 iptables 配置
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### 7.2 SSL 证书配置
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 7.3 安全加固
```bash
# 禁用 root 登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# 修改 SSH 端口
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

# 重启 SSH 服务
sudo systemctl restart ssh

# 安装 fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

## 8. 故障排除

### 8.1 常见问题

#### 8.1.1 服务启动失败
```bash
# 查看服务状态
sudo systemctl status perfpulse-backend

# 查看详细日志
journalctl -u perfpulse-backend -n 50

# 检查端口占用
sudo netstat -tlnp | grep :5000
```

#### 8.1.2 数据库连接问题
```bash
# 检查数据库服务
sudo systemctl status postgresql

# 测试数据库连接
psql -h localhost -U perfpulse -d perfpulse

# 检查数据库日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### 8.1.3 权限问题
```bash
# 检查文件权限
ls -la /opt/perfpulse/

# 修复权限
sudo chown -R perfpulse:perfpulse /opt/perfpulse/
sudo chmod -R 755 /opt/perfpulse/
```

### 8.2 性能优化

#### 8.2.1 数据库优化
```sql
-- PostgreSQL 性能优化
-- 创建索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);

-- 分析表统计信息
ANALYZE;

-- 查看慢查询
SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

#### 8.2.2 应用优化
```bash
# 增加 worker 进程数
uvicorn app.main:app --host 0.0.0.0 --port 5000 --workers 4

# 使用 Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:5000
```

## 9. 维护计划

### 9.1 日常维护
- 每日：检查服务状态、查看错误日志
- 每周：检查磁盘空间、清理临时文件
- 每月：更新系统补丁、检查安全漏洞

### 9.2 定期任务
```bash
# 添加到 crontab
0 2 * * * /opt/perfpulse/scripts/backup_database.sh
0 3 * * 0 /opt/perfpulse/scripts/cleanup_logs.sh
0 4 1 * * /opt/perfpulse/scripts/security_update.sh
```

### 9.3 升级流程
1. 备份数据库和配置文件
2. 在测试环境验证新版本
3. 制定回滚计划
4. 执行升级部署
5. 验证功能正常
6. 监控系统状态
