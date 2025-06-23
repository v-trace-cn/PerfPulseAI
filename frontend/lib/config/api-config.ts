/**
 * API Configuration
 * 
 * This file centralizes all backend API configuration.
 * To switch backends, just modify the values in this file.
 */

// Available backend environments
export enum BackendEnvironment {
  LOCAL = 'local',
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

// Current active environment
// Read from environment variable, default to LOCAL
export const ACTIVE_ENVIRONMENT: BackendEnvironment = (process.env.NEXT_PUBLIC_BACKEND_ENV as BackendEnvironment) || BackendEnvironment.LOCAL;
console.log("ACTIVE_ENVIRONMENT:", ACTIVE_ENVIRONMENT);

// Configuration for each environment
interface EnvironmentConfig {
  backendApiUrl: string;
  nextjsApiUrl: string;
  useNextjsApi: boolean; // Whether to use Next.js API routes or direct backend calls
}

const environmentConfigs: Record<BackendEnvironment, EnvironmentConfig> = {
  [BackendEnvironment.LOCAL]: {
    backendApiUrl: 'http://127.0.0.1:5000',
    nextjsApiUrl: '', // Empty string means relative path
    useNextjsApi: true
  },
  [BackendEnvironment.DEVELOPMENT]: {
    backendApiUrl: 'https://dev-api.perfpulseai.com',
    nextjsApiUrl: '',
    useNextjsApi: true
  },
  [BackendEnvironment.STAGING]: {
    backendApiUrl: 'https://staging-api.perfpulseai.com',
    nextjsApiUrl: '',
    useNextjsApi: true
  },
  [BackendEnvironment.PRODUCTION]: {
    backendApiUrl: 'http://192.168.0.29:5000',
    nextjsApiUrl: '',
    useNextjsApi: true
  }
};

// Export the active configuration
export const apiConfig = environmentConfigs[ACTIVE_ENVIRONMENT];
console.log("apiConfig:", apiConfig);

// Helper function to get the appropriate URL for an endpoint
export function getApiUrl(endpoint: string, useDirectBackend = false): string {
  // Ensure apiConfig is not undefined. If it is, default to local.
  const currentApiConfig = apiConfig || environmentConfigs[BackendEnvironment.LOCAL];

  // If forced to use direct backend or the config specifies direct backend
  if (useDirectBackend || !currentApiConfig.useNextjsApi) {
    return `${currentApiConfig.backendApiUrl}${endpoint}`;
  }
  
  // Otherwise use Next.js API routes
  return `${currentApiConfig.nextjsApiUrl}${endpoint}`;
}
