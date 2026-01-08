/**
 * App Entry Point
 *
 * CRITICAL ARCHITECTURE RULES:
 * 1. Initialize database ONCE at app startup (before any screens render)
 * 2. NEVER initialize database in screens or components
 * 3. Use loading screen while database initializes
 * 4. Handle initialization errors gracefully
 *
 * This ensures:
 * - Single database connection throughout app lifecycle
 * - No race conditions on navigation
 * - Clean error handling
 * - Proper separation of concerns
 */

import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { initializeDatabase } from "./src/db/client";
import ProductsScreen from "./src/screens/ProductsScreen";
import SalesScreen from "./src/screens/SalesScreen";

const Tab = createBottomTabNavigator();

export default function App() {
  const [isDBReady, setIsDBReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  /**
   * Initialize database on app startup.
   *
   * This runs ONCE when the app starts, before any screens are rendered.
   * The database connection persists for the entire app lifecycle.
   */
  useEffect(() => {
    async function initialize() {
      try {
        console.log("[App] Starting - initializing database...");
        await initializeDatabase();
        console.log("[App] Database ready");
        setIsDBReady(true);
      } catch (error) {
        console.error("[App] Failed to initialize database:", error);
        setInitError(
          error instanceof Error
            ? error.message
            : "Failed to initialize database"
        );
      }
    }

    initialize();
  }, []); // Empty deps = runs ONCE on mount

  /**
   * Show loading screen while database initializes.
   */
  if (!isDBReady && !initError) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  /**
   * Show error screen if database initialization fails.
   */
  if (initError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Database Error</Text>
        <Text style={styles.errorText}>{initError}</Text>
        <Text style={styles.errorHint}>Please restart the app</Text>
      </View>
    );
  }

  /**
   * Render main app with navigation once database is ready.
   */
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#999",
          headerStyle: {
            backgroundColor: "#007AFF",
          },
          headerTintColor: "#fff",
          headerTitleStyle: {
            fontWeight: "bold",
          },
        }}
      >
        <Tab.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            tabBarLabel: "Products",
            title: "Products",
          }}
        />
        <Tab.Screen
          name="Sales"
          component={SalesScreen}
          options={{
            tabBarLabel: "Sales",
            title: "Sales",
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#c62828",
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
