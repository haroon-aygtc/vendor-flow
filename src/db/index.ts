import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Use a fallback database URL for development
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/ai_platform';

// Create the connection
const client = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);