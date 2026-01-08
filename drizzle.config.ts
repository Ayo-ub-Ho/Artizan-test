import type { Config } from 'drizzle-kit';

/**
 * Drizzle Kit Configuration
 * 
 * Used for generating migrations from schema changes.
 * Run `npx drizzle-kit generate:sqlite` to create migration files.
 * 
 * Note: This project uses inline migrations for simplicity,
 * but this config is here for future use.
 */
export default {
  schema: './src/db/schema/*.ts',
  out: './src/db/migrations',
  driver: 'expo',
  dialect: 'sqlite',
} satisfies Config;
