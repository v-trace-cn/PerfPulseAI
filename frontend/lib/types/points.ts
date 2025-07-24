/**
 * 积分交易记录接口
 */
export interface PointTransaction {
  id: string;
  userId: number;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string;
  relatedActivityId?: string;
  createdAt: string;
  canDispute: boolean;
  disputeTimeLeft: number;
}

/**
 * 用户积分汇总接口
 */
export interface UserPointsSummary {
  userId: number;
  currentBalance: number;
  totalTransactions: number;
  totalEarned: number;
  totalSpent: number;
  lastTransactionDate: string;
  averageMonthlyEarning: number;
  pointsRank: number;
  totalUsers: number;
}

/**
 * 积分统计数据接口
 */
export interface PointsStats {
  totalPoints: number;
  monthlyEarned: number;
  monthlySpent: number;
  rank: number;
  totalUsers: number;
  recentTransactions: PointTransaction[];
}

/**
 * 奖励商品接口
 */
export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
  available: boolean;
  stock?: number;
  popularity?: number;
}

/**
 * 兑换记录接口
 */
export interface RedemptionRecord {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  status: 'pending' | 'completed' | 'cancelled';
  redeemedAt: string;
  completedAt?: string;
}

/**
 * 积分争议接口
 */
export interface PointDispute {
  id: string;
  transactionId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

/**
 * 积分排行榜项目接口
 */
export interface LeaderboardItem {
  userId: number;
  userName: string;
  userAvatar?: string;
  points: number;
  rank: number;
  change: number; // 排名变化
}

/**
 * 积分趋势数据接口
 */
export interface PointsTrend {
  date: string;
  earned: number;
  spent: number;
  balance: number;
}

/**
 * 积分活动接口
 */
export interface PointsActivity {
  id: string;
  title: string;
  description: string;
  pointsReward: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participantCount: number;
  maxParticipants?: number;
}
