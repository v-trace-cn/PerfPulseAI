"""
积分系统一致性检查服务
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text, and_, or_
from sqlalchemy.orm import joinedload
import logging

from app.models.scoring import PointTransaction, PointDispute, PointPurchase
from app.models.user import User
from app.services.point_service import PointService

logger = logging.getLogger(__name__)


class ConsistencyService:
    """积分系统一致性检查服务"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.point_service = PointService(db)
    
    async def check_user_balance_consistency(self, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """检查用户积分余额一致性"""
        inconsistencies = []
        
        # 构建查询条件
        if user_id:
            user_filter = User.id == user_id
        else:
            user_filter = True
        
        # 获取所有用户的积分信息
        result = await self.db.execute(
            select(User.id, User.name, User.points)
            .filter(user_filter)
        )
        users = result.fetchall()
        
        for user_id, user_name, user_points in users:
            # 计算实际积分余额
            calculated_balance = await self.point_service.calculate_user_balance(user_id)
            
            if user_points != calculated_balance:
                inconsistencies.append({
                    "userId": user_id,
                    "userName": user_name,
                    "userTablePoints": user_points or 0,
                    "calculatedPoints": calculated_balance,
                    "difference": (user_points or 0) - calculated_balance,
                    "type": "balance_mismatch"
                })
        
        return inconsistencies
    
    async def check_transaction_sequence_consistency(self) -> List[Dict[str, Any]]:
        """检查交易序列一致性"""
        inconsistencies = []
        
        # 获取所有用户的交易记录，按时间排序
        result = await self.db.execute(
            select(PointTransaction)
            .order_by(PointTransaction.user_id, PointTransaction.created_at)
        )
        transactions = result.scalars().all()
        
        # 按用户分组检查
        user_transactions = {}
        for transaction in transactions:
            if transaction.user_id not in user_transactions:
                user_transactions[transaction.user_id] = []
            user_transactions[transaction.user_id].append(transaction)
        
        for user_id, user_txns in user_transactions.items():
            running_balance = 0
            for i, txn in enumerate(user_txns):
                running_balance += txn.amount
                
                if txn.balance_after != running_balance:
                    inconsistencies.append({
                        "userId": user_id,
                        "transactionId": txn.id,
                        "transactionIndex": i,
                        "expectedBalance": running_balance,
                        "recordedBalance": txn.balance_after,
                        "difference": txn.balance_after - running_balance,
                        "type": "sequence_mismatch",
                        "createdAt": txn.created_at.isoformat()
                    })
        
        return inconsistencies
    
    async def check_negative_balances(self) -> List[Dict[str, Any]]:
        """检查负余额情况"""
        result = await self.db.execute(
            select(PointTransaction)
            .filter(PointTransaction.balance_after < 0)
            .order_by(PointTransaction.created_at)
        )
        negative_transactions = result.scalars().all()
        
        issues = []
        for txn in negative_transactions:
            issues.append({
                "userId": txn.user_id,
                "transactionId": txn.id,
                "amount": txn.amount,
                "balanceAfter": txn.balance_after,
                "transactionType": txn.transaction_type.value,
                "description": txn.description,
                "createdAt": txn.created_at.isoformat(),
                "type": "negative_balance"
            })
        
        return issues
    
    async def check_orphaned_records(self) -> Dict[str, List[Dict[str, Any]]]:
        """检查孤立记录"""
        orphaned = {
            "disputes": [],
            "purchases": []
        }
        
        # 检查孤立的异议记录（没有对应交易）
        dispute_result = await self.db.execute(
            select(PointDispute)
            .outerjoin(PointTransaction, PointDispute.transaction_id == PointTransaction.id)
            .filter(PointTransaction.id.is_(None))
        )
        orphaned_disputes = dispute_result.scalars().all()
        
        for dispute in orphaned_disputes:
            orphaned["disputes"].append({
                "disputeId": dispute.id,
                "transactionId": dispute.transaction_id,
                "userId": dispute.user_id,
                "reason": dispute.reason,
                "createdAt": dispute.created_at.isoformat(),
                "type": "orphaned_dispute"
            })
        
        # 检查孤立的购买记录（没有对应交易）
        purchase_result = await self.db.execute(
            select(PointPurchase)
            .outerjoin(PointTransaction, PointPurchase.transaction_id == PointTransaction.id)
            .filter(PointTransaction.id.is_(None))
        )
        orphaned_purchases = purchase_result.scalars().all()
        
        for purchase in orphaned_purchases:
            orphaned["purchases"].append({
                "purchaseId": purchase.id,
                "transactionId": purchase.transaction_id,
                "userId": purchase.user_id,
                "itemName": purchase.item_name,
                "pointsCost": purchase.points_cost,
                "createdAt": purchase.created_at.isoformat(),
                "type": "orphaned_purchase"
            })
        
        return orphaned
    
    async def run_full_consistency_check(self) -> Dict[str, Any]:
        """运行完整的一致性检查"""
        logger.info("开始运行完整的积分系统一致性检查")
        
        start_time = datetime.utcnow()
        
        # 执行各项检查
        balance_issues = await self.check_user_balance_consistency()
        sequence_issues = await self.check_transaction_sequence_consistency()
        negative_balance_issues = await self.check_negative_balances()
        orphaned_records = await self.check_orphaned_records()
        
        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()
        
        # 统计问题数量
        total_issues = (
            len(balance_issues) + 
            len(sequence_issues) + 
            len(negative_balance_issues) + 
            len(orphaned_records["disputes"]) + 
            len(orphaned_records["purchases"])
        )
        
        report = {
            "checkTime": start_time.isoformat(),
            "duration": duration,
            "totalIssues": total_issues,
            "isConsistent": total_issues == 0,
            "issues": {
                "balanceInconsistencies": balance_issues,
                "sequenceInconsistencies": sequence_issues,
                "negativeBalances": negative_balance_issues,
                "orphanedRecords": orphaned_records
            },
            "summary": {
                "balanceIssues": len(balance_issues),
                "sequenceIssues": len(sequence_issues),
                "negativeBalanceIssues": len(negative_balance_issues),
                "orphanedDisputes": len(orphaned_records["disputes"]),
                "orphanedPurchases": len(orphaned_records["purchases"])
            }
        }
        
        logger.info(f"一致性检查完成，耗时 {duration:.2f}s，发现 {total_issues} 个问题")
        
        return report
    
    async def fix_user_balance_inconsistency(self, user_id: int) -> Dict[str, Any]:
        """修复用户积分余额不一致问题"""
        # 计算正确的余额
        correct_balance = await self.point_service.calculate_user_balance(user_id)
        
        # 获取用户当前余额
        user_result = await self.db.execute(
            select(User).filter(User.id == user_id)
        )
        user = user_result.scalar()
        
        if not user:
            raise ValueError(f"用户 {user_id} 不存在")
        
        old_balance = user.points or 0
        
        if old_balance != correct_balance:
            # 更新用户余额
            user.points = correct_balance
            await self.db.commit()
            
            logger.info(f"修复用户 {user_id} 积分余额: {old_balance} -> {correct_balance}")
            
            return {
                "userId": user_id,
                "oldBalance": old_balance,
                "newBalance": correct_balance,
                "difference": correct_balance - old_balance,
                "fixed": True
            }
        else:
            return {
                "userId": user_id,
                "balance": correct_balance,
                "fixed": False,
                "message": "余额已一致，无需修复"
            }
    
    async def fix_all_balance_inconsistencies(self) -> List[Dict[str, Any]]:
        """修复所有用户积分余额不一致问题"""
        inconsistencies = await self.check_user_balance_consistency()
        fixed_results = []
        
        for issue in inconsistencies:
            try:
                result = await self.fix_user_balance_inconsistency(issue["userId"])
                fixed_results.append(result)
            except Exception as e:
                logger.error(f"修复用户 {issue['userId']} 积分余额失败: {e}")
                fixed_results.append({
                    "userId": issue["userId"],
                    "fixed": False,
                    "error": str(e)
                })
        
        return fixed_results
    
    async def get_system_health_metrics(self) -> Dict[str, Any]:
        """获取系统健康指标"""
        # 总用户数
        total_users_result = await self.db.execute(
            select(func.count(User.id))
        )
        total_users = total_users_result.scalar() or 0
        
        # 总交易数
        total_transactions_result = await self.db.execute(
            select(func.count(PointTransaction.id))
        )
        total_transactions = total_transactions_result.scalar() or 0
        
        # 总积分流通量
        total_points_result = await self.db.execute(
            select(func.sum(User.points))
        )
        total_points = total_points_result.scalar() or 0
        
        # 最近24小时的交易数
        yesterday = datetime.utcnow() - timedelta(days=1)
        recent_transactions_result = await self.db.execute(
            select(func.count(PointTransaction.id))
            .filter(PointTransaction.created_at >= yesterday)
        )
        recent_transactions = recent_transactions_result.scalar() or 0
        
        # 待处理异议数
        pending_disputes_result = await self.db.execute(
            select(func.count(PointDispute.id))
            .filter(PointDispute.status == 'PENDING')
        )
        pending_disputes = pending_disputes_result.scalar() or 0
        
        return {
            "totalUsers": total_users,
            "totalTransactions": total_transactions,
            "totalPointsInCirculation": int(total_points),
            "recentTransactions24h": recent_transactions,
            "pendingDisputes": pending_disputes,
            "averagePointsPerUser": round(total_points / total_users, 2) if total_users > 0 else 0,
            "lastCheckTime": datetime.utcnow().isoformat()
        }
