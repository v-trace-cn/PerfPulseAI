import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/data-loader';

// 懒加载非关键组件
export const LazyScoringSystem = lazy(() => 
  import('@/components/scoring-system').then(module => ({ default: module.ScoringSystem }))
);

export const LazyPointsMall = lazy(() => 
  import('@/components/dashboard/PointsMall').then(module => ({ default: module.PointsMall }))
);

export const LazyPointsHistory = lazy(() => 
  import('@/components/dashboard/PointsHistory').then(module => ({ default: module.PointsHistory }))
);

export const LazyCompanyManagement = lazy(() => 
  import('@/app/companies/page').then(module => ({ default: module.default }))
);

export const LazyOrganizationManagement = lazy(() => 
  import('@/app/org/page').then(module => ({ default: module.default }))
);

export const LazyNotifications = lazy(() => 
  import('@/app/notifications/page').then(module => ({ default: module.default }))
);

export const LazyRedemptionCenter = lazy(() => 
  import('@/app/org/redemption/page').then(module => ({ default: module.default }))
);

// 懒加载包装器组件
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LazyWrapper({ children, fallback }: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || <LoadingSpinner text="加载中..." />}>
      {children}
    </Suspense>
  );
}

// 预制的懒加载组件
export function LazyScoringSystemWithSuspense() {
  return (
    <LazyWrapper>
      <LazyScoringSystem />
    </LazyWrapper>
  );
}

export function LazyPointsMallWithSuspense() {
  return (
    <LazyWrapper>
      <LazyPointsMall />
    </LazyWrapper>
  );
}

export function LazyPointsHistoryWithSuspense() {
  return (
    <LazyWrapper>
      <LazyPointsHistory />
    </LazyWrapper>
  );
}

export function LazyCompanyManagementWithSuspense() {
  return (
    <LazyWrapper>
      <LazyCompanyManagement />
    </LazyWrapper>
  );
}

export function LazyOrganizationManagementWithSuspense() {
  return (
    <LazyWrapper>
      <LazyOrganizationManagement />
    </LazyWrapper>
  );
}

export function LazyNotificationsWithSuspense() {
  return (
    <LazyWrapper>
      <LazyNotifications />
    </LazyWrapper>
  );
}

export function LazyRedemptionCenterWithSuspense() {
  return (
    <LazyWrapper>
      <LazyRedemptionCenter />
    </LazyWrapper>
  );
}
