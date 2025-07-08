/**
 * API re-export file for backward compatibility
 * This file re-exports the unified API to maintain compatibility with existing imports
 */

export { 
  authApi, 
  userApi, 
  activityApi, 
  prApi, 
  departmentApi, 
  scoringApi,
  unifiedApi as default 
} from './unified-api';

// Re-export types for convenience
export type { 
  ApiResponse, 
  PaginatedResponse 
} from './unified-api';
