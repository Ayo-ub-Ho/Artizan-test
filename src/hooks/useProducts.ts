/**
 * useProducts Hook
 * 
 * Custom React hook for managing products in components.
 * Provides a clean interface for product operations with loading/error states.
 * 
 * WHY THIS EXISTS:
 * - React integration: manages state, loading, and errors automatically
 * - Reusability: same logic used across multiple screens
 * - Separation: screens don't know about services, only hooks
 * - Safe navigation: works with useFocusEffect without race conditions
 * 
 * RULES:
 * - Hooks call services, NEVER repositories or getDB() directly
 * - Screens call hooks, NEVER services directly
 * - Use with useFocusEffect to reload data when screen comes into focus
 * - Always implement cleanup to cancel stale async operations
 */

import { useState, useCallback } from 'react';
import * as productsService from '../services/products.service';
import type { Product } from '../db/schema';

/**
 * Custom hook for managing products.
 * 
 * Provides functions to:
 * - Load all products
 * - Create new products
 * - Update existing products
 * - Delete products
 * 
 * Automatically manages loading and error states.
 * Implements proper cleanup to prevent race conditions.
 * 
 * @returns Object with products data and CRUD functions
 * 
 * @example
 * ```tsx
 * function ProductsScreen() {
 *   const { products, loading, error, loadProducts, createProduct } = useProducts();
 *   
 *   useFocusEffect(
 *     useCallback(() => {
 *       let cancelled = false;
 *       
 *       (async () => {
 *         const result = await loadProducts();
 *         if (!cancelled && !result.cancelled) {
 *           // Data loaded successfully
 *         }
 *       })();
 *       
 *       return () => {
 *         cancelled = true;
 *       };
 *     }, [loadProducts])
 *   );
 *   
 *   // ... rest of component
 * }
 * ```
 */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all products from database.
   * 
   * Call this in useFocusEffect to refresh data when screen appears.
   * Supports cancellation to prevent race conditions.
   * 
   * @returns Object with cancelled flag for cleanup handling
   */
  const loadProducts = useCallback(async (): Promise<{ cancelled: boolean }> => {
    let cancelled = false;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await productsService.getAllProducts();
      
      // Only update state if not cancelled
      if (!cancelled) {
        setProducts(data);
      }
    } catch (err) {
      if (!cancelled) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load products';
        setError(errorMessage);
        console.error('Error loading products:', err);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    
    return { cancelled };
  }, []);

  /**
   * Create a new product.
   * 
   * Automatically reloads the product list after successful creation.
   * 
   * @param name - Product name
   * @param price - Product price
   * @throws Error if creation fails
   */
  const createProduct = useCallback(async (name: string, price: number) => {
    try {
      setLoading(true);
      setError(null);
      
      await productsService.createProduct(name, price);
      
      // Reload products to include the new one
      await loadProducts();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      setError(errorMessage);
      throw err; // Re-throw so UI can handle it
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  /**
   * Update an existing product.
   * 
   * Automatically reloads the product list after successful update.
   * 
   * @param id - Product UUID
   * @param updates - Fields to update
   * @throws Error if update fails
   */
  const updateProduct = useCallback(
    async (id: string, updates: { name?: string; price?: number }) => {
      try {
        setLoading(true);
        setError(null);
        
        await productsService.updateProduct(id, updates);
        
        // Reload products to reflect the changes
        await loadProducts();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update product';
        setError(errorMessage);
        throw err; // Re-throw so UI can handle it
      } finally {
        setLoading(false);
      }
    },
    [loadProducts]
  );

  /**
   * Delete a product.
   * 
   * Automatically reloads the product list after successful deletion.
   * 
   * @param id - Product UUID
   * @throws Error if deletion fails
   */
  const deleteProduct = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        
        await productsService.deleteProduct(id);
        
        // Reload products to reflect the deletion
        await loadProducts();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete product';
        setError(errorMessage);
        throw err; // Re-throw so UI can handle it
      } finally {
        setLoading(false);
      }
    },
    [loadProducts]
  );

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
