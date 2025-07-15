import sqlite3
import os

# 连接到数据库
db_path = os.path.join(os.path.dirname(__file__), 'db', 'perf.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 获取所有表名
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("数据库中的表:")
for table in tables:
    print(f"- {table[0]}")

# 检查是否存在我们的新表
new_tables = ['companies', 'permissions', 'roles', 'role_permissions', 'user_roles']
for table_name in new_tables:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?;", (table_name,))
    result = cursor.fetchone()
    if result:
        print(f"✓ 表 {table_name} 已存在")
        # 获取表结构
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()
        print(f"  列: {[col[1] for col in columns]}")
    else:
        print(f"✗ 表 {table_name} 不存在")

# 检查 users 和 departments 表是否有新列
for table_name in ['users', 'departments']:
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns = cursor.fetchall()
    column_names = [col[1] for col in columns]
    print(f"\n表 {table_name} 的列: {column_names}")
    if 'company_id' in column_names:
        print(f"✓ {table_name} 表已有 company_id 列")
    else:
        print(f"✗ {table_name} 表缺少 company_id 列")

conn.close()
