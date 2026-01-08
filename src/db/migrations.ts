/**
 * Database Migrations
 * 
 * Handles database schema creation and updates.
 * In production, use drizzle-kit to generate migration files.
 * For this test app, we use direct SQL execution.
 * 
 * IMPORTANT: Migrations should be idempotent (safe to run multiple times)
 * 
 * SYNC-READY CHANGES:
 * - deleted_at: Soft delete support
 * - sync_status: 'pending' | 'synced' (explicit state vs integer)
 */

import * as SQLite from 'expo-sqlite';

/**
 * Run all database migrations
 * Creates tables if they don't exist
 * 
 * @param db - SQLite database instance
 */
export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Starting...');
  
  try {
    // Create products table with soft delete and sync status
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL
      );
    `);
    
    // Create sales table with foreign key, soft delete, and sync status
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total REAL NOT NULL,
        created_at TEXT DEFAULT (datetime('now')) NOT NULL,
        updated_at TEXT DEFAULT (datetime('now')) NOT NULL,
        deleted_at TEXT,
        sync_status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
    
    // Add indexes for common queries
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_products_deleted_at 
      ON products(deleted_at);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_products_sync_status 
      ON products(sync_status);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sales_deleted_at 
      ON sales(deleted_at);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sales_sync_status 
      ON sales(sync_status);
    `);
    
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_sales_product_id 
      ON sales(product_id);
    `);
    
    console.log('[Migrations] Completed successfully');
  } catch (error) {
    console.error('[Migrations] Failed:', error);
    throw error;
  }
}

/**
 * Reset database (DEV ONLY)
 * Drops all tables and recreates them
 * 
 * @param db - SQLite database instance
 */
export async function resetDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  console.log('[Migrations] Resetting database...');
  
  await db.execAsync(`
    DROP TABLE IF EXISTS sales;
    DROP TABLE IF EXISTS products;
  `);
  
  await runMigrations(db);
  console.log('[Migrations] Reset complete');
}
