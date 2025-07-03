from sqlalchemy.orm import Session
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.department import Department # 导入 Department 模型
from app.core.logging_config import logger
# … 导入其它模型

async def seed_data():
    async with AsyncSessionLocal() as db:
        try:
            # 示例：初始化一个管理员账户
            result = await db.execute(select(User).filter_by(email="admin@example.com"))
            if not result.scalars().first():
                admin = User(email="admin@example.com", name="Administrator", position="Admin")
                admin.set_password("changeme")
                db.add(admin)
            
            # 创建或获取研发部
            dev_dept = await db.execute(select(Department).filter_by(name="研发部"))
            dev_dept = dev_dept.scalars().first()
            if not dev_dept:
                dev_dept = Department(name="研发部")
                db.add(dev_dept)
                await db.flush() # 刷新以获取ID

            # 创建示例用户并分配到研发部
            user1 = await db.execute(select(User).filter_by(email="zhangsan@example.com"))
            if not user1.scalars().first():
                zhangsan = User(
                    email="zhangsan@example.com", 
                    name="张三", 
                    position="高级前端工程师", 
                    department_id=dev_dept.id,
                    points=95,
                    completed_tasks=50,
                    pending_tasks=10,
                    avatar_url="/placeholder-user.jpg",
                )
                zhangsan.set_password("password")
                db.add(zhangsan)

            user2 = await db.execute(select(User).filter_by(email="lisi@example.com"))
            if not user2.scalars().first():
                lisi = User(
                    email="lisi@example.com", 
                    name="李四", 
                    position="后端工程师", 
                    department_id=dev_dept.id,
                    points=88,
                    completed_tasks=40,
                    pending_tasks=5,
                    avatar_url="/placeholder-user.jpg",
                )
                lisi.set_password("password")
                db.add(lisi)

            await db.commit()
            logger.info("Database seeded successfully with initial data!")
        except Exception as e:
            await db.rollback()
            logger.error(f"Error seeding data: {e}")