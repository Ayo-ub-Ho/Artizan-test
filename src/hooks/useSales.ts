/**
 * useSales Hook
 * 
 * Custom React hook for managing sales in components.
 * Provides a clean interface for sales operations with loading/error states.
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
import * as salesService from '../services/sales.service';
import type { Sale } from '../db/schema';
import type { SaleWithProduct } from '../repositories/sales.repo';

/**
 * Custom hook for managing sales.
 * 
 * Provides functions to:
 * - Load all sales (with or without product details)
 * - Create new sales
 * - Update existing sales
 * - Delete sales
 * 
 * Automatically manages loading and error states.
 * Implements proper cleanup to prevent race conditions.
 * 
 * @returns Object with sales data and CRUD functions
 * 
 * @example
 * ```tsx
 * function SalesScreen() {
 *   const { sales, loading, error, loadSales, createSale } = useSales();
 *   
 *   useFocusEffect(
 *     useCallback(() => {
 *       let cancelled = false;
 *       
 *       (async () => {
 *         const result = await loadSales();
 *         if (!cancelled && !result.cancelled) {
 *           // Data loaded successfully
 *         }
 *       })();
 *       
 *       return () => {
 *         cancelled = true;
 *       };
 *     }, [loadSales])
 *   );
 *   
 *   // ... rest of component
 * }
 * ```
 */
export function useSales() {
  const [sales, setSales] = useState<SaleWithProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load all sales with product information from database.
   * 
   * Call this in useFocusEffect to refresh data when screen appears.
   * Includes product details (name, price) for each sale.
   * Supports cancellation to prevent race conditions.
   * 
   * @returns Object with cancelled flag for cleanup handling
   */
  const loadSales = useCallback(async (): Promise<{ cancelled: boolean }> => {
    let cancelled = false;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await salesService.getAllSalesWithProducts();
      
      // Only update state if not cancelled
      if (!cancelled) {
        setSales(data);
      }
    } catch (err) {
      if (!cancelled) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load sales';
        setError(errorMessage);
        console.error('Error loading sales:', err);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
    
    return { cancelled };
  }, []);

  /**
   * Create a new sale.
   * 
   * Automatically calculates the total (quantity * product price).
   * Reloads the sales list after successful creation.
   * 
   * @param productId - Product UUID
   * @param quantity - Number of units sold
   * @throws Error if creation fails or product not found
   */
  const createSale = useCallback(
    async (productId: string, quantity: number) => {
      try {
        setLoading(true);
        setError(null);
        
        await salesService.createSale(productId, quantity);
        
        // Reload sales to include the new one
        await loadSales();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create sale';
        setError(errorMessage);
        throw err; // Re-throw so UI can handle it
      } finally {
        setLoading(false);
      }
    },
    [loadSales]
  );

  /**
   * Update an existing sale.
   * 
   * Automatically recalculates total if quantity or product changes.
   * Reloads the sales list after successful update.
   * 
   * @param id - Sale UUID
   * @param updates - Fields to update
   * @throws Error if update fails
   */
  const updateSale = useCallback(
    async (id: string, updates: { product_id?: string; quantity?: number }) => {
      try {
        setLoading(true);
        setError(null);
        
        await salesService.updateSale(id, updates);
        
        // Reload sales to reflect the changes
        await loadSales();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update sale';
        setError(errorMessage);
        throw err; // Re-throw so UI can handle it
      } finally {
        setLoading(false);
      }
    },
    [loadSales]
  );

  /**
   * Delete a sale.
   * 
   * Automatically reloads the sales list after successful deletion.
   * 
   * @param id - Sale UUID
   * @throws Error if deletion fails
   */
  const deleteSale = useCallback(
    async (id: string) => {
      try {
        setLoading(true);
        setError(null);
        
        await salesService.deleteSale(id);
        
        // Reload sales to reflect the deletion
        await loadSales();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete sale';
        setError(errorMessage);
        throw err; // Re-throw so UI can handle it
      } finally {
        setLoading(false);
      }
    },
    [loadSales]
  );

  /**
   * Get sales for a specific product.
   * 
   * Useful for viewing sales history of a product.
   * 
   * @param productId - Product UUID
   * @returns Array of sales for the product
   */
  const getSalesByProduct = useCallback(async (productId: string): Promise<Sale[]> => {
    try {
      return await salesService.getSalesByProductId(productId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load product sales';
      console.error('Error loading product sales:', err);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    sales,
    loading,
    error,
    loadSales,
    createSale,
    updateSale,
    deleteSale,
    getSalesByProduct,
  };
}
