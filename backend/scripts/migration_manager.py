#!/usr/bin/env python3
"""
数据库迁移管理器
基于编码共识：Jobs式产品直觉 + Rams式功能纯粹主义

提供完整的迁移管理功能：
- 清理混乱的迁移文件
- 标准化迁移流程
- 自动化常见操作
- 确保数据安全
"""
import os
import sys
import subprocess
import shutil
from datetime import datetime
from pathlib import Path
import logging

# 添加项目根目录到Python路径
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MigrationManager:
    """迁移管理器"""
    
    def __init__(self):
        self.backend_dir = backend_dir
        self.versions_dir = self.backend_dir / 'alembic' / 'versions'
        self.backup_dir = self.backend_dir / 'alembic' / 'versions_backup'
        
    def run_alembic_command(self, command):
        """运行Alembic命令"""
        try:
            logger.info(f"🔧 执行: alembic {command}")

            result = subprocess.run(
                f"python -m alembic {command}",
                shell=True,
                capture_output=True,
                text=True,
                check=True,
                cwd=self.backend_dir  # 直接指定工作目录
            )

            if result.stdout:
                logger.info(f"输出: {result.stdout.strip()}")

            return True, result.stdout

        except subprocess.CalledProcessError as e:
            logger.error(f"❌ 命令失败: {e}")
            if e.stdout:
                logger.error(f"标准输出: {e.stdout}")
            if e.stderr:
                logger.error(f"错误输出: {e.stderr}")
            return False, e.stderr
    
    def backup_current_migrations(self):
        """备份当前迁移文件"""
        logger.info("📦 备份当前迁移文件...")
        
        # 创建备份目录
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = self.backup_dir / f"backup_{timestamp}"
        backup_path.mkdir(parents=True, exist_ok=True)
        
        # 复制所有迁移文件
        migration_files = list(self.versions_dir.glob("*.py"))
        for file in migration_files:
            if file.name != "__init__.py":
                shutil.copy2(file, backup_path)
        
        logger.info(f"✅ 已备份 {len(migration_files)} 个文件到: {backup_path}")
        return backup_path
    
    def clean_migration_files(self, keep_recent=10):
        """智能清理迁移文件，保留最近的N个"""
        logger.info(f"🧹 智能清理迁移文件，保留最近的 {keep_recent} 个...")

        # 备份现有文件
        backup_path = self.backup_current_migrations()

        # 获取所有迁移文件（排除__init__.py）
        migration_files = [f for f in self.versions_dir.glob("*.py") if f.name != "__init__.py"]

        if len(migration_files) <= keep_recent:
            logger.info(f"📊 当前只有 {len(migration_files)} 个迁移文件，无需清理")
            return backup_path

        # 按修改时间排序，最新的在前
        migration_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # 保留最近的文件
        files_to_keep = migration_files[:keep_recent]
        files_to_delete = migration_files[keep_recent:]

        logger.info(f"📋 保留最近的 {len(files_to_keep)} 个文件:")
        for file in files_to_keep:
            logger.info(f"  ✅ 保留: {file.name}")

        logger.info(f"删除 {len(files_to_delete)} 个旧文件:")
        for file in files_to_delete:
            file.unlink()
            logger.info(f"删除: {file.name}")

        # 关键修复：将保留的最旧文件的down_revision设置为None
        if files_to_keep:
            oldest_kept_file = files_to_keep[-1]  # 最旧的保留文件
            self._fix_oldest_migration_down_revision(oldest_kept_file)

        logger.info("✅ 智能清理完成")
        return backup_path

    def _fix_oldest_migration_down_revision(self, migration_file):
        """修复最旧迁移文件的down_revision为None"""
        try:
            logger.info(f"🔧 修复最旧迁移文件: {migration_file.name}")

            # 读取文件内容
            with open(migration_file, 'r', encoding='utf-8') as f:
                content = f.read()

            # 查找并替换down_revision
            import re

            # 匹配各种可能的down_revision格式
            patterns = [
                r"down_revision\s*:\s*Union\[str,\s*None\]\s*=\s*['\"][^'\"]+['\"]",
                r"down_revision\s*=\s*['\"][^'\"]+['\"]",
                r"down_revision\s*:\s*str\s*=\s*['\"][^'\"]+['\"]"
            ]

            modified = False
            for pattern in patterns:
                if re.search(pattern, content):
                    # 替换为None
                    if "Union[str, None]" in content:
                        content = re.sub(pattern, "down_revision: Union[str, None] = None", content)
                    else:
                        content = re.sub(pattern, "down_revision = None", content)
                    modified = True
                    break

            if modified:
                # 写回文件
                with open(migration_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                logger.info(f"✅ 已将 {migration_file.name} 的 down_revision 设置为 None")
            else:
                logger.warning(f"⚠️ 未找到 down_revision 模式在文件 {migration_file.name}")

        except Exception as e:
            logger.error(f"❌ 修复迁移文件失败: {e}")
    
    def get_current_database_schema(self):
        """获取当前数据库模式"""
        logger.info("📋 分析当前数据库模式...")
        
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text
            import asyncio
            
            async def get_tables():
                async with AsyncSessionLocal() as db:
                    # 获取所有表名
                    result = await db.execute(text("""
                        SELECT name FROM sqlite_master 
                        WHERE type='table' AND name NOT LIKE 'sqlite_%'
                        ORDER BY name
                    """))
                    tables = [row[0] for row in result.fetchall()]
                    
                    # 获取每个表的结构
                    table_info = {}
                    for table in tables:
                        result = await db.execute(text(f"PRAGMA table_info({table})"))
                        columns = result.fetchall()
                        table_info[table] = columns
                    
                    return table_info
            
            return asyncio.run(get_tables())
            
        except Exception as e:
            logger.error(f"❌ 获取数据库模式失败: {e}")
            return {}
    
    def create_consolidated_migration(self):
        """创建合并的迁移文件"""
        logger.info("🔄 创建合并迁移文件...")
        
        # 获取当前数据库模式
        current_schema = self.get_current_database_schema()
        
        if not current_schema:
            logger.error("❌ 无法获取当前数据库模式")
            return False
        
        # 生成时间戳
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        
        # 创建合并迁移文件
        migration_content = self._generate_consolidated_migration_content(current_schema, timestamp)
        
        migration_file = self.versions_dir / f"{timestamp}_consolidated_schema.py"
        with open(migration_file, 'w', encoding='utf-8') as f:
            f.write(migration_content)
        
        logger.info(f"✅ 创建合并迁移文件: {migration_file.name}")
        return True
    
    def _generate_consolidated_migration_content(self, schema, timestamp):
        """生成合并迁移文件内容"""
        tables_info = []
        for table_name, columns in schema.items():
            if table_name == 'alembic_version':
                continue
            
            columns_info = []
            for col in columns:
                col_name = col[1]
                col_type = col[2]
                not_null = col[3]
                default_val = col[4]
                is_pk = col[5]
                
                columns_info.append({
                    'name': col_name,
                    'type': col_type,
                    'nullable': not not_null,
                    'default': default_val,
                    'primary_key': bool(is_pk)
                })
            
            tables_info.append({
                'name': table_name,
                'columns': columns_info
            })
        
        return f'''"""
Consolidated schema migration
基于编码共识的统一数据库模式

Revision ID: {timestamp}_consolidated
Revises: 
Create Date: {datetime.now().isoformat()}
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '{timestamp}_consolidated'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    """创建完整的数据库模式"""
    print("🏗️ 创建统一数据库模式...")
    
    # 这里会根据当前模型自动生成表结构
    # 建议使用 alembic revision --autogenerate 来生成具体内容
    pass


def downgrade():
    """删除所有表"""
    print("🗑️ 删除所有表...")
    
    # 删除所有表（按依赖关系逆序）
    {self._generate_drop_tables_code(tables_info)}
'''
    
    def _generate_drop_tables_code(self, tables_info):
        """生成删除表的代码"""
        drop_statements = []
        for table in reversed(tables_info):
            drop_statements.append(f"    op.drop_table('{table['name']}')")
        
        return "\n".join(drop_statements)
    
    def reset_alembic_version(self):
        """重置Alembic版本表"""
        logger.info("🔄 重置Alembic版本...")
        
        try:
            from app.core.database import AsyncSessionLocal
            from sqlalchemy import text
            import asyncio
            
            async def reset_version():
                async with AsyncSessionLocal() as db:
                    # 清空版本表
                    await db.execute(text("DELETE FROM alembic_version"))
                    await db.commit()
                    logger.info("✅ Alembic版本表已清空")
            
            asyncio.run(reset_version())
            return True
            
        except Exception as e:
            logger.error(f"❌ 重置版本表失败: {e}")
            return False
    
    def standard_workflow_create_migration(self, message):
        """标准工作流：创建新迁移"""
        logger.info(f"📝 创建新迁移: {message}")
        
        # 生成时间戳
        timestamp = datetime.now().strftime("%Y%m%d_%H%M")
        
        # 创建迁移
        success, output = self.run_alembic_command(
            f'revision --autogenerate -m "{timestamp}_{message}"'
        )
        
        if success:
            logger.info("✅ 迁移文件创建成功")
            return True
        else:
            logger.error("❌ 迁移文件创建失败")
            return False
    
    def standard_workflow_apply_migrations(self):
        """标准工作流：应用迁移"""
        logger.info("⬆️ 应用迁移...")
        
        success, output = self.run_alembic_command("upgrade head")
        
        if success:
            logger.info("✅ 迁移应用成功")
            return True
        else:
            logger.error("❌ 迁移应用失败")
            return False
    
    def show_status(self):
        """显示当前状态"""
        logger.info("📊 当前迁移状态:")
        
        # 当前版本
        success, current = self.run_alembic_command("current")
        if success:
            logger.info(f"  当前版本: {current.strip()}")
        
        # 所有heads
        success, heads = self.run_alembic_command("heads")
        if success:
            logger.info(f"  Head版本: {heads.strip()}")
        
        # 迁移文件数量
        migration_files = list(self.versions_dir.glob("*.py"))
        migration_count = len([f for f in migration_files if f.name != "__init__.py"])
        logger.info(f"  迁移文件数: {migration_count}")


def print_usage():
    """打印使用说明"""
    print("""
🔧 数据库迁移管理器

基于编码共识的完美迁移管理工具

使用方法:
    python migration_manager.py status          # 查看当前状态
    python migration_manager.py clean [N]       # 智能清理，保留最近N个文件（默认10个）
    python migration_manager.py reset           # 完全重置
    python migration_manager.py create <msg>    # 创建新迁移
    python migration_manager.py apply           # 应用迁移
    python migration_manager.py backup          # 备份迁移文件

示例:
    # 查看状态
    python migration_manager.py status

    # 智能清理，保留最近10个文件
    python migration_manager.py clean

    # 智能清理，保留最近5个文件
    python migration_manager.py clean 5

    # 创建新迁移
    python migration_manager.py create "add_user_avatar"

    # 应用迁移
    python migration_manager.py apply

    # 完全重置（危险操作）
    python migration_manager.py reset
""")


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    
    command = sys.argv[1].lower()
    manager = MigrationManager()
    
    try:
        if command == "status":
            manager.show_status()
        elif command == "clean":
            # 支持指定保留数量
            keep_count = 10  # 默认保留10个
            if len(sys.argv) > 2:
                try:
                    keep_count = int(sys.argv[2])
                except ValueError:
                    print("❌ 保留数量必须是数字")
                    sys.exit(1)
            manager.clean_migration_files(keep_recent=keep_count)
        elif command == "reset":
            print("⚠️ 这将完全重置迁移系统！")
            confirm = input("确认继续？(yes/no): ")
            if confirm.lower() == 'yes':
                manager.backup_current_migrations()
                manager.clean_migration_files()
                manager.reset_alembic_version()
                print("✅ 迁移系统已重置")
            else:
                print("❌ 操作已取消")
        elif command == "create":
            if len(sys.argv) < 3:
                print("❌ 请提供迁移描述")
                sys.exit(1)
            message = sys.argv[2]
            manager.standard_workflow_create_migration(message)
        elif command == "apply":
            manager.standard_workflow_apply_migrations()
        elif command == "backup":
            manager.backup_current_migrations()
        else:
            print(f"❌ 未知命令: {command}")
            print_usage()
            sys.exit(1)
            
    except KeyboardInterrupt:
        logger.info("⏹️ 用户中断操作")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ 未预期的错误: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
