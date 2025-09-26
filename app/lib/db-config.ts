// Database configuration for serverless deployment
export const dbConfig = {
  // Connection pool settings for serverless
  connectionLimit: 1, // Serverless functions should use minimal connections
  connectionTimeout: 60000, // 60 seconds
  acquireTimeout: 60000,
  timeout: 60000,

  // Retry configuration
  retryAttempts: 3,
  retryDelayMs: 1000,
}

// Format DATABASE_URL for connection pooling
export function formatDatabaseUrl(baseUrl: string): string {
  if (!baseUrl) return baseUrl;

  // TEMPORARY: Return URL as-is to debug connectivity issues
  // The user should set their DATABASE_URL directly to the correct pooler URL
  return baseUrl;
}

// Get optimized connection URLs
export function getDatabaseUrls() {
  const baseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL || baseUrl;

  return {
    DATABASE_URL: formatDatabaseUrl(baseUrl || ''),
    DIRECT_URL: directUrl
  };
}