#!/usr/bin/env python3
"""
线上数据库迁移脚本

从版本 097061bb15b8 升级到 consolidated_001

注意：这个脚本专门用于线上环境的安全迁移！
"""

import os
import sqlite3
import subprocess
import shutil
from datetime import datetime
from pathlib import Path

def backup_database(db_path):
    """备份数据库"""
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return None
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{db_path}.backup_{timestamp}"
    
    try:
        shutil.copy2(db_path, backup_path)
        print(f"✅ 数据库已备份到: {backup_path}")
        return backup_path
    except Exception as e:
        print(f"❌ 备份失败: {e}")
        return None

def check_current_version(db_path):
    """检查当前数据库版本"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT version_num FROM alembic_version")
        version = cursor.fetchone()
        conn.close()
        
        if version:
            return version[0]
        else:
            print("❌ 未找到版本信息")
            return None
    except Exception as e:
        print(f"❌ 检查版本失败: {e}")
        return None

def verify_tables_exist(db_path):
    """验证迁移后的表是否存在"""
    expected_tables = [
        'companies', 'permissions', 'roles', 
        'role_permissions', 'user_roles'
    ]
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        missing_tables = []
        for table in expected_tables:
            if table not in existing_tables:
                missing_tables.append(table)
        
        conn.close()
        
        if missing_tables:
            print(f"❌ 缺少表: {missing_tables}")
            return False
        else:
            print("✅ 所有必需的表都存在")
            return True
            
    except Exception as e:
        print(f"❌ 验证表失败: {e}")
        return False

def verify_columns_exist(db_path):
    """验证新增的列是否存在"""
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 检查 departments 表的 company_id 列
        cursor.execute("PRAGMA table_info(departments)")
        dept_columns = [col[1] for col in cursor.fetchall()]
        
        # 检查 users 表的 company_id 列
        cursor.execute("PRAGMA table_info(users)")
        user_columns = [col[1] for col in cursor.fetchall()]
        
        # 检查 companies 表的新列
        cursor.execute("PRAGMA table_info(companies)")
        company_columns = [col[1] for col in cursor.fetchall()]
        
        conn.close()
        
        issues = []
        
        if 'company_id' not in dept_columns:
            issues.append("departments.company_id 列缺失")
        
        if 'company_id' not in user_columns:
            issues.append("users.company_id 列缺失")
            
        if 'invite_code' not in company_columns:
            issues.append("companies.invite_code 列缺失")
            
        if 'creator_user_id' not in company_columns:
            issues.append("companies.creator_user_id 列缺失")
        
        if issues:
            print(f"❌ 列验证失败: {issues}")
            return False
        else:
            print("✅ 所有必需的列都存在")
            return True
            
    except Exception as e:
        print(f"❌ 验证列失败: {e}")
        return False

def run_migration():
    """执行迁移"""
    try:
        print("🔄 开始执行迁移...")
        result = subprocess.run(
            ["python", "-m", "alembic", "upgrade", "head"],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        if result.returncode == 0:
            print("✅ 迁移执行成功")
            print("输出:", result.stdout)
            return True
        else:
            print("❌ 迁移执行失败")
            print("错误:", result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ 执行迁移失败: {e}")
        return False

def main():
    """主函数"""
    print("=" * 50)
    print("🚀 线上数据库迁移脚本")
    print("从 097061bb15b8 升级到 consolidated_001")
    print("=" * 50)
    print()
    
    # 配置
    db_path = "./db/perf.db"
    
    # 1. 检查数据库文件
    if not os.path.exists(db_path):
        print(f"❌ 数据库文件不存在: {db_path}")
        return
    
    # 2. 检查当前版本
    print("1️⃣ 检查当前数据库版本...")
    current_version = check_current_version(db_path)
    if not current_version:
        return
    
    print(f"   当前版本: {current_version}")
    
    if current_version != "097061bb15b8":
        print(f"⚠️  警告: 当前版本 {current_version} 不是预期的 097061bb15b8")
        confirm = input("是否继续? (y/N): ").lower().strip()
        if confirm != 'y':
            print("❌ 迁移已取消")
            return
    
    # 3. 备份数据库
    print("\n2️⃣ 备份数据库...")
    backup_path = backup_database(db_path)
    if not backup_path:
        print("❌ 备份失败，迁移终止")
        return
    
    # 4. 确认迁移
    print(f"\n3️⃣ 确认迁移操作")
    print("即将执行的操作:")
    print("- 创建 companies, permissions, roles 等表")
    print("- 在 departments 和 users 表中添加 company_id 列")
    print("- 在 companies 表中添加 invite_code 和 creator_user_id 列")
    print()
    
    confirm = input("确认执行迁移? (y/N): ").lower().strip()
    if confirm != 'y':
        print("❌ 迁移已取消")
        return
    
    # 5. 执行迁移
    print(f"\n4️⃣ 执行迁移...")
    if not run_migration():
        print("❌ 迁移失败")
        print(f"💡 可以从备份恢复: cp {backup_path} {db_path}")
        return
    
    # 6. 验证迁移结果
    print(f"\n5️⃣ 验证迁移结果...")
    
    # 检查版本
    new_version = check_current_version(db_path)
    if new_version != "consolidated_001":
        print(f"❌ 版本验证失败: 期望 consolidated_001，实际 {new_version}")
        return
    
    print(f"✅ 版本验证成功: {new_version}")
    
    # 检查表结构
    if not verify_tables_exist(db_path):
        return
    
    if not verify_columns_exist(db_path):
        return
    
    # 7. 完成
    print(f"\n🎉 迁移完成!")
    print("=" * 50)
    print("✅ 数据库已成功升级到 consolidated_001")
    print(f"📁 备份文件: {backup_path}")
    print()
    print("后续步骤:")
    print("1. 测试应用程序功能")
    print("2. 确认一切正常后可删除备份文件")
    print("3. 重启应用程序服务")

if __name__ == "__main__":
    main()
