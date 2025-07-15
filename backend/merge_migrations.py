#!/usr/bin/env python3
"""
简化的迁移合并脚本

专门用于合并本次开发产生的5个迁移文件。
"""

import os
import sqlite3
import shutil
from datetime import datetime

def main():
    print("=== 迁移文件合并工具 ===")
    print()
    
    # 检查文件是否存在
    migrations_to_remove = [
        "52677f20be87_add_multi_tenant_permission_models.py",
        "5b3f8fcdfbab_add_missing_company_id_columns.py", 
        "dcedb6771a41_add_organization_models_and_invite_code.py",
        "2db79a9ef83a_add_invite_code_to_companies.py",
        "add_creator_user_id_to_companies.py"
    ]
    
    versions_dir = "./alembic/versions"
    existing_files = []
    
    for migration_file in migrations_to_remove:
        file_path = os.path.join(versions_dir, migration_file)
        if os.path.exists(file_path):
            existing_files.append(migration_file)
    
    print(f"找到 {len(existing_files)} 个需要合并的迁移文件:")
    for f in existing_files:
        print(f"  - {f}")
    
    if not existing_files:
        print("没有找到需要合并的迁移文件。")
        return
    
    print()
    print("合并操作将:")
    print("1. 备份当前数据库")
    print("2. 删除上述迁移文件")
    print("3. 更新数据库版本为 'consolidated_001'")
    print("4. 使用新的合并迁移文件")
    print()
    
    # 确认操作
    confirm = input("确认执行合并操作? (y/N): ").strip().lower()
    if confirm != 'y':
        print("操作已取消。")
        return
    
    # 1. 备份数据库
    print("\n1. 备份数据库...")
    db_path = "./db/perf.db"
    if os.path.exists(db_path):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"./db/perf_backup_{timestamp}.db"
        shutil.copy2(db_path, backup_path)
        print(f"   数据库已备份到: {backup_path}")
    else:
        print("   数据库文件不存在，跳过备份。")
    
    # 2. 删除旧迁移文件
    print("\n2. 删除旧迁移文件...")
    for migration_file in existing_files:
        file_path = os.path.join(versions_dir, migration_file)
        try:
            os.remove(file_path)
            print(f"   已删除: {migration_file}")
        except Exception as e:
            print(f"   删除失败 {migration_file}: {e}")
    
    # 3. 更新数据库版本
    print("\n3. 更新数据库版本...")
    if os.path.exists(db_path):
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # 检查当前版本
            cursor.execute("SELECT version_num FROM alembic_version")
            current_version = cursor.fetchone()
            
            if current_version:
                old_version = current_version[0]
                print(f"   当前版本: {old_version}")
                
                # 更新为合并版本
                cursor.execute("UPDATE alembic_version SET version_num = ?", ("consolidated_001",))
                conn.commit()
                print(f"   已更新为: consolidated_001")
            else:
                print("   未找到版本记录，插入新版本...")
                cursor.execute("INSERT INTO alembic_version (version_num) VALUES (?)", ("consolidated_001",))
                conn.commit()
            
            conn.close()
            
        except Exception as e:
            print(f"   更新数据库版本失败: {e}")
            return
    else:
        print("   数据库文件不存在，跳过版本更新。")
    
    # 4. 验证结果
    print("\n4. 验证结果...")
    try:
        import subprocess
        result = subprocess.run(
            ["python", "-m", "alembic", "current"],
            capture_output=True,
            text=True,
            cwd="."
        )
        print(f"   当前迁移版本: {result.stdout.strip()}")
    except Exception as e:
        print(f"   验证失败: {e}")
    
    print("\n=== 合并完成 ===")
    print("✅ 迁移文件已成功合并")
    print("✅ 数据库版本已更新")
    print()
    print("后续步骤:")
    print("1. 测试应用程序功能")
    print("2. 确认一切正常后可删除备份文件")
    print("3. 提交代码变更")

if __name__ == "__main__":
    main()
