/**
 * Database Client - SQLite + Drizzle Singleton
 * 
 * ARCHITECTURE PRINCIPLES:
 * 1. Single database connection for entire app lifecycle
 * 2. ASYNC initialization with openDatabaseAsync (Expo recommended)
 * 3. DB readiness guard prevents queries before initialization
 * 4. Never re-initialize or create multiple connections
 * 
 * This prevents:
 * - Race conditions on navigation
 * - Multiple database locks
 * - Stale data issues with useFocusEffect
 * - "Database not ready" errors
 * - Queries running before initialization completes
 */

import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';
import { runMigrations } from './migrations';

// Singleton instances
let sqliteDb: SQLite.SQLiteDatabase | null = null;
let drizzleDb: ReturnType<typeof drizzle> | null = null;
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialize database connection and run migrations
 * 
 * MUST BE CALLED ONCE at app startup (in App.tsx)
 * Uses ASYNC openDatabaseAsync for better Expo compatibility
 * Safe to call multiple times (will return existing promise)
 * 
 * @returns Promise that resolves when database is ready
 */
export async function initializeDatabase(): Promise<void> {
  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    console.log('[Database] Initialization already in progress, waiting...');
    return initializationPromise;
  }

  // Return immediately if already initialized
  if (isInitialized) {
    console.log('[Database] Already initialized');
    return;
  }

  // Create initialization promise
  initializationPromise = (async () => {
    try {
      console.log('[Database] Starting async initialization...');
      
      // Open SQLite database ASYNC (Expo recommended)
      sqliteDb = await SQLite.openDatabaseAsync('app.db');
      console.log('[Database] SQLite opened (async)');
      
      // Wrap with Drizzle ORM for type-safe queries
      drizzleDb = drizzle(sqliteDb, { schema });
      console.log('[Database] Drizzle ORM connected');
      
      // Run migrations to ensure tables exist
      await runMigrations(sqliteDb);
      
      isInitialized = true;
      console.log('[Database] ✓ Ready');
    } catch (error) {
      console.error('[Database] Initialization failed:', error);
      // Reset state so retry is possible
      initializationPromise = null;
      sqliteDb = null;
      drizzleDb = null;
      isInitialized = false;
      throw new Error('Failed to initialize database');
    }
  })();

  return initializationPromise;
}

/**
 * Ensure database is ready before executing query
 * 
 * USE THIS in repositories before any database operation
 * Waits for initialization if in progress
 * Throws error if initialization failed
 * 
 * @throws Error if database not initialized or initialization failed
 */
export async function ensureDBReady(): Promise<void> {
  // Wait for initialization if in progress
  if (initializationPromise && !isInitialized) {
    await initializationPromise;
  }

  // Check if ready
  if (!isInitialized || !drizzleDb) {
    throw new Error(
      '[Database] Not ready. Call initializeDatabase() in App.tsx first.'
    );
  }
}

/**
 * Get Drizzle database instance
 * 
 * USE THIS in repositories for all database operations
 * MUST call ensureDBReady() before using this
 * 
 * @returns Drizzle database instance
 * @throws Error if database not initialized
 */
export function getDB() {
  if (!drizzleDb || !isInitialized) {
    throw new Error(
      '[Database] Not initialized. Call ensureDBReady() before getDB().'
    );
  }
  return drizzleDb;
}

/**
 * Get raw SQLite instance (rarely needed)
 * Only use for operations not supported by Drizzle
 * 
 * @returns SQLite database instance
 * @throws Error if database not initialized
 */
export function getSQLiteDB() {
  if (!sqliteDb || !isInitialized) {
    throw new Error('[Database] Not initialized');
  }
  return sqliteDb;
}

/**
 * Check if database is ready
 * Useful for loading screens
 * 
 * @returns true if database is initialized and ready
 */
export function isDatabaseReady(): boolean {
  return isInitialized;
}
