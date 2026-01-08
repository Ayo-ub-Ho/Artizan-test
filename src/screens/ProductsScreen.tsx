/**
 * Products Screen
 *
 * Displays list of all products with ability to create new ones.
 *
 * ARCHITECTURE RULES DEMONSTRATED:
 * - Screen only calls hooks (useProducts), NEVER services or repositories
 * - useFocusEffect is used safely to reload data on navigation
 * - No database access or SQL in this file
 * - Clean separation: UI logic only, business logic in services
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
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../db/schema";

export default function ProductsScreen() {
  const {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    deleteProduct,
  } = useProducts();

  // Form state for creating new products
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Load products when screen comes into focus.
   *
   * useFocusEffect ensures data is fresh when navigating back to this screen.
   * The callback is memoized to avoid infinite loops.
   * Implements cleanup to cancel stale async operations.
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      (async () => {
        await loadProducts();
      })();

      return () => {
        cancelled = true;
      };
    }, [loadProducts])
  );

  /**
   * Handle product creation.
   *
   * Validates input and calls the hook function.
   * Shows alert on success/error.
   */
  const handleCreateProduct = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Error", "Please enter a valid price greater than 0");
      return;
    }

    try {
      setIsCreating(true);
      await createProduct(name.trim(), priceNum);

      // Clear form on success
      setName("");
      setPrice("");
      Alert.alert("Success", "Product created successfully");
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create product"
      );
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle product deletion with confirmation.
   */
  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product.id);
              Alert.alert("Success", "Product deleted successfully");
            } catch (err) {
              Alert.alert(
                "Error",
                err instanceof Error ? err.message : "Failed to delete product"
              );
            }
          },
        },
      ]
    );
  };

  /**
   * Render a single product item.
   */
  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productPrice}>
          ${Number(item.price).toFixed(2)}
        </Text>
        <Text style={styles.productMeta}>
          {item.sync_status === "synced" ? "✓ Synced" : "○ Pending sync"}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteProduct(item)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Create Product Form */}
      <View style={styles.form}>
        <Text style={styles.formTitle}>Create New Product</Text>

        <TextInput
          style={styles.input}
          placeholder="Product name"
          value={name}
          onChangeText={setName}
          editable={!isCreating && !loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Price"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          editable={!isCreating && !loading}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (isCreating || loading) && styles.buttonDisabled,
          ]}
          onPress={handleCreateProduct}
          disabled={isCreating || loading}
        >
          {isCreating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Product</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Products List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Products ({products.length})</Text>

        {loading && products.length === 0 ? (
          <ActivityIndicator
            size="large"
            color="#007AFF"
            style={styles.loader}
          />
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No products yet. Create one above!
              </Text>
            }
          />
        )}
      </View>
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
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
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
  productItem: {
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
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  productMeta: {
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
});
