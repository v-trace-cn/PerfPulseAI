from sqlalchemy.orm import Session
from .database import SessionLocal
from app.models.user import User
# … 导入其它模型

def seed_data():
    db: Session = SessionLocal()
    try:
        # 示例：初始化一个管理员账户
        if not db.query(User).filter_by(email="admin@example.com").first():
            admin = User(email="admin@example.com", name="Administrator")
            admin.set_password("changeme")
            db.add(admin)
        # TODO: 在这里添加更多初始化记录
        db.commit()
    finally:
        db.close()