# Visual Architecture Guide

## 📱 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                              │
│  ┌───────────────────────────┐  ┌──────────────────────────────┐   │
│  │   ProductsScreen.tsx      │  │     SalesScreen.tsx          │   │
│  │                           │  │                              │   │
│  │  • Create Product Form    │  │  • Select Product Dropdown   │   │
│  │  • Product List           │  │  • Quantity Input            │   │
│  │  • Delete Button          │  │  • Auto Total Display        │   │
│  │                           │  │  • Sales List                │   │
│  └───────────┬───────────────┘  └──────────┬───────────────────┘   │
│              │                              │                        │
└──────────────┼──────────────────────────────┼────────────────────────┘
               │                              │
               │ calls                        │ calls
               ▼                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        CUSTOM HOOKS (React Integration)              │
│  ┌────────────────────────┐    ┌──────────────────────────┐         │
│  │   useProducts.ts       │    │     useSales.ts          │         │
│  │                        │    │                          │         │
│  │  State:                │    │  State:                  │         │
│  │  • products: Product[] │    │  • sales: SaleWithProd[] │         │
│  │  • loading: boolean    │    │  • loading: boolean      │         │
│  │  • error: string       │    │  • error: string         │         │
│  │                        │    │                          │         │
│  │  Functions:            │    │  Functions:              │         │
│  │  • loadProducts()      │    │  • loadSales()           │         │
│  │  • createProduct()     │    │  • createSale()          │         │
│  │  • deleteProduct()     │    │  • deleteSale()          │         │
│  └────────────┬───────────┘    └──────────┬───────────────┘         │
│               │                           │                          │
└───────────────┼───────────────────────────┼──────────────────────────┘
                │                           │
                │ calls                     │ calls
                ▼                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    SERVICES (Business Logic)                         │
│  ┌──────────────────────────┐  ┌───────────────────────────┐        │
│  │  products.service.ts     │  │   sales.service.ts        │        │
│  │                          │  │                           │        │
│  │  • Validate price > 0    │  │  • Validate quantity > 0  │        │
│  │  • Trim product name     │  │  • Check product exists   │        │
│  │  • Error handling        │  │  • Calculate total        │        │
│  │  • Future: Sync logic    │  │  • Error handling         │        │
│  │                          │  │  • Future: Sync logic     │        │
│  └──────────┬───────────────┘  └────────┬──────────────────┘        │
│             │                           │                            │
└─────────────┼───────────────────────────┼────────────────────────────┘
              │                           │
              │ calls                     │ calls
              ▼                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                  REPOSITORIES (Data Access)                          │
│  ┌───────────────────────────┐  ┌──────────────────────────┐        │
│  │  products.repo.ts         │  │   sales.repo.ts          │        │
│  │                           │  │                          │        │
│  │  • createProduct()        │  │  • createSale()          │        │
│  │  • getAllProducts()       │  │  • getAllSalesWithProd() │        │
│  │  • getProductById()       │  │  • getSalesByProduct()   │        │
│  │  • updateProduct()        │  │  • updateSale()          │        │
│  │  • deleteProduct()        │  │  • deleteSale()          │        │
│  │  • getUnsyncedProducts()  │  │  • getUnsyncedSales()    │        │
│  │  • markAsSynced()         │  │  • markAsSynced()        │        │
│  │                           │  │                          │        │
│  │  Uses: Drizzle ORM        │  │  Uses: Drizzle ORM       │        │
│  │  • db.select()            │  │  • db.select()           │        │
│  │  • db.insert()            │  │  • db.insert()           │        │
│  │  • db.update()            │  │  • db.leftJoin()         │        │
│  │  • db.delete()            │  │  • db.delete()           │        │
│  └───────────┬───────────────┘  └──────────┬───────────────┘        │
│              │                             │                         │
└──────────────┼─────────────────────────────┼─────────────────────────┘
               │                             │
               │ uses                        │ uses
               ▼                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Storage)                                │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │   db/index.ts (Singleton)                                │       │
│  │                                                          │       │
│  │   • initDB() - Initialize once in App.tsx               │       │
│  │   • getDB() - Get singleton instance                    │       │
│  │   • runMigrations() - Create tables                     │       │
│  │                                                          │       │
│  │   Drizzle ORM ← expo-sqlite ← SQLite Database          │       │
│  │                          ↓                               │       │
│  │                   app.db (file)                         │       │
│  └──────────────────────────────────────────────────────────┘       │
│                                                                      │
│  ┌───────────────────────┐    ┌──────────────────────────┐         │
│  │  schema/products.ts   │    │   schema/sales.ts        │         │
│  │                       │    │                          │         │
│  │  products table:      │    │   sales table:           │         │
│  │  • id (UUID)          │    │   • id (UUID)            │         │
│  │  • name               │    │   • product_id (FK) ─────┼────┐    │
│  │  • price              │    │   • quantity             │    │    │
│  │  • created_at         │    │   • total                │    │    │
│  │  • updated_at         │    │   • created_at           │    │    │
│  │  • synced             │    │   • updated_at           │    │    │
│  └───────────────────────┘    │   • synced               │    │    │
│              ▲                └──────────────────────────┘    │    │
│              └────────────────────────────────────────────────┘    │
│                           Foreign Key Relationship                 │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Create Product Flow

```
User enters "Laptop" @ $999.99 and clicks "Create"
                    ↓
ProductsScreen validates input locally
                    ↓
Calls: createProduct("Laptop", 999.99)
                    ↓
useProducts hook sets loading=true
                    ↓
Calls: productsService.createProduct("Laptop", 999.99)
                    ↓
Service validates:
  ✓ name not empty
  ✓ price > 0
  ✓ trim whitespace
                    ↓
Calls: productsRepo.createProduct({ name: "Laptop", price: 999.99 })
                    ↓
Repository:
  1. Generates UUID: "550e8400-e29b-41d4-a716-446655440000"
  2. Sets synced=0
  3. Executes: db.insert(products).values({...})
                    ↓
SQLite Database:
  INSERT INTO products VALUES (
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Laptop",
    price: 999.99,
    created_at: "2026-01-08T10:30:00.000Z",
    updated_at: "2026-01-08T10:30:00.000Z",
    synced: 0
  )
                    ↓
Repository returns: Product object
                    ↓
Service returns: Product object
                    ↓
Hook reloads all products (loadProducts())
Hook sets loading=false
                    ↓
Screen shows success alert
Screen re-renders with new product in list
```

---

## 🔄 Create Sale Flow

```
User selects "Laptop" ($999.99), enters quantity: 2
                    ↓
SalesScreen shows preview: Total = $1,999.98
                    ↓
User clicks "Create Sale"
                    ↓
Calls: createSale("550e8400-...", 2)
                    ↓
useSales hook sets loading=true
                    ↓
Calls: salesService.createSale("550e8400-...", 2)
                    ↓
Service validates:
  ✓ quantity > 0
                    ↓
Service calls: productsRepo.getProductById("550e8400-...")
                    ↓
Repository queries: SELECT * FROM products WHERE id = "550e8400-..."
Returns: { id: "550e8400-...", name: "Laptop", price: 999.99 }
                    ↓
Service calculates: total = 2 × 999.99 = 1999.98
                    ↓
Calls: salesRepo.createSale({
  product_id: "550e8400-...",
  quantity: 2,
  total: 1999.98
})
                    ↓
Repository:
  1. Generates UUID for sale
  2. Sets synced=0
  3. Executes: db.insert(sales).values({...})
                    ↓
SQLite Database:
  INSERT INTO sales VALUES (
    id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    product_id: "550e8400-e29b-41d4-a716-446655440000",
    quantity: 2,
    total: 1999.98,
    created_at: "2026-01-08T10:35:00.000Z",
    updated_at: "2026-01-08T10:35:00.000Z",
    synced: 0
  )
                    ↓
Repository returns: Sale object
                    ↓
Service returns: Sale object
                    ↓
Hook reloads sales with JOIN:
  SELECT sales.*, products.name, products.price
  FROM sales
  LEFT JOIN products ON sales.product_id = products.id
                    ↓
Hook sets loading=false
                    ↓
Screen shows success alert
Screen displays: "Laptop - Qty: 2 × $999.99 = $1,999.98"
```

---

## 🎯 Architecture Decision Tree

### "I need to create a new feature..."

```
START: What layer am I working in?
    │
    ├─ Screen (UI)
    │  └─ Can I import?
    │     ├─ ✅ Hooks (useProducts, useSales)
    │     ├─ ✅ React Native components
    │     └─ ❌ Services, Repositories, Database
    │
    ├─ Hook (React Integration)
    │  └─ Can I import?
    │     ├─ ✅ Services
    │     ├─ ✅ React (useState, useCallback)
    │     └─ ❌ Repositories, Database
    │
    ├─ Service (Business Logic)
    │  └─ Can I import?
    │     ├─ ✅ Repositories
    │     ├─ ✅ Other Services
    │     ├─ ✅ Validation libraries
    │     └─ ❌ Database, Hooks, Screens
    │
    ├─ Repository (Data Access)
    │  └─ Can I import?
    │     ├─ ✅ Database (getDB)
    │     ├─ ✅ Schemas
    │     ├─ ✅ Drizzle ORM functions
    │     └─ ❌ Services, Hooks, Screens
    │
    └─ Database (Storage)
       └─ Can I import?
          ├─ ✅ expo-sqlite
          ├─ ✅ drizzle-orm
          └─ ❌ Everything else
```

---

## 🚦 Error Flow Example

```
User tries to create product with price = -10
                    ↓
Screen calls: createProduct("Widget", -10)
                    ↓
Hook calls: service.createProduct("Widget", -10)
                    ↓
Service validation FAILS:
  if (price <= 0) throw new Error("Price must be greater than 0")
                    ↓
Service throws error
                    ↓
Hook catches error:
  catch (err) {
    setError(err.message);
    throw err; // Re-throw for UI
  }
Hook sets error state
                    ↓
Screen catches error:
  catch (err) {
    Alert.alert("Error", err.message);
  }
                    ↓
User sees alert: "Price must be greater than 0"
Screen stays on form (no navigation)
Form data preserved (user can fix)
```

---

## 🔄 Navigation Flow

```
App Lifecycle:
    │
    ├─ App.tsx loads
    │  └─ useEffect(() => { initDB() }, [])
    │     ↓
    │  Database initializes ONCE
    │  Migrations run
    │  Tables created
    │     ↓
    │  isDBReady = true
    │     ↓
    │  Render NavigationContainer
    │
    ├─ User on Products Tab
    │  └─ ProductsScreen mounts
    │     └─ useFocusEffect(() => { loadProducts() })
    │        ↓
    │     Products loaded from DB
    │     Screen displays products
    │
    ├─ User switches to Sales Tab
    │  └─ SalesScreen mounts
    │     └─ useFocusEffect(() => { loadSales() })
    │        ↓
    │     Sales loaded from DB (with JOIN)
    │     Screen displays sales
    │
    ├─ User switches back to Products Tab
    │  └─ ProductsScreen focuses
    │     └─ useFocusEffect fires again!
    │        ↓
    │     Products reloaded (fresh data)
    │     Screen shows any new products
    │
    └─ App closes
       └─ Database connection closes automatically
       └─ Data persists in app.db file
```

---

## 📊 Type Flow

```
Database Schema (Drizzle)
    ↓
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: real('price').notNull(),
  ...
});
    ↓
Type Inference (Drizzle Magic)
    ↓
export type Product = typeof products.$inferSelect;
// Result: { id: string; name: string; price: number; ... }
    ↓
Repository Returns
    ↓
export async function getAllProducts(): Promise<Product[]>
    ↓
Service Returns
    ↓
export async function getAllProducts(): Promise<Product[]>
    ↓
Hook Returns
    ↓
const [products, setProducts] = useState<Product[]>([]);
    ↓
Screen Uses
    ↓
products.map((p: Product) => <Text>{p.name}</Text>)
    ↓
TypeScript Validates
    ↓
✅ Type-safe from database to UI!
```

---

## 🎨 Visual Summary

```
┌──────────────────────────────────────────────────────┐
│                   CLEAN ARCHITECTURE                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │          Presentation (Screens)            │    │
│  │              ▼ renders ▼                   │    │
│  │       [Products List] [Sales List]         │    │
│  └────────────────────────────────────────────┘    │
│                      ▲                              │
│                      │ state                        │
│                      │                              │
│  ┌────────────────────────────────────────────┐    │
│  │      Integration (Hooks)                   │    │
│  │              ▼ manages ▼                   │    │
│  │       [Loading] [Error] [Data]             │    │
│  └────────────────────────────────────────────┘    │
│                      ▲                              │
│                      │ calls                        │
│                      │                              │
│  ┌────────────────────────────────────────────┐    │
│  │      Business Logic (Services)             │    │
│  │              ▼ validates ▼                 │    │
│  │       [Rules] [Calculations] [Errors]      │    │
│  └────────────────────────────────────────────┘    │
│                      ▲                              │
│                      │ calls                        │
│                      │                              │
│  ┌────────────────────────────────────────────┐    │
│  │      Data Access (Repositories)            │    │
│  │              ▼ queries ▼                   │    │
│  │       [CRUD] [Joins] [Filters]             │    │
│  └────────────────────────────────────────────┘    │
│                      ▲                              │
│                      │ uses                         │
│                      │                              │
│  ┌────────────────────────────────────────────┐    │
│  │      Storage (Database)                    │    │
│  │              ▼ stores ▼                    │    │
│  │   [SQLite] [Tables] [Relationships]        │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

**This visual guide shows how data flows through the entire application,
from user interaction to database storage and back to the UI.**

**Every arrow represents a clear responsibility boundary!**
