import { db } from './index';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

async function runMigrations() {
  console.log('Running database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    console.log('✅ Database migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { runMigrations };