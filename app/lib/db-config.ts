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

  // If it's already a pooled connection, return as is
  if (baseUrl.includes('?pgbouncer=true') || baseUrl.includes('pooler')) {
    return baseUrl;
  }

  // Add connection pooling parameters for Supabase
  const url = new URL(baseUrl);

  // For Supabase, use the transaction pooler for better serverless performance
  if (url.hostname.includes('supabase')) {
    // Replace direct connection with pooled connection
    const pooledHostname = url.hostname.replace('.supabase.co', '-pooler.supabase.co');
    url.hostname = pooledHostname;
    url.port = '6543'; // Supabase pooler port

    // Add pooling parameters
    url.searchParams.set('pgbouncer', 'true');
    url.searchParams.set('connection_limit', '1');
    url.searchParams.set('pool_timeout', '10');
  }

  return url.toString();
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