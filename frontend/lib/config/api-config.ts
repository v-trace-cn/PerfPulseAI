/**
 * API Configuration
 * 
 * This file centralizes all backend API and frontend Origin configuration.
 * Addresses are determined based on the NODE_ENV environment variable.
 * You can override these defaults using NEXT_PUBLIC_BACKEND_API_URL and NEXT_PUBLIC_FRONTEND_ORIGIN in your .env file.
 */

// Function to get the backend API URL based on environment
export const getBackendApiUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      url = 'https://127.0.0.1:5000';
    } else {
      url = 'https://127.0.0.1:5000';
    }
  }
  // Ensure the URL uses https
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  } else if (!url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url;
};

// Function to get the frontend Origin URL based on environment
export const getFrontendOriginUrl = (): string => {
  let url = process.env.NEXT_PUBLIC_FRONTEND_ORIGIN;
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      url = 'https://127.0.0.1:3000'; // 生产环境前端 Origin URL
    } else {
      url = 'https://127.0.0.1:3000'; // 开发环境前端 Origin URL
    }
  }
  
  // Ensure the URL uses https
  if (url.startsWith('http://')) {
    url = url.replace('http://', 'https://');
  } else if (!url.startsWith('https://')) {
    url = 'https://' + url;
  }

  return url;
};

// Helper function to get the appropriate URL for an endpoint
// For client-side fetches directly to backend
export function getApiUrl(endpoint: string): string {
  return `${getBackendApiUrl()}${endpoint}`;
}

// Export the backend URL for direct usage where needed (e.g., in Next.js API routes acting as proxies)
export const backendUrl = getBackendApiUrl();
// Export the frontend origin for direct usage where needed (e.g., in CORS headers in Next.js API routes)
export const frontendOrigin = getFrontendOriginUrl();
