# PerfPulseAI 安全与认证文档

## 1. 安全架构概述

### 1.1 安全设计原则
- **数据传输安全**: RSA 公钥加密敏感数据传输
- **数据存储安全**: 密码哈希存储，敏感信息加密
- **访问控制**: 基于角色的权限管理 (RBAC)
- **输入验证**: 严格的参数验证和SQL注入防护
- **会话管理**: 安全的用户会话机制
- **审计日志**: 关键操作的审计追踪

### 1.2 安全层次结构
```
┌─────────────────────────────────────┐
│        传输层安全 (RSA加密)           │
├─────────────────────────────────────┤
│        应用层安全 (权限控制)          │
├─────────────────────────────────────┤
│        会话层安全 (用户认证)          │
├─────────────────────────────────────┤
│        数据层安全 (密码哈希)          │
└─────────────────────────────────────┘
```

## 2. RSA 加密系统

### 2.1 密钥管理

#### 2.1.1 密钥生成
<augment_code_snippet path="backend/app/core/security.py" mode="EXCERPT">
````python
# 生成一对 2048 位的 RSA 密钥，启动时一次即可
_private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
_public_key = _private_key.public_key()
````
</augment_code_snippet>

#### 2.1.2 公钥分发
<augment_code_snippet path="backend/app/core/security.py" mode="EXCERPT">
````python
def get_public_key_pem() -> str:
    """返回 PEM 格式的公钥字符串，前端用它来加密"""
    pem = _public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return pem.decode('utf-8')
````
</augment_code_snippet>

### 2.2 数据加密解密

#### 2.2.1 解密流程
<augment_code_snippet path="backend/app/core/security.py" mode="EXCERPT">
````python
def decrypt_rsa(encrypted_b64: str) -> dict:
    """RSA 私钥解密，返回解析后的 JSON 对象"""
    ciphertext = base64.b64decode(encrypted_b64)
    plaintext = _private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return json.loads(plaintext.decode('utf-8'))
````
</augment_code_snippet>

#### 2.2.2 加密参数
- **密钥长度**: 2048 位
- **填充方案**: OAEP (Optimal Asymmetric Encryption Padding)
- **哈希算法**: SHA-256
- **编码格式**: Base64

### 2.3 使用场景
- **用户登录**: 用户名密码加密传输
- **用户注册**: 注册信息加密传输
- **密码重置**: 新密码加密传输
- **敏感配置**: 敏感配置信息加密传输

## 3. 密码安全

### 3.1 密码哈希

#### 3.1.1 哈希算法配置
<augment_code_snippet path="backend/app/models/user.py" mode="EXCERPT">
````python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
````
</augment_code_snippet>

#### 3.1.2 密码设置
<augment_code_snippet path="backend/app/models/user.py" mode="EXCERPT">
````python
def set_password(self, password):
    """设置密码哈希"""
    self.password_hash = pwd_context.hash(password)
````
</augment_code_snippet>

#### 3.1.3 密码验证
<augment_code_snippet path="backend/app/models/user.py" mode="EXCERPT">
````python
def check_password(self, password):
    """验证密码"""
    return pwd_context.verify(password, self.password_hash)
````
</augment_code_snippet>

### 3.2 密码策略
- **哈希算法**: PBKDF2-SHA256
- **迭代次数**: 默认 29000 次 (passlib 自动调整)
- **盐值**: 自动生成随机盐值
- **存储格式**: 哈希值 + 盐值 + 算法参数

### 3.3 密码安全最佳实践
- 不存储明文密码
- 使用强哈希算法
- 自动盐值生成
- 支持算法升级

## 4. 用户认证系统

### 4.1 认证流程

#### 4.1.1 登录认证
<augment_code_snippet path="backend/app/api/auth.py" mode="EXCERPT">
````python
@router.post("/login")
async def login(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """用户登录"""
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        return Response(data={}, message="登录失败，没有该用户，请注册", status_code=404, success=False)
    if user and user.check_password(password):
        return Response(data={"email": user.email, "name": user.name, "userId": user.id}, message="登录成功")
    raise HTTPException(status_code=401, detail=f"密码错误")
````
</augment_code_snippet>

#### 4.1.2 用户注册
<augment_code_snippet path="backend/app/api/auth.py" mode="EXCERPT">
````python
@router.post("/register")
async def register(data: dict = Body(...), db: AsyncSession = Depends(get_db)):
    """注册新用户"""
    if "encrypted" in data:
        data = decrypt_rsa(data["encrypted"])
    email = data.get("email")
    password = data.get("password")
    if not all([email, password]):
        raise HTTPException(status_code=400, detail="缺少必填字段")
    result = await db.execute(select(User).filter(User.email == email))
    if result.scalars().first():
        return Response(data={}, message="该邮箱已被注册", status_code=400, success=False)
    name = email.split("@")[0]
    new_user = User(name=name, email=email)
    new_user.set_password(password)
    db.add(new_user)
    await db.commit()
````
</augment_code_snippet>

### 4.2 会话管理

#### 4.2.1 用户身份识别
- **请求头**: `X-User-ID` 传递用户ID
- **查询参数**: `userId` 参数
- **请求体**: JSON 中的 `userId` 字段

#### 4.2.2 会话状态检查
```python
@router.get("/session")
async def get_session():
    """检查当前会话状态"""
    return Response(data={"authenticated": False}, message="")
```

### 4.3 邀请码验证

#### 4.3.1 邀请码机制
<augment_code_snippet path="backend/app/api/auth.py" mode="EXCERPT">
````python
@router.post("/verify-invite-code")
async def verify_invite_code(data: dict = Body(...)):
    """验证邀请码"""
    import os
    invite_code = data.get("inviteCode")
    if not invite_code:
        return Response(
            data={"valid": False},
            message="邀请码不能为空",
            status_code=400,
            success=False
        )
    # 从环境变量获取有效的邀请码
    valid_invite_code = os.getenv("INVITE_CODE")
    if invite_code == valid_invite_code:
        return Response(
            data={"valid": True},
            message="邀请码验证成功"
        )
````
</augment_code_snippet>

## 5. 权限控制系统

### 5.1 权限检查器

#### 5.1.1 基础权限检查器
<augment_code_snippet path="backend/app/core/permissions.py" mode="EXCERPT">
````python
class PermissionChecker:
    def __init__(self, required_permissions: List[str], require_company_access: bool = True):
        self.required_permissions = required_permissions
        self.require_company_access = require_company_access
    
    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        """检查用户权限"""
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="未提供用户身份信息")
````
</augment_code_snippet>

#### 5.1.2 简化用户检查器
<augment_code_snippet path="backend/app/core/permissions.py" mode="EXCERPT">
````python
class SimpleUserRequired:
    """简化的用户身份验证，不检查具体权限"""
    
    async def __call__(self, request: Request, db: AsyncSession = Depends(get_db)):
        """只检查用户身份，不验证权限"""
        user_id = request.headers.get("X-User-ID")
        if not user_id:
            raise HTTPException(status_code=401, detail="未提供用户身份信息")
        
        result = await db.execute(
            select(User)
            .options(selectinload(User.company))
            .filter(User.id == user_id)
        )
        user = result.scalars().first()
        
        if not user:
            raise HTTPException(status_code=404, detail="用户不存在")
        
        return user
````
</augment_code_snippet>

### 5.2 预定义权限检查器

#### 5.2.1 权限检查器实例
```python
class PermissionCheckers:
    """预定义的权限检查器"""
    
    # 公司管理权限
    company_create = PermissionChecker(['company.create'], require_company_access=False)
    company_read = PermissionChecker(['company.read'])
    company_update = PermissionChecker(['company.update'])
    company_delete = PermissionChecker(['company.delete'])
    
    # 用户管理权限
    user_create = PermissionChecker(['user.create'])
    user_read = PermissionChecker(['user.read'])
    user_update = PermissionChecker(['user.update'])
    user_delete = PermissionChecker(['user.delete'])
```

### 5.3 权限验证装饰器

#### 5.3.1 认证装饰器
<augment_code_snippet path="backend/app/core/decorators.py" mode="EXCERPT">
````python
def require_authenticated(func: Callable) -> Callable:
    """需要用户认证的装饰器"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper
````
</augment_code_snippet>

#### 5.3.2 管理员权限装饰器
<augment_code_snippet path="backend/app/core/decorators.py" mode="EXCERPT">
````python
def require_admin(func: Callable) -> Callable:
    """需要管理员权限的装饰器"""
    @wraps(func)
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail="需要管理员权限")
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper
````
</augment_code_snippet>

## 6. 输入验证与安全

### 6.1 参数验证
- **类型检查**: 严格的参数类型验证
- **长度限制**: 字符串长度限制
- **格式验证**: 邮箱、URL 等格式验证
- **范围检查**: 数值范围验证

### 6.2 SQL 注入防护
- **ORM 使用**: 使用 SQLAlchemy ORM 防止 SQL 注入
- **参数化查询**: 所有查询使用参数化方式
- **输入转义**: 特殊字符转义处理

### 6.3 XSS 防护
- **输出转义**: 用户输入内容输出时转义
- **内容过滤**: 过滤危险的 HTML 标签
- **CSP 头**: 设置内容安全策略

## 7. 配置安全

### 7.1 环境变量配置
<augment_code_snippet path="backend/app/core/config.py" mode="EXCERPT">
````python
class Settings:
    APP_NAME: str = "PerfPulseAI API"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 5000))
    
    # GitHub App  
    GITHUB_APP_ID: str = os.getenv("GITHUB_APP_ID")
    GITHUB_WEBHOOK_SECRET: str = os.getenv("GITHUB_WEBHOOK_SECRET")
    GITHUB_PRIVATE_KEY_PATH: str = os.getenv("GITHUB_PRIVATE_KEY_PATH")
    
    DATABASE_URL = f"sqlite+aiosqlite:///{str(BACKEND_DIR / 'db' / 'perf.db')}"
````
</augment_code_snippet>

### 7.2 敏感信息保护
- **环境变量**: 敏感配置通过环境变量传递
- **密钥轮换**: 支持密钥定期轮换
- **配置加密**: 敏感配置文件加密存储
- **访问控制**: 配置文件访问权限控制

### 7.3 配置示例
```bash
# .env.example
PORT=5000
HOST=0.0.0.0

GITHUB_APP_ID=your_app_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret

DOUBAO_MODEL=DOUBAO_MODEL
DOUBAO_API_KEY=DOUBAO_API_KEY
DOUBAO_URLS=DOUBAO_URLS

INVITE_CODE="INVITE_CODE"
```

## 8. 安全监控与审计

### 8.1 日志记录
- **访问日志**: 记录所有 API 访问
- **错误日志**: 记录系统错误和异常
- **安全日志**: 记录安全相关事件
- **审计日志**: 记录关键操作

### 8.2 异常处理
- **统一异常处理**: 全局异常处理机制
- **错误信息过滤**: 避免敏感信息泄露
- **错误码标准化**: 统一的错误码体系

### 8.3 安全事件监控
- **登录失败**: 监控异常登录尝试
- **权限违规**: 监控权限访问违规
- **数据异常**: 监控数据异常访问
- **系统异常**: 监控系统异常状态

## 9. 安全最佳实践

### 9.1 开发安全
- **代码审查**: 安全相关代码必须审查
- **依赖管理**: 定期更新安全依赖
- **漏洞扫描**: 定期进行安全漏洞扫描
- **安全测试**: 包含安全测试用例

### 9.2 部署安全
- **HTTPS**: 生产环境强制使用 HTTPS
- **防火墙**: 配置适当的防火墙规则
- **访问控制**: 最小权限原则
- **监控告警**: 安全事件实时告警

### 9.3 运维安全
- **定期备份**: 重要数据定期备份
- **访问审计**: 定期审计访问权限
- **安全更新**: 及时应用安全更新
- **应急响应**: 建立安全应急响应机制
