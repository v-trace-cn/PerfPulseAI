from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
# … 导入其它模型

async def seed_data():
    async with AsyncSessionLocal() as db:
        try:
            # 示例：初始化一个管理员账户
            result = await db.execute(select(User).filter_by(email="admin@example.com"))
            if not result.scalars().first():
                admin = User(email="admin@example.com", name="Administrator")
                admin.set_password("changeme")
                db.add(admin)
            # TODO: 在这里添加更多初始化记录
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"Error seeding data: {e}")