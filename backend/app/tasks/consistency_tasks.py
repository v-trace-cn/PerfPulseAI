"""
积分系统一致性检查定期任务
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from app.core.database import AsyncSessionLocal
from app.services.consistency_service import ConsistencyService

logger = logging.getLogger(__name__)


class ConsistencyTaskScheduler:
    """一致性检查任务调度器"""
    
    def __init__(self):
        self.is_running = False
        self.last_check_time = None
        self.last_check_result = None
    
    async def run_daily_consistency_check(self) -> Dict[str, Any]:
        """运行每日一致性检查"""
        logger.info("开始运行每日一致性检查")
        
        async with AsyncSessionLocal() as db:
            consistency_service = ConsistencyService(db)
            
            try:
                # 运行完整的一致性检查
                report = await consistency_service.run_full_consistency_check()
                
                # 记录检查结果
                self.last_check_time = datetime.utcnow()
                self.last_check_result = report
                
                # 如果发现问题，记录警告日志
                if not report["isConsistent"]:
                    logger.warning(f"一致性检查发现 {report['totalIssues']} 个问题")
                    
                    # 发送告警通知（这里可以集成邮件、钉钉等通知方式）
                    await self._send_consistency_alert(report)
                else:
                    logger.info("一致性检查通过，系统状态正常")
                
                return report
                
            except Exception as e:
                logger.error(f"一致性检查失败: {e}")
                error_report = {
                    "checkTime": datetime.utcnow().isoformat(),
                    "success": False,
                    "error": str(e),
                    "totalIssues": -1,
                    "isConsistent": False
                }
                self.last_check_result = error_report
                return error_report
    
    async def run_balance_fix_task(self) -> Dict[str, Any]:
        """运行积分余额修复任务"""
        logger.info("开始运行积分余额修复任务")
        
        async with AsyncSessionLocal() as db:
            consistency_service = ConsistencyService(db)
            
            try:
                # 检查余额不一致问题
                balance_issues = await consistency_service.check_user_balance_consistency()
                
                if not balance_issues:
                    logger.info("没有发现积分余额不一致问题")
                    return {
                        "success": True,
                        "message": "没有需要修复的积分余额问题",
                        "fixedCount": 0
                    }
                
                # 自动修复余额不一致问题
                fix_results = await consistency_service.fix_all_balance_inconsistencies()
                fixed_count = sum(1 for r in fix_results if r.get("fixed", False))
                
                logger.info(f"积分余额修复完成，修复了 {fixed_count} 个用户的积分余额")
                
                return {
                    "success": True,
                    "message": f"成功修复 {fixed_count} 个用户的积分余额",
                    "totalProcessed": len(fix_results),
                    "fixedCount": fixed_count,
                    "results": fix_results
                }
                
            except Exception as e:
                logger.error(f"积分余额修复任务失败: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "fixedCount": 0
                }
    
    async def run_health_monitoring(self) -> Dict[str, Any]:
        """运行系统健康监控"""
        logger.info("开始运行系统健康监控")
        
        async with AsyncSessionLocal() as db:
            consistency_service = ConsistencyService(db)
            
            try:
                # 获取系统健康指标
                health_metrics = await consistency_service.get_system_health_metrics()
                
                # 检查关键指标是否正常
                alerts = []
                
                # 检查待处理异议数量
                if health_metrics["pendingDisputes"] > 50:
                    alerts.append({
                        "type": "high_pending_disputes",
                        "message": f"待处理异议数量过多: {health_metrics['pendingDisputes']}",
                        "severity": "warning"
                    })
                
                # 检查最近24小时交易数量
                if health_metrics["recentTransactions24h"] == 0:
                    alerts.append({
                        "type": "no_recent_transactions",
                        "message": "最近24小时没有积分交易",
                        "severity": "info"
                    })
                
                # 检查平均积分是否异常
                avg_points = health_metrics["averagePointsPerUser"]
                if avg_points > 10000:  # 假设正常范围
                    alerts.append({
                        "type": "high_average_points",
                        "message": f"用户平均积分异常高: {avg_points}",
                        "severity": "warning"
                    })
                
                health_metrics["alerts"] = alerts
                health_metrics["alertCount"] = len(alerts)
                
                if alerts:
                    logger.warning(f"系统健康监控发现 {len(alerts)} 个告警")
                    for alert in alerts:
                        logger.warning(f"[{alert['severity'].upper()}] {alert['message']}")
                
                return health_metrics
                
            except Exception as e:
                logger.error(f"系统健康监控失败: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "alertCount": 1,
                    "alerts": [{
                        "type": "monitoring_error",
                        "message": f"健康监控执行失败: {e}",
                        "severity": "error"
                    }]
                }
    
    async def _send_consistency_alert(self, report: Dict[str, Any]):
        """发送一致性检查告警通知"""
        # 这里可以集成各种通知方式
        # 例如：邮件、钉钉、企业微信、Slack等
        
        alert_message = f"""
积分系统一致性检查告警

检查时间: {report['checkTime']}
检查耗时: {report['duration']:.2f}秒
发现问题: {report['totalIssues']}个

问题详情:
- 余额不一致: {report['summary']['balanceIssues']}个
- 序列不一致: {report['summary']['sequenceIssues']}个
- 负余额问题: {report['summary']['negativeBalanceIssues']}个
- 孤立异议记录: {report['summary']['orphanedDisputes']}个
- 孤立购买记录: {report['summary']['orphanedPurchases']}个

请及时处理这些问题以确保系统正常运行。
        """
        
        logger.warning(f"一致性检查告警: {alert_message}")
        
        # TODO: 实现具体的通知发送逻辑
        # await send_email_alert(alert_message)
        # await send_dingtalk_alert(alert_message)
    
    async def start_scheduled_tasks(self):
        """启动定期任务"""
        if self.is_running:
            logger.warning("定期任务已在运行中")
            return
        
        self.is_running = True
        logger.info("启动积分系统定期任务")
        
        try:
            while self.is_running:
                current_time = datetime.utcnow()
                
                # 每天凌晨2点运行一致性检查
                if (current_time.hour == 2 and current_time.minute == 0 and 
                    (not self.last_check_time or 
                     current_time.date() > self.last_check_time.date())):
                    
                    await self.run_daily_consistency_check()
                
                # 每小时运行健康监控
                if current_time.minute == 0:
                    await self.run_health_monitoring()
                
                # 每6小时运行一次余额修复检查
                if current_time.hour % 6 == 0 and current_time.minute == 30:
                    await self.run_balance_fix_task()
                
                # 等待1分钟后再次检查
                await asyncio.sleep(60)
                
        except Exception as e:
            logger.error(f"定期任务执行出错: {e}")
        finally:
            self.is_running = False
            logger.info("积分系统定期任务已停止")
    
    def stop_scheduled_tasks(self):
        """停止定期任务"""
        self.is_running = False
        logger.info("正在停止积分系统定期任务...")


# 全局任务调度器实例
consistency_scheduler = ConsistencyTaskScheduler()


async def start_consistency_tasks():
    """启动一致性检查任务"""
    await consistency_scheduler.start_scheduled_tasks()


def stop_consistency_tasks():
    """停止一致性检查任务"""
    consistency_scheduler.stop_scheduled_tasks()
