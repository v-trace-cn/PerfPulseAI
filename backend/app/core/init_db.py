
from .database import Base, async_engine
from .seed_data import seed_data


async def init_db():
    # 创建所有表
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # 写入初始数据
    await seed_data()

if __name__ == "__main__":
    import asyncio
    asyncio.run(init_db())
