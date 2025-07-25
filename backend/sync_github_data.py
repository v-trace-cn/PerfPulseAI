#!/usr/bin/env python3
"""
GitHub数据同步脚本
根据指定的GitHub仓库地址，匹配系统中注册用户的GitHub地址，
同步PR数据和积分信息
"""
import asyncio
import os
import sys
import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Optional, Any
import uuid

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, and_, or_
from app.models.user import User
from app.models.activity import Activity
from app.models.scoring import PointTransaction, TransactionType
from app.services.point_service import PointService

# 数据库配置
DATABASE_URL = "sqlite+aiosqlite:///./db/perf.db"

class GitHubDataSyncer:
    """GitHub数据同步器"""
    
    def __init__(self, db_session: AsyncSession):
        self.db = db_session
        self.point_service = PointService(db_session)
        
    async def get_registered_users(self) -> List[User]:
        """获取所有注册用户"""
        result = await self.db.execute(
            select(User).filter(User.github_url.isnot(None))
        )
        return result.scalars().all()
    
    def extract_github_username(self, github_url: str) -> Optional[str]:
        """从GitHub URL中提取用户名"""
        if not github_url:
            return None
            
        # 支持多种GitHub URL格式
        patterns = [
            r'github\.com/([^/]+)/?$',  # https://github.com/username
            r'github\.com/([^/]+)/.*',  # https://github.com/username/repo
            r'^([^/]+)$'  # 直接用户名
        ]
        
        for pattern in patterns:
            match = re.search(pattern, github_url.strip('/'))
            if match:
                return match.group(1)
        
        return None
    
    async def fetch_repo_prs(self, repo_url: str, github_token: Optional[str] = None) -> List[Dict[str, Any]]:
        """获取仓库的PR数据"""
        print(f"🔍 正在获取仓库 {repo_url} 的PR数据...")

        # 从仓库URL中提取owner和repo名称
        match = re.search(r'github\.com/([^/]+)/([^/]+)', repo_url)
        if not match:
            raise ValueError(f"无效的GitHub仓库URL: {repo_url}")

        owner, repo = match.groups()
        repo = repo.replace('.git', '')  # 移除.git后缀

        if github_token:
            try:
                import aiohttp

                headers = {
                    'Authorization': f'token {github_token}',
                    'Accept': 'application/vnd.github.v3+json'
                }

                # 获取PR列表
                url = f'https://api.github.com/repos/{owner}/{repo}/pulls'
                params = {
                    'state': 'all',  # 获取所有状态的PR
                    'per_page': 100,  # 每页100个
                    'sort': 'updated',
                    'direction': 'desc'
                }

                async with aiohttp.ClientSession() as session:
                    async with session.get(url, headers=headers, params=params) as response:
                        if response.status == 200:
                            prs = await response.json()

                            # 为每个PR获取详细信息（包括代码变更统计）
                            detailed_prs = []
                            for pr in prs:
                                detail_url = f'https://api.github.com/repos/{owner}/{repo}/pulls/{pr["number"]}'
                                async with session.get(detail_url, headers=headers) as detail_response:
                                    if detail_response.status == 200:
                                        detail_data = await detail_response.json()
                                        detailed_prs.append(detail_data)
                                    else:
                                        # 如果获取详情失败，使用基本信息
                                        detailed_prs.append(pr)

                            print(f"✅ 成功获取 {len(detailed_prs)} 个PR")
                            return detailed_prs
                        else:
                            print(f"❌ GitHub API请求失败: {response.status}")
                            return []

            except ImportError:
                print("❌ 需要安装 aiohttp: pip install aiohttp")
                return []
            except Exception as e:
                print(f"❌ 获取PR数据失败: {e}")
                return []
        else:
            # 没有token时返回模拟数据
            print(f"⚠️  注意: 未提供GitHub API token，返回模拟数据用于测试")

            # 模拟PR数据
            mock_prs = [
                {
                    "id": "PR_kwDOORYjAs6bES-k",
                    "number": 13,
                    "title": "test github pr",
                    "user": {"login": "test-user"},
                    "created_at": "2025-06-18T12:30:25Z",
                    "merged_at": "2025-06-18T12:35:00Z",
                    "state": "closed",
                    "merged": True,
                    "additions": 50,
                    "deletions": 20,
                    "changed_files": 3
                }
            ]

            return mock_prs
    
    async def match_pr_to_user(self, pr_data: Dict[str, Any], users: List[User]) -> Optional[User]:
        """将PR匹配到系统用户"""
        pr_username = pr_data.get("user", {}).get("login", "").lower()
        
        for user in users:
            user_github_username = self.extract_github_username(user.github_url)
            if user_github_username and user_github_username.lower() == pr_username:
                return user
        
        return None
    
    async def calculate_pr_points(self, pr_data: Dict[str, Any]) -> float:
        """计算PR积分（返回前端展示格式）"""
        # 简单的积分计算逻辑
        base_points = 5.0

        # 根据代码变更量调整积分
        additions = pr_data.get("additions", 0)
        deletions = pr_data.get("deletions", 0)
        changed_files = pr_data.get("changed_files", 0)

        # 积分计算公式
        points = base_points
        points += min(additions // 10, 5)  # 每10行新增代码+1分，最多+5分
        points += min(deletions // 20, 3)  # 每20行删除代码+1分，最多+3分
        points += min(changed_files, 3)    # 每个修改文件+1分，最多+3分

        # 返回前端展示格式的积分（支持小数）
        return min(points, 15.0)  # 单个PR最多15分
    
    async def sync_pr_data(self, repo_url: str, github_token: Optional[str] = None, dry_run: bool = True) -> Dict[str, Any]:
        """同步PR数据"""
        print(f"🚀 开始同步GitHub仓库数据: {repo_url}")
        print(f"📋 模式: {'预览模式' if dry_run else '执行模式'}")
        
        # 获取注册用户
        users = await self.get_registered_users()
        print(f"👥 找到 {len(users)} 个有GitHub地址的用户")
        
        # 获取PR数据
        prs = await self.fetch_repo_prs(repo_url, github_token)
        print(f"📊 找到 {len(prs)} 个PR")
        
        # 统计信息
        stats = {
            "total_prs": len(prs),
            "matched_prs": 0,
            "new_activities": 0,
            "updated_activities": 0,
            "total_points_awarded": 0,
            "user_stats": {}
        }
        
        for pr in prs:
            # 匹配用户
            user = await self.match_pr_to_user(pr, users)
            if not user:
                print(f"⚠️  PR #{pr['number']} 无法匹配到系统用户 (GitHub用户: {pr.get('user', {}).get('login', 'unknown')})")
                continue
            
            stats["matched_prs"] += 1
            
            # 检查是否已存在该活动
            existing_activity = await self.db.execute(
                select(Activity).filter(Activity.show_id == pr["id"])
            )
            existing = existing_activity.scalars().first()
            
            # 计算积分
            points = await self.calculate_pr_points(pr)
            
            if existing:
                # 更新现有活动
                if not dry_run:
                    existing.title = pr["title"]
                    existing.points = points
                    existing.updated_at = datetime.now(timezone.utc)
                
                stats["updated_activities"] += 1
                print(f"🔄 更新活动: PR #{pr['number']} - {pr['title']} ({user.name}, {points}分)")
            else:
                # 创建新活动
                if not dry_run:
                    new_activity = Activity(
                        id=str(uuid.uuid4()),
                        show_id=pr["id"],
                        title=f"{repo_url.split('/')[-1]}-#{pr['number']}-{pr['title']}",
                        description=f"PR: {pr['title']}",
                        points=points,
                        user_id=user.id,
                        status="completed",
                        activity_type="pull_request",
                        created_at=datetime.fromisoformat(pr["created_at"].replace('Z', '+00:00')),
                        completed_at=datetime.fromisoformat(pr["merged_at"].replace('Z', '+00:00')) if pr.get("merged_at") else None
                    )
                    self.db.add(new_activity)
                
                stats["new_activities"] += 1
                print(f"✅ 新建活动: PR #{pr['number']} - {pr['title']} ({user.name}, {points}分)")
            
            # 统计用户积分
            if user.name not in stats["user_stats"]:
                stats["user_stats"][user.name] = {"prs": 0, "points": 0}
            
            stats["user_stats"][user.name]["prs"] += 1
            stats["user_stats"][user.name]["points"] += points
            stats["total_points_awarded"] += points
        
        if not dry_run:
            await self.db.commit()
            print("💾 数据已保存到数据库")
        else:
            print("👀 预览模式，未保存到数据库")
        
        return stats

    async def regenerate_point_transactions(self):
        """重新生成积分交易记录"""
        print("🔄 开始重新生成积分交易记录...")

        # 导入积分转换器
        from app.services.point_service import PointConverter

        # 1. 清除现有积分交易记录
        from sqlalchemy import delete
        await self.db.execute(delete(PointTransaction))
        print("🗑️  已清除现有积分交易记录")

        # 2. 获取所有有积分的活动
        activities_result = await self.db.execute(
            select(Activity)
            .filter(Activity.points.isnot(None))
            .filter(Activity.points > 0)
            .order_by(Activity.created_at)
        )
        activities = activities_result.scalars().all()

        # 3. 为每个活动创建积分交易记录
        user_balances = {}  # 跟踪每个用户的余额（后端存储格式）
        created_count = 0

        for activity in activities:
            if not activity.user_id or not activity.points:
                continue

            # 将活动积分转换为后端存储格式
            # 假设activity.points存储的是前端展示格式
            points_storage = PointConverter.to_storage(activity.points)

            # 计算用户当前余额（后端存储格式）
            if activity.user_id not in user_balances:
                user_balances[activity.user_id] = 0

            user_balances[activity.user_id] += points_storage

            # 创建积分交易记录（使用后端存储格式）
            transaction = PointTransaction(
                id=str(uuid.uuid4()),
                user_id=activity.user_id,
                transaction_type=TransactionType.EARN,
                amount=points_storage,
                balance_after=user_balances[activity.user_id],
                reference_id=activity.id,
                reference_type="ACTIVITY",
                description=f"完成活动: {activity.title}",
                created_at=activity.created_at or datetime.now(timezone.utc)
            )

            self.db.add(transaction)
            created_count += 1

        # 4. 更新用户表中的积分余额（使用后端存储格式）
        for user_id, balance_storage in user_balances.items():
            user_result = await self.db.execute(
                select(User).filter(User.id == user_id)
            )
            user = user_result.scalars().first()
            if user:
                user.points = balance_storage

        await self.db.commit()
        print(f"✅ 重新生成了 {created_count} 条积分交易记录")
        print(f"👥 更新了 {len(user_balances)} 个用户的积分余额")

        # 打印转换信息
        total_display = sum(PointConverter.to_display(balance) for balance in user_balances.values())
        total_storage = sum(user_balances.values())
        print(f"📊 积分统计 - 展示格式总计: {total_display}, 存储格式总计: {total_storage}")

async def main():
    """主函数"""
    print("🔧 GitHub数据同步工具")
    print("=" * 50)

    # 获取仓库URL
    repo_url = input("请输入GitHub仓库URL: ").strip()
    if not repo_url:
        print("❌ 仓库URL不能为空")
        return

    # 获取GitHub token（可选）
    github_token = input("请输入GitHub Personal Access Token (可选，按回车跳过): ").strip()
    if not github_token:
        github_token = None
        print("⚠️  未提供GitHub token，将使用模拟数据")

    # 选择模式
    mode = input("选择模式 (1: 预览模式, 2: 执行模式) [1]: ").strip() or "1"
    dry_run = mode == "1"
    
    # 创建数据库连接
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            syncer = GitHubDataSyncer(session)
            stats = await syncer.sync_pr_data(repo_url, github_token, dry_run=dry_run)

            # 如果不是预览模式，询问是否重新生成积分交易记录
            if not dry_run and stats['new_activities'] > 0:
                regenerate = input("\n是否重新生成积分交易记录？(y/N): ").strip().lower()
                if regenerate == 'y':
                    await syncer.regenerate_point_transactions()
                    print("✅ 积分交易记录已重新生成")
            
            # 显示统计信息
            print("\n📈 同步统计:")
            print(f"  总PR数量: {stats['total_prs']}")
            print(f"  匹配PR数量: {stats['matched_prs']}")
            print(f"  新建活动: {stats['new_activities']}")
            print(f"  更新活动: {stats['updated_activities']}")
            print(f"  总积分: {stats['total_points_awarded']}")
            
            if stats['user_stats']:
                print("\n👥 用户统计:")
                for user_name, user_stat in stats['user_stats'].items():
                    print(f"  - {user_name}: {user_stat['prs']} PR, {user_stat['points']} 积分")
            
        except Exception as e:
            print(f"❌ 同步失败: {e}")
            import traceback
            traceback.print_exc()
        finally:
            await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
