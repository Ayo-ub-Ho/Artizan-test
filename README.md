# Artizan Test - Offline-First React Native App

A small Expo (React Native) application demonstrating clean offline-first architecture using Drizzle ORM + SQLite, with a sync-ready structure for future Laravel/MySQL backend integration.

> **🆕 Recently Refactored**: Database architecture has been completely refactored for better stability and maintainability. See [REFACTORING_SUMMARY.md](REFACTORING_SUMMARY.md) and [BEFORE_AFTER.md](BEFORE_AFTER.md) for details.

## 🎯 Project Goals

- **Offline-first**: All data stored locally in SQLite
- **Clean architecture**: Proper separation of concerns (Repository → Service → Hook → Screen)
- **Sync-ready**: Prepared for future backend synchronization
- **Type-safe**: Full TypeScript implementation
- **No raw SQL in UI**: Database logic properly abstracted
- **Production-ready**: Refactored with best practices and centralized database management

## 📱 Features

### Products

- Create products (name, price)
- List all products
- Delete products
- Track sync status

### Sales

- Create sales (select product, enter quantity)
- Auto-calculate total (quantity × price)
- List all sales with product details
- Delete sales
- Track sync status

## 🏗️ Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│         React Components            │  ← UI Layer (Screens)
│  - ProductsScreen.tsx               │
│  - SalesScreen.tsx                  │
└──────────────┬──────────────────────┘
               │ calls
┌──────────────▼──────────────────────┐
│         Custom Hooks                │  ← React Integration Layer
│  - useProducts.ts                   │
│  - useSales.ts                      │
└──────────────┬──────────────────────┘
               │ calls
┌──────────────▼──────────────────────┐
│         Services                    │  ← Business Logic Layer
│  - products.service.ts              │     (validation, calculations)
│  - sales.service.ts                 │
└──────────────┬──────────────────────┘
               │ calls
┌──────────────▼──────────────────────┐
│         Repositories                │  ← Data Access Layer
│  - products.repo.ts                 │     (Drizzle ORM operations)
│  - sales.repo.ts                    │
└──────────────┬──────────────────────┘
               │ uses
┌──────────────▼──────────────────────┐
│         Database                    │  ← Storage Layer
│  - db/client.ts (connection)       │
│  - db/schema.ts (tables)            │
│  - db/migrations.ts (SQL)           │
└─────────────────────────────────────┘
```

### Why Each Layer Exists

#### **1. Database Layer** (`src/db/`)

- **Purpose**: Manage SQLite connection, schema, and migrations
- **Files**:
  - `client.ts`: Singleton connection manager
  - `schema.ts`: All table definitions in one place
  - `migrations.ts`: Database schema creation/updates
- **Rules**:
  - Initialize ONCE at app startup
  - Export singleton database instance
  - Handle migrations idempotently
- **Why**: Prevents connection leaks, ensures single source of truth, clean separation

#### **2. Repository Layer** (`src/repositories/`)

- **Purpose**: Abstract all direct database access
- **Rules**:
  - ONLY layer that imports `getDB()`
  - Converts Drizzle queries to clean APIs
  - Handles basic CRUD operations
- **Why**: Isolates database logic, makes testing easier, enables database swapping

#### **3. Service Layer** (`src/services/`)

- **Purpose**: Business logic and validation
- **Rules**:
  - Calls repositories, NEVER `getDB()` directly
  - Validates input (e.g., price > 0)
  - Performs calculations (e.g., total = quantity × price)
  - Coordinates multiple repository calls
- **Why**: Keeps business rules separate from data access and UI

#### **4. Hook Layer** (`src/hooks/`)

- **Purpose**: React integration with loading/error states
- **Rules**:
  - Calls services, NEVER repositories directly
  - Manages React state (useState, useCallback)
  - Handles async operations safely
- **Why**: Provides reusable React-friendly APIs, prevents duplication

#### **5. Screen Layer** (`src/screens/`)

- **Purpose**: UI and user interactions
- **Rules**:
  - Calls hooks, NEVER services or repositories
  - No database logic or SQL
  - Only presentation and event handling
- **Why**: Pure UI components, easy to redesign without touching business logic

## 📂 Project Structure

```
src/
├── db/
│   ├── index.ts              # SQLite + Drizzle singleton
│   ├── schema/
│   │   ├── products.ts       # Products table schema
│   │   └── sales.ts          # Sales table schema
│   └── migrations/           # Future migration files
│
├── repositories/
│   ├── products.repo.ts      # Products data access
│   └── sales.repo.ts         # Sales data access
│
├── services/
│   ├── products.service.ts   # Products business logic
│   └── sales.service.ts      # Sales business logic
│
├── hooks/
│   ├── useProducts.ts        # Products React integration
│   └── useSales.ts           # Sales React integration
│
└── screens/
    ├── ProductsScreen.tsx    # Products UI
    └── SalesScreen.tsx       # Sales UI
```

## 🗄️ Database Schema

### Products Table

```typescript
{
  id: string; // UUID (primary key)
  name: string; // Product name
  price: number; // Product price
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  synced: number; // 0 = not synced, 1 = synced
}
```

### Sales Table

```typescript
{
  id: string; // UUID (primary key)
  product_id: string; // Foreign key to products.id
  quantity: number; // Number of units sold
  total: number; // Calculated: quantity × price
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  synced: number; // 0 = not synced, 1 = synced
}
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Expo CLI (optional, uses npx)

### Installation

1. Clone or navigate to the project:

```bash
cd Artizan-test
```

2. Install dependencies (already done):

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Run on your device:

- **Android**: Press `a` or scan QR code with Expo Go app
- **iOS**: Press `i` (macOS only) or scan QR code with Camera app
- **Web**: Press `w` to open in browser

## 🔧 Development

### Running the App

```bash
# Start development server
npm start

# Run on Android emulator/device
npm run android

# Run on iOS simulator (macOS only)
npm run ios

# Run in web browser
npm run web
```

### Database Inspection

The SQLite database file is located at:

- **Android**: `/data/data/[package-name]/databases/app.db`
- **iOS**: `~/Library/Developer/CoreSimulator/Devices/[device-id]/data/Containers/Data/Application/[app-id]/Documents/app.db`

You can inspect it using tools like:

- DB Browser for SQLite
- TablePlus
- Expo's built-in SQLite inspector

## 🔄 Future Backend Sync Implementation

The architecture is prepared for Laravel/MySQL backend sync:

### 1. Sync Strategy

Each table has a `synced` field:

- `0` = local changes not yet synced
- `1` = synced with backend

### 2. Sync Flow

```
Mobile App                    Laravel Backend
    │                               │
    ├─ Create/Update local ────────┤
    │  (synced = 0)                 │
    │                               │
    ├─ Call sync API ───────────────>
    │  (send unsynced records)      │
    │                               │
    │  <──────── Receive response ──┤
    │  (conflicts, new IDs)         │
    │                               │
    ├─ Mark as synced ──────────────┤
    │  (synced = 1)                 │
```

### 3. Implementation Checklist

- [ ] Create Laravel API endpoints
  - `POST /api/products/sync` - Sync products
  - `POST /api/sales/sync` - Sync sales
- [ ] Handle conflict resolution
  - Server wins strategy
  - Client wins strategy
  - Timestamp-based merge
- [ ] Implement sync service
  - Update `services/*.service.ts` with sync logic
  - Add network connectivity checks
  - Queue sync operations when offline
- [ ] Add background sync
  - Use Expo Background Fetch
  - Sync on app startup/resume
  - Sync on data changes

### 4. Sync Service Example

```typescript
// Future implementation in services/products.service.ts
export async function syncProducts(): Promise<number> {
  // 1. Get unsynced products
  const unsynced = await productsRepo.getUnsyncedProducts();

  // 2. Send to backend
  const response = await fetch("https://api.example.com/products/sync", {
    method: "POST",
    body: JSON.stringify(unsynced),
  });

  // 3. Handle response and conflicts
  const { synced, conflicts } = await response.json();

  // 4. Mark as synced
  for (const id of synced) {
    await productsRepo.markProductAsSynced(id);
  }

  return synced.length;
}
```

## 🛡️ Architecture Rules (CRITICAL)

### ❌ NEVER DO THIS:

```typescript
// DON'T: Import getDB in screens
import { getDB } from "../db";

// DON'T: Import repositories in screens
import * as productsRepo from "../repositories/products.repo";

// DON'T: Import services in screens
import * as productsService from "../services/products.service";

// DON'T: Initialize database in screens
useEffect(() => {
  initDB(); // ❌ Wrong!
}, []);

// DON'T: Write SQL in screens
await db.execute("SELECT * FROM products"); // ❌ Wrong!
```

### ✅ ALWAYS DO THIS:

```typescript
// ✅ Screens only import hooks
import { useProducts } from "../hooks/useProducts";

// ✅ Hooks only import services
import * as productsService from "../services/products.service";

// ✅ Services only import repositories
import * as productsRepo from "../repositories/products.repo";

// ✅ Only repositories import getDB
import { getDB } from "../db";

// ✅ Initialize database ONCE in App.tsx
useEffect(() => {
  initDB();
}, []); // Only in App.tsx!
```

## 🐛 Troubleshooting

### "Database not initialized" Error

- **Cause**: Screens trying to access DB before initialization
- **Fix**: Ensure `initDB()` completes in `App.tsx` before rendering screens

### "Multiple database connections" Warning

- **Cause**: Multiple calls to `initDB()`
- **Fix**: Only call once in `App.tsx`, never in screens

### "Navigation causes data loss" Issue

- **Cause**: Not reloading data when screen comes into focus
- **Fix**: Use `useFocusEffect` to reload data:

```typescript
useFocusEffect(
  useCallback(() => {
    loadProducts();
  }, [loadProducts])
);
```

### Foreign Key Constraint Error

- **Cause**: Trying to create sale with non-existent product
- **Fix**: Always validate product exists before creating sale (service layer handles this)

## 📝 Testing Checklist

- [ ] Create product with valid data
- [ ] Try to create product with negative price (should fail)
- [ ] Create sale with valid product and quantity
- [ ] Try to create sale with non-existent product (should fail)
- [ ] Navigate between tabs (data should persist)
- [ ] Delete product and verify sales aren't orphaned (future enhancement)
- [ ] Close and reopen app (data should persist)

## 🔗 Dependencies

### Core

- **expo**: React Native framework
- **expo-sqlite**: SQLite database for React Native
- **drizzle-orm**: Type-safe ORM for SQLite
- **uuid**: Generate UUIDs for records

### Navigation

- **@react-navigation/native**: Navigation framework
- **@react-navigation/bottom-tabs**: Bottom tab navigator
- **react-native-screens**: Native screen components
- **react-native-safe-area-context**: Safe area handling

### Development

- **drizzle-kit**: Drizzle ORM CLI tools
- **@types/uuid**: TypeScript types for uuid
- **typescript**: TypeScript compiler

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Navigation Documentation](https://reactnavigation.org/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 👨‍💻 Author

Built as a test project to demonstrate clean architecture in React Native with offline-first capabilities.

## 📄 License

MIT
