# Architecture Documentation

This document explains the architectural decisions and patterns used in this offline-first React Native application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Layer Responsibilities](#layer-responsibilities)
3. [Data Flow](#data-flow)
4. [Design Patterns](#design-patterns)
5. [Sync Architecture](#sync-architecture)
6. [Best Practices](#best-practices)

---

## Architecture Overview

### Layered Architecture

This application follows a strict **layered architecture** pattern with clear separation of concerns:

```
Presentation → Integration → Business Logic → Data Access → Storage
   (Screen)      (Hook)        (Service)      (Repository)    (DB)
```

Each layer has specific responsibilities and can only communicate with adjacent layers.

### Why Layered Architecture?

1. **Maintainability**: Changes in one layer don't affect others
2. **Testability**: Each layer can be tested independently with mocks
3. **Scalability**: Easy to add new features without modifying existing code
4. **Reusability**: Services and repositories can be reused across multiple screens
5. **Clarity**: Developers know exactly where to put new code

---

## Layer Responsibilities

### 1. Storage Layer (`src/db/`)

**Purpose**: Manage database connection and schema

**Files**:

- `index.ts`: Database initialization and singleton management
- `schema/*.ts`: Drizzle ORM table definitions
- `migrations/`: SQL migration files (future)

**Responsibilities**:

- Open/close SQLite database connection
- Run migrations to create/update tables
- Export singleton database instance
- Ensure only ONE connection exists

**Can Import**: Nothing (lowest layer)

**Can Be Imported By**: Repositories only

**Example**:

```typescript
// src/db/index.ts
export async function initDB(): Promise<void> {
  const expoDb = SQLite.openDatabaseSync("app.db");
  dbInstance = drizzle(expoDb, { schema });
  await runMigrations();
}

export function getDB() {
  return dbInstance;
}
```

---

### 2. Data Access Layer (`src/repositories/`)

**Purpose**: Abstract all database operations using Drizzle ORM

**Files**:

- `products.repo.ts`: Products CRUD operations
- `sales.repo.ts`: Sales CRUD operations

**Responsibilities**:

- Execute Drizzle ORM queries
- Convert database results to TypeScript types
- Handle JOIN queries and relationships
- Provide clean CRUD APIs
- Manage sync flags

**Can Import**: Database layer (`getDB()`)

**Can Be Imported By**: Services only

**Example**:

```typescript
// src/repositories/products.repo.ts
import { getDB } from "../db";
import { products } from "../db/schema/products";

export async function getAllProducts(): Promise<Product[]> {
  const db = getDB();
  return await db.select().from(products);
}
```

**Why Not Use Database Directly?**

- Repositories provide a consistent API
- Easy to swap databases (SQLite → PostgreSQL)
- Single place to update all database queries
- Easier to mock for testing

---

### 3. Business Logic Layer (`src/services/`)

**Purpose**: Implement business rules and validations

**Files**:

- `products.service.ts`: Products business logic
- `sales.service.ts`: Sales business logic

**Responsibilities**:

- Validate input data (e.g., price > 0)
- Perform calculations (e.g., total = quantity × price)
- Coordinate multiple repository calls
- Handle business errors
- Future: Implement sync logic

**Can Import**: Repositories

**Can Be Imported By**: Hooks only

**Example**:

```typescript
// src/services/sales.service.ts
export async function createSale(
  productId: string,
  quantity: number
): Promise<Sale> {
  // Business validation
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  // Get product to calculate total
  const product = await productsRepo.getProductById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Business logic: calculate total
  const total = quantity * product.price;

  // Delegate to repository
  return await salesRepo.createSale({
    product_id: productId,
    quantity,
    total,
  });
}
```

**Why Not Put Logic in Repositories?**

- Repositories should be dumb data accessors
- Business rules might change independently of storage
- Services can coordinate multiple repositories
- Easier to test business logic in isolation

---

### 4. React Integration Layer (`src/hooks/`)

**Purpose**: Bridge React components with business logic

**Files**:

- `useProducts.ts`: Products React state management
- `useSales.ts`: Sales React state management

**Responsibilities**:

- Manage React state (loading, error, data)
- Handle async operations safely
- Provide React-friendly APIs (callbacks)
- Coordinate service calls with UI updates
- Prevent race conditions

**Can Import**: Services

**Can Be Imported By**: Screens/components

**Example**:

```typescript
// src/hooks/useProducts.ts
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getAllProducts();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, loadProducts };
}
```

**Why Separate Hooks from Services?**

- Services are plain TypeScript (no React)
- Hooks manage React-specific concerns (state, effects)
- Services can be used in non-React contexts
- Hooks provide consistent loading/error patterns

---

### 5. Presentation Layer (`src/screens/`)

**Purpose**: Display UI and handle user interactions

**Files**:

- `ProductsScreen.tsx`: Products UI
- `SalesScreen.tsx`: Sales UI

**Responsibilities**:

- Render UI components
- Handle user input (forms, buttons)
- Show loading/error states
- Navigate between screens
- Call hook functions (no business logic)

**Can Import**: Hooks only (plus React/React Native)

**Can Be Imported By**: Nothing (top layer)

**Example**:

```typescript
// src/screens/ProductsScreen.tsx
export default function ProductsScreen() {
  const { products, loading, loadProducts, createProduct } = useProducts();

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleCreate = async () => {
    await createProduct(name, price);
    Alert.alert("Success", "Product created");
  };

  return (
    <View>
      <TextInput value={name} onChangeText={setName} />
      <Button onPress={handleCreate} />
      <FlatList data={products} />
    </View>
  );
}
```

**Why Keep Screens Simple?**

- Easier to redesign UI without affecting logic
- Easier to add new screens that reuse existing hooks
- Screens become declarative: "show this data"
- UI testing focuses on presentation, not logic

---

## Data Flow

### Reading Data (GET)

```
User opens screen
       ↓
Screen calls hook.loadProducts()
       ↓
Hook calls service.getAllProducts()
       ↓
Service calls repository.getAllProducts()
       ↓
Repository calls db.select().from(products)
       ↓
Database returns rows
       ↓
Repository returns Product[]
       ↓
Service returns Product[] (could transform/filter)
       ↓
Hook updates state: setProducts(data)
       ↓
Screen re-renders with new data
```

### Creating Data (POST)

```
User fills form and clicks "Create"
       ↓
Screen validates input, calls hook.createProduct(name, price)
       ↓
Hook calls service.createProduct(name, price)
       ↓
Service validates business rules (price > 0)
       ↓
Service calls repository.createProduct(data)
       ↓
Repository generates UUID, calls db.insert(products)
       ↓
Database inserts row, returns ID
       ↓
Repository fetches and returns created Product
       ↓
Service returns Product
       ↓
Hook reloads all products (calls loadProducts())
       ↓
Screen shows updated list with new product
```

---

## Design Patterns

### 1. Singleton Pattern (Database)

**Purpose**: Ensure only ONE database connection exists

**Implementation**:

```typescript
let dbInstance: Database | null = null;

export async function initDB() {
  if (dbInstance) return;
  dbInstance = drizzle(SQLite.openDatabaseSync("app.db"));
}

export function getDB() {
  return dbInstance;
}
```

**Benefits**:

- Prevents connection leaks
- Improves performance (reuse connection)
- Thread-safe (single connection in SQLite)

---

### 2. Repository Pattern (Data Access)

**Purpose**: Abstract database operations behind a clean interface

**Implementation**:

```typescript
// Instead of screens doing this:
const products = await db.select().from(productsTable);

// They do this:
const products = await productsRepo.getAllProducts();
```

**Benefits**:

- Hides Drizzle ORM details
- Easy to swap storage layer
- Consistent error handling
- Reusable across services

---

### 3. Service Pattern (Business Logic)

**Purpose**: Encapsulate business rules separate from data access

**Implementation**:

```typescript
// Service handles validation and calculation
export async function createSale(productId: string, quantity: number) {
  if (quantity <= 0) throw new Error("Invalid quantity");

  const product = await productsRepo.getProductById(productId);
  const total = quantity * product.price; // Business logic

  return await salesRepo.createSale({ product_id: productId, quantity, total });
}
```

**Benefits**:

- Business rules in one place
- Easy to test logic without database
- Can coordinate multiple repositories
- Prepared for complex workflows (sync, notifications)

---

### 4. Custom Hook Pattern (React Integration)

**Purpose**: Provide reusable React state management

**Implementation**:

```typescript
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const data = await productsService.getAllProducts();
    setProducts(data);
    setLoading(false);
  }, []);

  return { products, loading, loadProducts };
}
```

**Benefits**:

- Consistent loading/error states
- Reusable across multiple screens
- Encapsulates async handling
- React-friendly (hooks rules)

---

## Sync Architecture

### Offline-First Approach

All data is stored locally first, then synced to backend when online.

### Sync Fields

Every table includes:

- `id`: UUID (generated on client)
- `created_at`: Local timestamp
- `updated_at`: Local timestamp
- `synced`: 0 = not synced, 1 = synced

### Sync Strategy

```
┌─────────────────────────────────────────────────────┐
│ Mobile App (SQLite)                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. User creates product                            │
│     → Insert with synced=0                          │
│                                                     │
│  2. Background/manual sync triggered                │
│     → Get all records where synced=0                │
│     → POST to Laravel API                           │
│                                                     │
│  3. API responds with success                       │
│     → Mark records as synced=1                      │
│                                                     │
│  4. Conflict resolution (if needed)                 │
│     → Server timestamp > local timestamp: server wins│
│     → Update local record with server data          │
│                                                     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│ Laravel Backend (MySQL)                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  - Receive batch of products/sales                  │
│  - Validate each record                             │
│  - Check for existing records by UUID               │
│  - Insert or update in MySQL                        │
│  - Return success/failure for each record           │
│  - Return conflicts if any                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Future Sync Implementation

**Service Layer** (`src/services/products.service.ts`):

```typescript
export async function syncProducts(): Promise<SyncResult> {
  // 1. Get unsynced records
  const unsynced = await productsRepo.getUnsyncedProducts();

  // 2. Send to backend
  const response = await fetch("https://api.example.com/products/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products: unsynced }),
  });

  const { synced, conflicts, errors } = await response.json();

  // 3. Mark successful syncs
  for (const id of synced) {
    await productsRepo.markProductAsSynced(id);
  }

  // 4. Handle conflicts (server data overwrites local)
  for (const conflict of conflicts) {
    await productsRepo.updateProduct(conflict.id, conflict.serverData);
    await productsRepo.markProductAsSynced(conflict.id);
  }

  return { synced: synced.length, conflicts: conflicts.length };
}
```

**Laravel API Endpoint**:

```php
// routes/api.php
Route::post('/products/sync', [ProductSyncController::class, 'sync']);

// app/Http/Controllers/ProductSyncController.php
public function sync(Request $request) {
    $products = $request->input('products');
    $synced = [];
    $conflicts = [];

    foreach ($products as $product) {
        $existing = Product::find($product['id']);

        if ($existing && $existing->updated_at > $product['updated_at']) {
            // Conflict: server is newer
            $conflicts[] = [
                'id' => $product['id'],
                'serverData' => $existing,
            ];
        } else {
            // Insert or update
            Product::updateOrCreate(
                ['id' => $product['id']],
                $product
            );
            $synced[] = $product['id'];
        }
    }

    return response()->json([
        'synced' => $synced,
        'conflicts' => $conflicts,
    ]);
}
```

---

## Best Practices

### ✅ DO

1. **Initialize database once in App.tsx**

   ```typescript
   useEffect(() => {
     initDB();
   }, []); // Empty deps = run once
   ```

2. **Use useFocusEffect to reload data**

   ```typescript
   useFocusEffect(
     useCallback(() => {
       loadProducts();
     }, [loadProducts])
   );
   ```

3. **Validate in service layer**

   ```typescript
   if (price <= 0) {
     throw new Error("Price must be greater than 0");
   }
   ```

4. **Handle errors gracefully**

   ```typescript
   try {
     await createProduct(name, price);
   } catch (error) {
     Alert.alert("Error", error.message);
   }
   ```

5. **Use TypeScript types from schema**
   ```typescript
   import type { Product } from "../db/schema/products";
   ```

### ❌ DON'T

1. **Never import getDB() in screens**

   ```typescript
   // ❌ Wrong
   import { getDB } from "../db";
   ```

2. **Never write SQL in screens**

   ```typescript
   // ❌ Wrong
   await db.execute("SELECT * FROM products");
   ```

3. **Never initialize database in screens**

   ```typescript
   // ❌ Wrong
   useEffect(() => {
     initDB();
   }, []);
   ```

4. **Never skip layers**

   ```typescript
   // ❌ Wrong: Screen calling service directly
   import * as productsService from "../services/products.service";

   // ✅ Correct: Screen calling hook
   import { useProducts } from "../hooks/useProducts";
   ```

5. **Never mutate state directly**

   ```typescript
   // ❌ Wrong
   products.push(newProduct);

   // ✅ Correct
   setProducts([...products, newProduct]);
   ```

---

## Testing Strategy

### Unit Tests

**Repositories** (mock database):

```typescript
test("getAllProducts returns all products", async () => {
  const mockDb = { select: jest.fn(() => ({ from: jest.fn() })) };
  const products = await getAllProducts();
  expect(products).toHaveLength(3);
});
```

**Services** (mock repositories):

```typescript
test("createProduct validates price", async () => {
  await expect(createProduct("Test", -10)).rejects.toThrow();
});
```

**Hooks** (mock services):

```typescript
test("useProducts loads data on mount", async () => {
  const { result } = renderHook(() => useProducts());
  await waitFor(() => expect(result.current.products).toHaveLength(3));
});
```

### Integration Tests

**Screen → Hook → Service → Repository → DB**:

```typescript
test("creating product updates list", async () => {
  render(<ProductsScreen />);
  fireEvent.changeText(screen.getByPlaceholder("Name"), "Widget");
  fireEvent.changeText(screen.getByPlaceholder("Price"), "19.99");
  fireEvent.press(screen.getByText("Create"));
  await waitFor(() => expect(screen.getByText("Widget")).toBeInTheDocument());
});
```

---

## Summary

This architecture provides:

✅ **Clear separation of concerns**: Each layer has one job
✅ **Testability**: Easy to mock and test each layer
✅ **Maintainability**: Changes isolated to specific layers
✅ **Scalability**: Easy to add features without breaking existing code
✅ **Type safety**: Full TypeScript support
✅ **Offline-first**: All data local, sync when online
✅ **Sync-ready**: Prepared for Laravel backend integration

The key is **discipline**: follow the layer rules strictly, and the architecture will remain clean and maintainable as the app grows.
