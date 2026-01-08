/**
 * Sales Service
 * 
 * This layer contains business logic for sales operations.
 * It acts as an intermediary between UI (hooks/components) and data layer (repositories).
 * 
 * WHY THIS EXISTS:
 * - Business logic isolation: validation, calculations (e.g., total = quantity * price)
 * - Transaction management: coordinate multiple repository calls
 * - Future sync logic: handle online/offline states, conflict resolution
 * - Error handling: standardize error responses for UI
 * 
 * RULES:
 * - Services call repositories, NEVER getDB() directly
 * - Hooks call services, NEVER repositories directly
 * - Services can call other services if needed
 * - Services handle business validation and calculations
 */

import * as salesRepo from '../repositories/sales.repo';
import * as productsRepo from '../repositories/products.repo';
import type { Sale } from '../db/schema';
import type { SaleWithProduct } from '../repositories/sales.repo';

/**
 * Create a new sale with automatic total calculation.
 * 
 * Business rules:
 * - Product must exist
 * - Quantity must be greater than 0
 * - Total is automatically calculated (quantity * product price)
 * 
 * @param productId - Product UUID
 * @param quantity - Number of units sold
 * @returns Created sale
 * @throws Error if validation fails or product not found
 */
export async function createSale(
  productId: string,
  quantity: number
): Promise<Sale> {
  // Business validation
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  try {
    // Verify product exists and get its price
    const product = await productsRepo.getProductById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    // Calculate total (business logic)
    const total = quantity * product.price;
    
    // Create the sale
    const sale = await salesRepo.createSale({
      product_id: productId,
      quantity,
      total,
    });
    
    return sale;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Product not found') {
        throw error;
      }
      console.error('Failed to create sale:', error);
    }
    throw new Error('Failed to create sale. Please try again.');
  }
}

/**
 * Get all sales without product information.
 * 
 * Use getAllSalesWithProducts() if you need product details.
 * 
 * @returns Array of sales
 */
export async function getAllSales(): Promise<Sale[]> {
  try {
    return await salesRepo.getAllSales();
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    throw new Error('Failed to load sales. Please try again.');
  }
}

/**
 * Get all sales with product information included.
 * 
 * This is the preferred method for displaying sales in UI
 * as it includes product name and price.
 * 
 * @returns Array of sales with product details
 */
export async function getAllSalesWithProducts(): Promise<SaleWithProduct[]> {
  try {
    return await salesRepo.getAllSalesWithProducts();
  } catch (error) {
    console.error('Failed to fetch sales with products:', error);
    throw new Error('Failed to load sales. Please try again.');
  }
}

/**
 * Get a single sale by ID.
 * 
 * @param id - Sale UUID
 * @returns Sale if found
 * @throws Error if sale not found
 */
export async function getSaleById(id: string): Promise<Sale> {
  try {
    const sale = await salesRepo.getSaleById(id);
    
    if (!sale) {
      throw new Error('Sale not found');
    }
    
    return sale;
  } catch (error) {
    console.error('Failed to fetch sale:', error);
    throw new Error('Failed to load sale. Please try again.');
  }
}

/**
 * Get all sales for a specific product.
 * 
 * Useful for viewing sales history of a product.
 * 
 * @param productId - Product UUID
 * @returns Array of sales for the product
 */
export async function getSalesByProductId(productId: string): Promise<Sale[]> {
  try {
    return await salesRepo.getSalesByProductId(productId);
  } catch (error) {
    console.error('Failed to fetch sales for product:', error);
    throw new Error('Failed to load product sales. Please try again.');
  }
}

/**
 * Update a sale with recalculation if needed.
 * 
 * Business rules:
 * - If quantity changes, recalculate total using current product price
 * - Quantity must be greater than 0 if provided
 * 
 * @param id - Sale UUID
 * @param updates - Fields to update
 * @returns Updated sale
 * @throws Error if validation fails
 */
export async function updateSale(
  id: string,
  updates: { product_id?: string; quantity?: number }
): Promise<Sale> {
  // Business validation
  if (updates.quantity !== undefined && updates.quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  try {
    // Get current sale to check what needs updating
    const currentSale = await salesRepo.getSaleById(id);
    if (!currentSale) {
      throw new Error('Sale not found');
    }
    
    const updateData: any = {};
    
    // Determine which product to use for price calculation
    const productId = updates.product_id || currentSale.product_id;
    const product = await productsRepo.getProductById(productId);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    if (updates.product_id !== undefined) {
      updateData.product_id = updates.product_id;
    }
    
    if (updates.quantity !== undefined) {
      updateData.quantity = updates.quantity;
    }
    
    // Recalculate total if quantity or product changed
    if (updates.quantity !== undefined || updates.product_id !== undefined) {
      const quantity = updates.quantity !== undefined ? updates.quantity : currentSale.quantity;
      updateData.total = quantity * product.price;
    }
    
    return await salesRepo.updateSale(id, updateData);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Sale not found' || error.message === 'Product not found') {
        throw error;
      }
    }
    console.error('Failed to update sale:', error);
    throw new Error('Failed to update sale. Please try again.');
  }
}

/**
 * Delete a sale.
 * 
 * @param id - Sale UUID
 */
export async function deleteSale(id: string): Promise<void> {
  try {
    await salesRepo.deleteSale(id);
  } catch (error) {
    console.error('Failed to delete sale:', error);
    throw new Error('Failed to delete sale. Please try again.');
  }
}

/**
 * Get all sales that need to be synced.
 * 
 * Used for future backend sync implementation.
 * 
 * @returns Array of unsynced sales
 */
export async function getUnsyncedSales(): Promise<Sale[]> {
  try {
    return await salesRepo.getUnsyncedSales();
  } catch (error) {
    console.error('Failed to fetch unsynced sales:', error);
    throw new Error('Failed to load unsynced sales.');
  }
}

/**
 * Sync sales with backend (placeholder).
 * 
 * Future implementation:
 * 1. Get all unsynced sales
 * 2. Send to Laravel backend via API
 * 3. Handle conflicts (server wins, client wins, or merge)
 * 4. Mark as synced after successful upload
 * 
 * @returns Number of sales synced
 */
export async function syncSales(): Promise<number> {
  // TODO: Implement when Laravel backend is ready
  console.log('Sync not implemented yet');
  return 0;
}
