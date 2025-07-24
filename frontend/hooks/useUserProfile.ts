import { useAuth } from '@/lib/auth-context';
import { useApiQuery, QUERY_STALE_TIME } from './useApiQuery';
import { unifiedApi } from '@/lib/unified-api';

interface UseUserProfileOptions {
  userId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * 获取用户资料的Hook
 */
export function useUserProfile(options: UseUserProfileOptions = {}) {
  const { user: currentUser } = useAuth();
  const { userId, enabled = true, refetchInterval } = options;
  
  // 确定要获取的用户ID
  const targetUserId = userId || currentUser?.id;
  
  return useApiQuery(
    ['userProfile', targetUserId],
    () => unifiedApi.user.getProfile(String(targetUserId)),
    {
      enabled: enabled && !!targetUserId,
      staleTime: QUERY_STALE_TIME.MEDIUM,
      refetchInterval,
    }
  );
}

/**
 * 获取当前用户资料的Hook
 */
export function useCurrentUserProfile() {
  const { user } = useAuth();
  
  return useApiQuery(
    ['currentUserProfile'],
    () => unifiedApi.user.getProfile(String(user?.id)),
    {
      enabled: !!user?.id,
      staleTime: QUERY_STALE_TIME.LONG, // 当前用户资料更新频率较低
    }
  );
}

/**
 * 获取用户积分信息的Hook
 */
export function useUserPoints(userId?: string) {
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.id;
  
  return useApiQuery(
    ['userPoints', targetUserId],
    () => unifiedApi.points.getUserPoints(String(targetUserId)),
    {
      enabled: !!targetUserId,
      staleTime: QUERY_STALE_TIME.SHORT, // 积分信息更新频率较高
      refetchInterval: 30000, // 每30秒自动刷新
    }
  );
}

/**
 * 获取用户统计信息的Hook
 */
export function useUserStats(userId?: string) {
  const { user: currentUser } = useAuth();
  const targetUserId = userId || currentUser?.id;
  
  return useApiQuery(
    ['userStats', targetUserId],
    () => unifiedApi.user.getStats(String(targetUserId)),
    {
      enabled: !!targetUserId,
      staleTime: QUERY_STALE_TIME.MEDIUM,
    }
  );
}