#!/usr/bin/env python3
"""
迁移现有真实PR数据到新的三表结构
"""
import asyncio
import sys
import logging
from datetime import datetime
from sqlalchemy import text, select
from pathlib import Path

curr_dir = Path(__file__).resolve().parent
sys.path.append(str(curr_dir.parent))
# 添加项目根目录到Python路径
sys.path.insert(0, '.')

from app.core.database import AsyncSessionLocal
from app.models.pr_metadata import PrMetadata, PrMetrics, PrStatus
from app.models.pr_lifecycle_event import PrLifecycleEvent, PrEventType
from app.models.user_identity import UserIdentity, IdentityPlatform, IdentityStatus

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class RealPrDataMigrator:
    """真实PR数据迁移器"""

    def __init__(self):
        self.stats = {
            'processed': 0,
            'pr_metadata_created': 0,
            'lifecycle_events_created': 0,
            'pr_metrics_created': 0,
            'identities_created': 0,
            'errors': []
        }

    async def migrate_real_data(self, limit: int = 10):
        """迁移真实数据"""
        logger.info(f"🚀 开始迁移现有真实PR数据 (限制: {limit}条)")
        
        async with AsyncSessionLocal() as db:
            try:
                # 1. 获取现有activities表中的PR数据
                query = f"""
                    SELECT * FROM activities
                    WHERE id LIKE 'PR_%'
                    ORDER BY created_at DESC
                    LIMIT {limit}
                """
                result = await db.execute(text(query))
                activities = result.fetchall()
                
                logger.info(f"📊 找到 {len(activities)} 条PR活动记录")
                
                if not activities:
                    logger.warning("没有找到PR相关的活动记录")
                    return
                
                # 2. 获取对应的pull_requests数据
                pr_node_ids = [activity.id for activity in activities]
                pull_requests = {}
                if pr_node_ids:
                    pr_node_ids_str = "', '".join(pr_node_ids)
                    pr_query = f"""
                        SELECT * FROM pull_requests
                        WHERE pr_node_id IN ('{pr_node_ids_str}')
                    """
                    result = await db.execute(text(pr_query))
                    pull_requests = {pr.pr_node_id: pr for pr in result.fetchall()}

                    logger.info(f"📊 找到 {len(pull_requests)} 条PR记录")
                
                # 3. 获取PR结果数据
                pr_results = {}
                if pr_node_ids:
                    try:
                        results_query = f"""
                            SELECT * FROM pull_request_results
                            WHERE pr_node_id IN ('{pr_node_ids_str}')
                        """
                        result = await db.execute(text(results_query))
                        pr_results = {result.pr_node_id: result for result in result.fetchall()}

                        logger.info(f"📊 找到 {len(pr_results)} 条PR结果记录")
                    except Exception as e:
                        logger.warning(f"获取PR结果数据失败: {e}")
                
                # 4. 迁移每个PR
                for activity in activities:
                    await self._migrate_single_pr(
                        db, 
                        activity, 
                        pull_requests.get(activity.id),
                        pr_results.get(activity.id)
                    )
                    self.stats['processed'] += 1
                
                await db.commit()
                logger.info("✅ 真实数据迁移完成")
                self._print_stats()
                
            except Exception as e:
                await db.rollback()
                logger.error(f"❌ 迁移失败: {e}")
                self.stats['errors'].append(str(e))
                raise

    async def _migrate_single_pr(self, db, activity, pull_request, pr_result):
        """迁移单个PR"""
        try:
            pr_node_id = activity.id
            logger.info(f"🔄 迁移PR: {pr_node_id}")
            
            # 1. 创建用户身份（如果需要）
            author_identity = None
            if pull_request:
                author_identity = await self._create_or_get_user_identity(db, activity.user_id)
            
                # 2. 创建PR元数据
                pr_metadata = PrMetadata(
                    pr_node_id=pr_node_id,
                    pr_number=pull_request.pr_number,
                    repository=pull_request.repository,
                    title=activity.title,
                    description=activity.description or "",
                    author_identity_id=author_identity.id,
                    author_platform_username=author_identity.platform_username,
                    head_commit_sha=pull_request.commit_sha,
                    base_commit_sha="unknown",
                    commit_message=pull_request.commit_message,
                    files_changed=0,
                    additions=0,
                    deletions=0,
                    github_url=f"https://github.com/{pull_request.repository}/pull/{pull_request.pr_number}" if pull_request else "",
                    diff_url=activity.diff_url or "",
                    patch_url="",
                    github_created_at=self._parse_datetime(activity.created_at),
                    github_updated_at=self._parse_datetime(activity.updated_at),
                    created_at=datetime.utcnow().replace(microsecond=0)
                )
                db.add(pr_metadata)
                self.stats['pr_metadata_created'] += 1
            
            # 3. 创建生命周期事件
            event_time = self._parse_datetime(activity.created_at)
            lifecycle_event = PrLifecycleEvent(
                pr_node_id=pr_node_id,
                event_type=PrEventType.CREATED.value,
                event_time=event_time,
                event_source=IdentityPlatform.GITHUB.value,
                event_data={
                    "original_status": activity.status,
                    "activity_type": activity.activity_type
                },
                created_at=event_time
            )
            
            db.add(lifecycle_event)
            self.stats['lifecycle_events_created'] += 1
            
            # 如果有完成时间，添加完成事件
            if activity.completed_at:
                completed_event = PrLifecycleEvent(
                    pr_node_id=pr_node_id,
                    event_type=PrEventType.MERGED.value,
                    event_data={"source": "migration"},
                    created_at=self._parse_datetime(activity.completed_at)
                )
                db.add(completed_event)
                self.stats['lifecycle_events_created'] += 1
            
            # 4. 创建PR指标
            # 基础指标
            total_score = 0.0
            code_quality_score = 0.0
            innovation_score = 0.0
            observability_score = 0.0
            performance_optimization_score = 0.0

            # 如果有PR结果数据，解析AI分析结果
            if pr_result and hasattr(pr_result, 'ai_analysis_result') and pr_result.ai_analysis_result:
                try:
                    import json
                    data = json.loads(pr_result.ai_analysis_result)
                    total_score = data.get('overall_score', 0.0)
                    dimensions = data.get('dimensions', {})

                    code_quality = dimensions.get('code_quality', {})
                    innovation = dimensions.get('innovation', {})
                    observability = dimensions.get('observability', {})
                    performance_optimization = dimensions.get('performance_optimization', {})

                    code_quality_score = code_quality.get('score', 0.0) if code_quality else 0.0
                    innovation_score = innovation.get('score', 0.0) if innovation else 0.0
                    observability_score = observability.get('score', 0.0) if observability else 0.0
                    performance_optimization_score = performance_optimization.get('score', 0.0) if performance_optimization else 0.0
                except Exception as e:
                    logger.warning(f"解析AI分析结果失败: {e}")

            pr_metrics = PrMetrics(
                pr_node_id=pr_node_id,
                current_status=PrStatus.MERGED.value if activity.status == 'completed' else PrStatus.OPEN.value,
                total_score=total_score,
                code_quality=code_quality_score,
                innovation=innovation_score,
                observability=observability_score,
                performance_optimization=performance_optimization_score,
                total_points=activity.points or 0,
                created_at=datetime.utcnow().replace(microsecond=0),
                updated_at=datetime.utcnow().replace(microsecond=0)
            )

            db.add(pr_metrics)
            self.stats['pr_metrics_created'] += 1
            
            logger.info(f"✅ 成功迁移PR: {pr_node_id}")
            
        except Exception as e:
            logger.error(f"❌ 迁移PR {activity.id} 失败: {e}")
            self.stats['errors'].append(f"PR {activity.id}: {str(e)}")

    async def _create_or_get_user_identity(self, db, user_id):
        """创建或获取用户身份"""
        # 检查是否已存在
        result = await db.execute(
            select(UserIdentity).where(
                UserIdentity.platform == IdentityPlatform.GITHUB.value,
                UserIdentity.user_id == user_id,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            return existing
        else:
            return False

    def _parse_datetime(self, dt_value):
        """解析日期时间值"""
        if dt_value is None:
            return datetime.utcnow().replace(microsecond=0)

        if isinstance(dt_value, str):
            try:
                # 尝试解析字符串格式的日期时间
                parsed_dt = datetime.fromisoformat(dt_value.replace('Z', '+00:00'))
                return parsed_dt.replace(microsecond=0)
            except ValueError:
                try:
                    # 尝试其他常见格式
                    parsed_dt = datetime.strptime(dt_value, '%Y-%m-%d %H:%M:%S')
                    return parsed_dt.replace(microsecond=0)
                except ValueError:
                    logger.warning(f"无法解析日期时间: {dt_value}")
                    return datetime.utcnow().replace(microsecond=0)

        if isinstance(dt_value, datetime):
            return dt_value.replace(microsecond=0)

        return datetime.utcnow().replace(microsecond=0)

    def _print_stats(self):
        """打印统计信息"""
        logger.info("📊 迁移统计:")
        logger.info(f"  处理的PR数量: {self.stats['processed']}")
        logger.info(f"  创建的PR元数据: {self.stats['pr_metadata_created']}")
        logger.info(f"  创建的生命周期事件: {self.stats['lifecycle_events_created']}")
        logger.info(f"  创建的PR指标: {self.stats['pr_metrics_created']}")
        logger.info(f"  创建的用户身份: {self.stats['identities_created']}")
        logger.info(f"  错误数量: {len(self.stats['errors'])}")

        if self.stats['errors']:
            logger.error("错误详情:")
            for error in self.stats['errors']:
                logger.error(f"  - {error}")


async def main():
    """主函数"""
    import sys
    
    limit = 10  # 默认迁移10条
    if len(sys.argv) > 1:
        try:
            limit = int(sys.argv[1])
        except ValueError:
            logger.error("参数必须是数字")
            sys.exit(1)
    
    migrator = RealPrDataMigrator()
    await migrator.migrate_real_data(limit)


if __name__ == "__main__":
    asyncio.run(main())
