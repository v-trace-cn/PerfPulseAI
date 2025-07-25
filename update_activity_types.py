#!/usr/bin/env python3
"""
更新活动类型脚本
将有 diff_url 的活动类型从 individual 更新为 pull_request
"""
import sqlite3
import os

def update_activity_types():
    db_path = './backend/db/perf.db'
    
    if not os.path.exists(db_path):
        print(f'数据库文件不存在: {db_path}')
        return
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 查找所有有 diff_url 的活动（这些是PR相关的活动）
        cursor.execute('''
            SELECT id, show_id, title, activity_type 
            FROM activities 
            WHERE diff_url IS NOT NULL AND activity_type = 'individual'
        ''')
        pr_activities = cursor.fetchall()
        
        print(f'找到 {len(pr_activities)} 个需要更新的PR活动')
        
        if len(pr_activities) == 0:
            print('没有需要更新的活动')
            return
        
        # 显示前几个要更新的活动
        print('\n前5个要更新的活动:')
        for i, (id, show_id, title, activity_type) in enumerate(pr_activities[:5], 1):
            print(f'  {i}. ShowID: {show_id[:8]}..., 当前类型: {activity_type}')
            print(f'     标题: {title[:60]}...')
        
        # 询问用户确认
        confirm = input(f'\n是否将这 {len(pr_activities)} 个活动的类型更新为 pull_request? (y/N): ').strip().lower()
        
        if confirm == 'y':
            # 执行更新
            cursor.execute('''
                UPDATE activities 
                SET activity_type = 'pull_request' 
                WHERE diff_url IS NOT NULL AND activity_type = 'individual'
            ''')
            
            updated_count = cursor.rowcount
            conn.commit()
            
            print(f'✅ 成功更新了 {updated_count} 个活动的类型为 pull_request')
            
            # 验证更新结果
            cursor.execute('SELECT activity_type, COUNT(*) FROM activities GROUP BY activity_type')
            types = cursor.fetchall()
            print('\n更新后的活动类型统计:')
            for type_name, type_count in types:
                print(f'  {type_name}: {type_count}条')
        else:
            print('取消更新')
    
    except Exception as e:
        print(f'更新失败: {str(e)}')
        conn.rollback()
    
    finally:
        conn.close()

if __name__ == '__main__':
    update_activity_types()
