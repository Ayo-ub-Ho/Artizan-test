/**
 * Sales Repository
 * 
 * This layer handles ALL direct database access for sales.
 * It abstracts Drizzle ORM operations and provides a clean API
 * for CRUD operations with SOFT DELETE support, including JOIN queries with products.
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
import { sales, products, type Sale, type NewSale, type SyncStatus } from '../db/schema';
import uuid from 'react-native-uuid';

/**
 * Extended Sale type with product information included.
 * Used for displaying sales with product details.
 */
export type SaleWithProduct = Sale & {
  product: {
    id: string;
    name: string;
    price: number;
  };
};

/**
 * Create a new sale in the database.
 * 
 * Automatically generates UUID and sets timestamps.
 * Sets sync_status='pending' to indicate it needs backend sync.
 * 
 * @param data - Sale data (product_id, quantity, total)
 * @returns Created sale with generated ID and timestamps
 */
export async function createSale(
  data: Omit<NewSale, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'sync_status'>
): Promise<Sale> {
  await ensureDBReady();
  const db = getDB();
  
  const newSale: NewSale = {
    id: uuid.v4() as string,
    ...data,
    sync_status: 'pending',
  };

  await db.insert(sales).values(newSale);
  
  // Fetch and return the created sale
  const created = await db
    .select()
    .from(sales)
    .where(eq(sales.id, newSale.id))
    .limit(1);
    
  return created[0];
}

/**
 * Get all active (non-deleted) sales from the database.
 * 
 * Returns sales ordered by creation date (newest first).
 * Does NOT include product information - use getAllSalesWithProducts() for that.
 * Excludes soft-deleted sales (deleted_at IS NOT NULL).
 * 
 * @returns Array of all active sales
 */
export async function getAllSales(): Promise<Sale[]> {
  await ensureDBReady();
  const db = getDB();
  
  const result = await db
    .select()
    .from(sales)
    .where(isNull(sales.deleted_at));
    
  return result;
}

/**
 * Get all active (non-deleted) sales with product information included.
 * 
 * Performs a LEFT JOIN with products table to include product details.
 * This is the preferred method for displaying sales in the UI.
 * Excludes soft-deleted sales and products.
 * 
 * @returns Array of sales with product details
 */
export async function getAllSalesWithProducts(): Promise<SaleWithProduct[]> {
  await ensureDBReady();
  const db = getDB();
  
  // Perform JOIN query to get sales with product information
  // Exclude soft-deleted sales AND products
  const result = await db
    .select({
      id: sales.id,
      product_id: sales.product_id,
      quantity: sales.quantity,
      total: sales.total,
      created_at: sales.created_at,
      updated_at: sales.updated_at,
      deleted_at: sales.deleted_at,
      sync_status: sales.sync_status,
      product: {
        id: products.id,
        name: products.name,
        price: products.price,
      },
    })
    .from(sales)
    .leftJoin(products, eq(sales.product_id, products.id))
    .where(sql`${sales.deleted_at} IS NULL AND ${products.deleted_at} IS NULL`);
    
  return result as SaleWithProduct[];
}

/**
 * Get a single sale by ID.
 * 
 * @param id - Sale UUID
 * @param includeDeleted - If true, include soft-deleted sales
 * @returns Sale if found, undefined otherwise
 */
export async function getSaleById(
  id: string,
  includeDeleted = false
): Promise<Sale | undefined> {
  await ensureDBReady();
  const db = getDB();
  
  const query = db
    .select()
    .from(sales)
    .where(eq(sales.id, id))
    .limit(1);
  
  // Only filter deleted if not including them
  const result = includeDeleted
    ? await query
    : await db
        .select()
        .from(sales)
        .where(sql`${sales.id} = ${id} AND ${sales.deleted_at} IS NULL`)
        .limit(1);
    
  return result[0];
}

/**
 * Get all sales for a specific product.
 * 
 * Useful for viewing sales history of a particular product.
 * Excludes soft-deleted sales.
 * 
 * @param productId - Product UUID
 * @returns Array of sales for the product
 */
export async function getSalesByProductId(productId: string): Promise<Sale[]> {
  await ensureDBReady();
  const db = getDB();
  
  const result = await db
    .select()
    .from(sales)
    .where(sql`${sales.product_id} = ${productId} AND ${sales.deleted_at} IS NULL`);
    
  return result;
}

/**
 * Update a sale's information.
 * 
 * Automatically updates the updated_at timestamp and sets sync_status='pending'.
 * 
 * @param id - Sale UUID
 * @param data - Fields to update
 * @returns Updated sale
 */
export async function updateSale(
  id: string,
  data: Partial<Omit<Sale, 'id' | 'created_at' | 'deleted_at'>>
): Promise<Sale> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(sales)
    .set({
      ...data,
      updated_at: new Date().toISOString(),
      sync_status: 'pending', // Mark as unsynced when updated
    })
    .where(eq(sales.id, id));
    
  const updated = await getSaleById(id);
  if (!updated) {
    throw new Error(`Sale ${id} not found after update`);
  }
  
  return updated;
}

/**
 * Soft delete a sale (set deleted_at timestamp).
 * 
 * SOFT DELETE allows:
 * - Backend sync of deletions
 * - Data recovery if needed
 * - Audit trail preservation
 * 
 * @param id - Sale UUID
 */
export async function deleteSale(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(sales)
    .set({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: 'pending', // Need to sync deletion
    })
    .where(eq(sales.id, id));
}

/**
 * Hard delete a sale (permanently remove from database).
 * 
 * USE WITH CAUTION: Only for cleanup after backend sync confirmation.
 * 
 * @param id - Sale UUID
 */
export async function hardDeleteSale(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db.delete(sales).where(eq(sales.id, id));
}

/**
 * Get all unsynced sales (pending sync).
 * 
 * Used for future sync implementation with Laravel backend.
 * Includes both new/updated records AND soft-deleted records.
 * 
 * @returns Array of sales where sync_status='pending'
 */
export async function getUnsyncedSales(): Promise<Sale[]> {
  await ensureDBReady();
  const db = getDB();
  
  const result = await db
    .select()
    .from(sales)
    .where(eq(sales.sync_status, 'pending'));
    
  return result;
}

/**
 * Mark a sale as synced.
 * 
 * Called after successful sync with backend.
 * 
 * @param id - Sale UUID
 */
export async function markSaleAsSynced(id: string): Promise<void> {
  await ensureDBReady();
  const db = getDB();
  
  await db
    .update(sales)
    .set({ sync_status: 'synced' })
    .where(eq(sales.id, id));
}
