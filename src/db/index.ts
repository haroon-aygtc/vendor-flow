import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString, { 
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client, { schema });

// Export the client for direct queries if needed
export { client };

// Export all schema
export * from './schema';