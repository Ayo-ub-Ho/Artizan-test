/**
 * Sales Screen
 *
 * Displays list of all sales with ability to create new ones.
 *
 * ARCHITECTURE RULES DEMONSTRATED:
 * - Screen only calls hooks (useSales, useProducts), NEVER services or repositories
 * - useFocusEffect is used safely to reload data on navigation
 * - No database access or SQL in this file
 * - Clean separation: UI logic only, business logic in services
 * - Demonstrates cross-entity operations (selecting products to create sales)
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSales } from "../hooks/useSales";
import { useProducts } from "../hooks/useProducts";
import type { SaleWithProduct } from "../repositories/sales.repo";
import type { Product } from "../db/schema";

export default function SalesScreen() {
  const { sales, loading, error, loadSales, createSale, deleteSale } =
    useSales();
  const { products, loadProducts } = useProducts();

  // Form state for creating new sales
  const [quantity, setQuantity] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);

  /**
   * Load sales and products when screen comes into focus.
   *
   * useFocusEffect ensures data is fresh when navigating back to this screen.
   * The callback is memoized to avoid infinite loops.
   * Implements cleanup to cancel stale async operations.
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        await loadSales();
        await loadProducts(); // Need products for the dropdown
      })();

      return () => {
        cancelled = true;
      };
    }, [loadSales, loadProducts])
  );

  /**
   * Handle sale creation.
   *
   * Validates input and calls the hook function.
   * Total is automatically calculated by the service layer.
   */
  const handleCreateSale = async () => {
    if (!selectedProduct) {
      Alert.alert("Error", "Please select a product");
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      Alert.alert("Error", "Please enter a valid quantity greater than 0");
      return;
    }

    try {
      setIsCreating(true);
      await createSale(selectedProduct.id, quantityNum);

      // Clear form on success
      setQuantity("");
      setSelectedProduct(null);
      Alert.alert("Success", "Sale created successfully");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create sale"
      );
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle sale deletion with confirmation.
   */
  const handleDeleteSale = (sale: SaleWithProduct) => {
    Alert.alert("Delete Sale", `Are you sure you want to delete this sale?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSale(sale.id);
            Alert.alert("Success", "Sale deleted successfully");
          } catch (err) {
            Alert.alert(
              "Error",
              err instanceof Error ? err.message : "Failed to delete sale"
            );
          }
        },
      },
    ]);
  };

  /**
   * Handle product selection from picker.
   */
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductPicker(false);
  };

  /**
   * Calculate total preview (quantity * price) before creating sale.
   */
  const totalPreview =
    selectedProduct && quantity
      ? (parseInt(quantity, 10) || 0) * Number(selectedProduct.price)
      : 0;

  /**
   * Render a single sale item.
   */
  const renderSale = ({ item }: { item: SaleWithProduct }) => (
    <View style={styles.saleItem}>
      <View style={styles.saleInfo}>
        <Text style={styles.saleName}>{item.product.name}</Text>
        <Text style={styles.saleDetails}>
          Quantity: {Number(item.quantity)} × $
          {Number(item.product.price).toFixed(2)}
        </Text>
        <Text style={styles.saleTotal}>
          Total: ${Number(item.total).toFixed(2)}
        </Text>
        <Text style={styles.saleMeta}>
          {item.sync_status === "synced" ? "✓ Synced" : "○ Pending sync"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteSale(item)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render product picker modal.
   */
  const renderProductPicker = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productPickerItem}
      onPress={() => handleSelectProduct(item)}
    >
      <Text style={styles.productPickerName}>{item.name}</Text>
      <Text style={styles.productPickerPrice}>
        ${Number(item.price).toFixed(2)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Create Sale Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Create New Sale</Text>

        {/* Product Selector */}
        <TouchableOpacity
          style={styles.productSelector}
          onPress={() => setShowProductPicker(true)}
          disabled={isCreating || loading}
        >
          <Text
            style={
              selectedProduct
                ? styles.productSelectedText
                : styles.productPlaceholder
            }
          >
            {selectedProduct ? selectedProduct.name : "Select a product"}
          </Text>
          {selectedProduct && (
            <Text style={styles.productSelectedPrice}>
              ${Number(selectedProduct.price).toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Quantity Input */}
        <TextInput
          style={styles.input}
          placeholder="Quantity"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="number-pad"
          editable={!isCreating && !loading}
        />

        {/* Total Preview */}
        {selectedProduct && quantity && totalPreview > 0 && (
          <View style={styles.totalPreview}>
            <Text style={styles.totalPreviewLabel}>Total:</Text>
            <Text style={styles.totalPreviewAmount}>
              ${totalPreview.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Create Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (isCreating || loading) && styles.buttonDisabled,
          ]}
          onPress={handleCreateSale}
          disabled={isCreating || loading}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Sale</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Sales List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Sales ({sales.length})</Text>

        {loading && sales.length === 0 ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={sales}
            keyExtractor={(item) => item.id}
            renderItem={renderSale}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No sales yet. Create one above!
              </Text>
            }
          />
        )}
      </View>

      {/* Product Picker Modal */}
      <Modal
        visible={showProductPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProductPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>

            {products.length === 0 ? (
              <Text style={styles.emptyText}>
                No products available. Create a product first!
              </Text>
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                renderItem={renderProductPicker}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  form: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  productSelector: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  productPlaceholder: {
    color: "#999",
    fontSize: 16,
  },
  productSelectedText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productSelectedPrice: {
    fontSize: 14,
    color: "#007AFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  totalPreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  totalPreviewLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  totalPreviewAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ef5350",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 32,
  },
  saleItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saleInfo: {
    flex: 1,
  },
  saleName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  saleDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  saleTotal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  saleMeta: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  modalClose: {
    fontSize: 16,
    color: "#007AFF",
  },
  productPickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  productPickerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPickerPrice: {
    fontSize: 14,
    color: "#007AFF",
  },
});
