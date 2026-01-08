/**
 * Database Schema - All Tables
 * 
 * Centralized schema definition for all database tables.
 * Uses Drizzle ORM's type-safe schema builder.
 * 
 * SYNC-READY DESIGN:
 * - UUID primary keys (compatible with distributed systems)
 * - created_at, updated_at timestamps (track data lifecycle)
 * - deleted_at for soft deletes (preserve data, enable sync)
 * - sync_status: 'pending' | 'synced' (explicit sync state)
 * 
 * SOFT DELETE PATTERN:
 * - Never DELETE records, set deleted_at instead
 * - Query filters exclude deleted records
 * - Backend can sync deletions
 */

import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Sync status enum values
export type SyncStatus = 'pending' | 'synced';

/**
 * Products Table
 * Stores product information for the catalog
 */
export const products = sqliteTable('products', {
  id: text('id').primaryKey().notNull(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text('deleted_at'), // NULL = not deleted, datetime = soft deleted
  sync_status: text('sync_status')
    .notNull()
    .default('pending'), // 'pending' | 'synced'
});

/**
 * Sales Table
 * Stores sales transactions with product references
 */
export const sales = sqliteTable('sales', {
  id: text('id').primaryKey().notNull(),
  product_id: text('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  total: real('total').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  deleted_at: text('deleted_at'), // NULL = not deleted, datetime = soft deleted
  sync_status: text('sync_status')
    .notNull()
    .default('pending'), // 'pending' | 'synced'
});

// Type exports for TypeScript safety
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
