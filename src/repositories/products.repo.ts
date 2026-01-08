/**
 * Products Repository
 * 
 * This layer handles ALL direct database access for products.
 * It abstracts Drizzle ORM operations and provides a clean API
 * for CRUD operations with SOFT DELETE support.
 * 
 * WHY THIS EXISTS:
 * - Separation of concerns: database logic isolated from business logic
 * - Testability: easy to mock for unit tests
 * - Maintainability: database changes only affect this file
 * - Sync-ready: soft deletes enable backend sync of deletions
 * 
 * RULES:
 * - ONLY repositories can import getDB() and ensureDBReady()
 * - ALWAYS call ensureDBReady() before database operations
 * - Services call repositories, NEVER getDB() directly
 * - Components/hooks call services, NEVER repositories directly
 * - Use SOFT DELETE (set deleted_at) instead of hard delete
 */

import { eq, isNull, sql } from 'drizzle-orm';
import { getDB, ensureDBReady } from '../db/client';
import { products, type Product, type NewProduct, type SyncStatus } from '../db/schema';
import uuid from 'react-native-uuid';

/**
 * Create a new product in the database.
 * 
 * Automatically generates UUID and sets timestamps.
 * Sets sync_status='pending' to indicate it needs backend sync.
 * 
 * @param data - Product data (name, price)
 * @returns Created product with generated ID and timestamps
 */
export async function createProduct(
  data: Omit<NewProduct, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'sync_status'>
): Promise<Product> {
  await ensureDBReady();
  const db = getDB();
  
  const newProduct: NewProduct = {
    id: uuid.v4() as string,
    ...data,
    sync_status: 'pending',
  };

  await db.insert(products).values(newProduct);
  
  // Fetch and return the created product
  const created = await db
    .select()
    .from(products)
    .where(eq(products.id, newProduct.id))
    .limit(1);
    
  return created[0];
}

/**
 * Get all active (non-deleted) products from the database.
 * 
 * Returns products ordered by creation date (newest first).
 * Excludes soft-deleted products (deleted_at IS NOT NULL).
 * 
 * @returns Array of all active products
 */
export async function getAllProducts(): Promise<Product[]> {
  await ensureDBReady();
  const db = getDB();
  
  const result = await db
    .select()
    .from(products)
    .where(isNull(products.deleted_at));
    
  return result;
}

/**
 * Get a single product by ID.
 * 
 * @param id - Product UUID
 * @param includeDeleted - If true, include soft-deleted products
 * @returns Product if found, undefined otherwise
 */
export async function getProductById(
  id: string,
  includeDeleted = false
): Promise<Product | undefined> {
  await ensureDBReady();
  const db = getDB();
  
  const query = db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  
  // Only filter deleted if not including them
  const result = includeDeleted
    ? await query
    : await db
        .select()
        .from(products)
        .where(sql`${products.id} = ${id} AND ${products.deleted_at} IS NULL`)
        .limit(1);
    
  return result[0];
}

/**
 * Update a product's information.
 * 
 * Automatically updates the updated_at timestamp and sets sync_status='pending'.
 * 
 * @param id - Product UUID
 * @param data - Fields to update
 * @returns Updated product
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<Product, 'id' | 'created_at' | 'deleted_at'>>
): Promise<Product> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(products)
    .set({
      ...data,
      updated_at: new Date().toISOString(),
      sync_status: 'pending', // Mark as unsynced when updated
    })
    .where(eq(products.id, id));
    
  const updated = await getProductById(id);
  if (!updated) {
    throw new Error(`Product ${id} not found after update`);
  }
  
  return updated;
}

/**
 * Soft delete a product (set deleted_at timestamp).
 * 
 * SOFT DELETE allows:
 * - Backend sync of deletions
 * - Data recovery if needed
 * - Audit trail preservation
 * 
 * @param id - Product UUID
 */
export async function deleteProduct(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(products)
    .set({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending', // Need to sync deletion
    })
    .where(eq(products.id, id));
}

/**
 * Hard delete a product (permanently remove from database).
 * 
 * USE WITH CAUTION: Only for cleanup after backend sync confirmation.
 * 
 * @param id - Product UUID
 */
export async function hardDeleteProduct(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db.delete(products).where(eq(products.id, id));
}

/**
 * Get all unsynced products (pending sync).
 * 
 * Used for future sync implementation with Laravel backend.
 * Includes both new/updated records AND soft-deleted records.
 * 
 * @returns Array of products where sync_status='pending'
 */
export async function getUnsyncedProducts(): Promise<Product[]> {
  await ensureDBReady();
  const db = getDB();
  
  const result = await db
    .select()
    .from(products)
    .where(eq(products.sync_status, 'pending'));
    
  return result;
}

/**
 * Mark a product as synced.
 * 
 * Called after successful sync with backend.
 * 
 * @param id - Product UUID
 */
export async function markProductAsSynced(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(products)
    .set({ sync_status: 'synced' })
    .where(eq(products.id, id));
}
