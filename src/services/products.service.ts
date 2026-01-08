/**
 * Products Service
 * 
 * This layer contains business logic for product operations.
 * It acts as an intermediary between UI (hooks/components) and data layer (repositories).
 * 
 * WHY THIS EXISTS:
 * - Business logic isolation: validation, calculations, complex operations
 * - Transaction management: coordinate multiple repository calls
 * - Future sync logic: handle online/offline states, conflict resolution
 * - Error handling: standardize error responses for UI
 * 
 * RULES:
 * - Services call repositories, NEVER getDB() directly
 * - Hooks call services, NEVER repositories directly
 * - Services can call other services if needed
 * - Services handle business validation (e.g., price > 0)
 */

import * as productsRepo from '../repositories/products.repo';
import type { Product } from '../db/schema';

/**
 * Create a new product with validation.
 * 
 * Business rules:
 * - Name must not be empty
 * - Price must be greater than 0
 * 
 * @param name - Product name
 * @param price - Product price
 * @returns Created product
 * @throws Error if validation fails
 */
export async function createProduct(
  name: string,
  price: number
): Promise<Product> {
  // Business validation
  if (!name || name.trim().length === 0) {
    throw new Error('Product name is required');
  }
  
  if (price <= 0) {
    throw new Error('Product price must be greater than 0');
  }

  try {
    const product = await productsRepo.createProduct({
      name: name.trim(),
      price,
    });
    
    return product;
  } catch (error) {
    console.error('Failed to create product:', error);
    throw new Error('Failed to create product. Please try again.');
  }
}

/**
 * Get all products.
 * 
 * Returns all products ordered by creation date.
 * 
 * @returns Array of products
 */
export async function getAllProducts(): Promise<Product[]> {
  try {
    return await productsRepo.getAllProducts();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Failed to load products. Please try again.');
  }
}

/**
 * Get a single product by ID.
 * 
 * @param id - Product UUID
 * @returns Product if found
 * @throws Error if product not found
 */
export async function getProductById(id: string): Promise<Product> {
  try {
    const product = await productsRepo.getProductById(id);
    
    if (!product) {
      throw new Error('Product not found');
    }
    
    return product;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    throw new Error('Failed to load product. Please try again.');
  }
}

/**
 * Update a product with validation.
 * 
 * Business rules:
 * - Name must not be empty if provided
 * - Price must be greater than 0 if provided
 * 
 * @param id - Product UUID
 * @param updates - Fields to update
 * @returns Updated product
 * @throws Error if validation fails
 */
export async function updateProduct(
  id: string,
  updates: { name?: string; price?: number }
): Promise<Product> {
  // Business validation
  if (updates.name !== undefined && updates.name.trim().length === 0) {
    throw new Error('Product name cannot be empty');
  }
  
  if (updates.price !== undefined && updates.price <= 0) {
    throw new Error('Product price must be greater than 0');
  }

  try {
    const updateData: any = {};
    
    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    
    if (updates.price !== undefined) {
      updateData.price = updates.price;
    }
    
    return await productsRepo.updateProduct(id, updateData);
  } catch (error) {
    console.error('Failed to update product:', error);
    throw new Error('Failed to update product. Please try again.');
  }
}

/**
 * Delete a product.
 * 
 * In future: check for related sales and handle appropriately
 * (e.g., prevent deletion or cascade delete).
 * 
 * @param id - Product UUID
 */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await productsRepo.deleteProduct(id);
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw new Error('Failed to delete product. Please try again.');
  }
}

/**
 * Get all products that need to be synced.
 * 
 * Used for future backend sync implementation.
 * 
 * @returns Array of unsynced products
 */
export async function getUnsyncedProducts(): Promise<Product[]> {
  try {
    return await productsRepo.getUnsyncedProducts();
  } catch (error) {
    console.error('Failed to fetch unsynced products:', error);
    throw new Error('Failed to load unsynced products.');
  }
}

/**
 * Sync products with backend (placeholder).
 * 
 * Future implementation:
 * 1. Get all unsynced products
 * 2. Send to Laravel backend via API
 * 3. Handle conflicts (server wins, client wins, or merge)
 * 4. Mark as synced after successful upload
 * 
 * @returns Number of products synced
 */
export async function syncProducts(): Promise<number> {
  // TODO: Implement when Laravel backend is ready
  console.log('Sync not implemented yet');
  return 0;
}
