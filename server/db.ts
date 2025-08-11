import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Optimized connection pool configuration for production
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Production-optimized settings
  max: 20,           // Maximum connections in pool
  min: 2,            // Minimum connections to maintain
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Connection timeout: 10s
  maxUses: 7500,     // Rotate connections after 7500 uses
  // acquireTimeoutMillis: 8000, // Wait max 8s for available connection (not supported)
});

export const db = drizzle({ client: pool, schema });

// Connection pool event handlers for monitoring
pool.on('connect', (client) => {
  console.log('Database connection established:', (client as any).processID);
});

pool.on('error', (err: Error) => {
  console.error('Database pool error:', err);
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...');
  await pool.end();
  process.exit(0);
});
