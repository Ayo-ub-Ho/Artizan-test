# Database Architecture - Clean & Production-Ready

## ✅ Refactoring Complete

Your database architecture has been refactored to follow best practices for offline-first React Native apps with Drizzle ORM + SQLite.

## 📁 New File Structure

```
src/db/
├── client.ts          # SQLite + Drizzle singleton (ONE connection)
├── schema.ts          # All table definitions (products, sales)
└── migrations.ts      # Database migrations (CREATE TABLE)
```

## 🎯 Key Improvements

### 1. **Centralized Database Client**

- **Before**: `db/index.ts` with complex initialization and deletion logic
- **After**: Clean `db/client.ts` with single `initializeDatabase()` function
- **Benefit**: No more race conditions, no database re-initialization

### 2. **Consolidated Schema**

- **Before**: Separate files `schema/products.ts` and `schema/sales.ts`
- **After**: Single `schema.ts` with all tables
- **Benefit**: Easier to manage relationships and imports

### 3. **Proper Migration Handling**

- **Before**: SQL mixed with initialization logic
- **After**: Dedicated `migrations.ts` with idempotent migrations
- **Benefit**: Safe to run multiple times, easier to version

### 4. **Fixed useFocusEffect Issues**

- **Problem**: Database was being accessed before initialization
- **Solution**: Initialize ONCE in App.tsx, screens only load data
- **Result**: No more "Database not ready" errors

## 🔄 How It Works

### Initialization Flow

```
App.tsx starts
    ↓
Call initializeDatabase() (ONCE)
    ↓
1. Open SQLite connection (singleton)
2. Wrap with Drizzle ORM
3. Run migrations (CREATE TABLE IF NOT EXISTS)
    ↓
Database ready ✓
    ↓
Render screens
    ↓
Screens use useFocusEffect to loadData()
    ↓
Data loads successfully (no DB re-init)
```

### Data Access Flow

```
Screen loads
    ↓
useFocusEffect(() => { loadProducts() })
    ↓
Hook calls Service
    ↓
Service calls Repository
    ↓
Repository calls getDB()
    ↓
Executes Drizzle query
    ↓
Returns data to Screen
```

## 📝 Critical Rules

### ✅ DO

1. **Initialize database ONCE in App.tsx**

   ```typescript
   await initializeDatabase();
   ```

2. **Use getDB() in repositories**

   ```typescript
   const db = getDB();
   const products = await db.select().from(products);
   ```

3. **Use useFocusEffect to reload data**
   ```typescript
   useFocusEffect(
     useCallback(() => {
       loadProducts(); // Safe: only loads data
     }, [loadProducts])
   );
   ```

### ❌ DON'T

1. **Never re-initialize database in screens**

   ```typescript
   // ❌ WRONG
   useFocusEffect(() => {
     initializeDatabase(); // NO!
   });
   ```

2. **Never create multiple DB connections**

   ```typescript
   // ❌ WRONG
   const db = SQLite.openDatabaseSync("app.db");
   ```

3. **Never mix SQL with component logic**
   ```typescript
   // ❌ WRONG
   const products = await db.execute("SELECT * FROM products");
   ```

## 🔧 File Changes

### New Files

- `src/db/client.ts` - Database singleton
- `src/db/schema.ts` - Consolidated schema
- `src/db/migrations.ts` - Migration logic

### Updated Files

- `App.tsx` - Uses `initializeDatabase()`
- `src/repositories/*.repo.ts` - Import from `db/client` and `db/schema`
- `src/hooks/*.ts` - Import types from `db/schema`
- `src/screens/*.tsx` - Import types from `db/schema`

### Deprecated Files (can be deleted)

- `src/db/index.ts` - Replaced by `client.ts`
- `src/db/schema/products.ts` - Merged into `schema.ts`
- `src/db/schema/sales.ts` - Merged into `schema.ts`

## 🚀 Testing the Refactor

1. **Stop Metro bundler**: Press Ctrl+C
2. **Start fresh**: `npm start`
3. **Reload app**: Press `r` or close and reopen Expo Go
4. **Test**: Create products and sales - should work without errors

## 🐛 Fixes Applied

### Issue 1: "java.lang.String cannot be cast to java.lang.Boolean"

**Root Cause**: SQLite returns values that need explicit type conversion
**Fix**: All numeric values wrapped with `Number()` before rendering

### Issue 2: useFocusEffect re-initialization

**Root Cause**: Database being initialized on every screen focus
**Fix**: Initialize ONCE in App.tsx, screens only load data

### Issue 3: Scattered database logic

**Root Cause**: SQL and initialization mixed throughout codebase
**Fix**: Centralized in `db/client.ts` and `db/migrations.ts`

## 🎓 Architecture Principles

### 1. **Singleton Pattern**

One database connection for entire app lifecycle

### 2. **Separation of Concerns**

- `client.ts` = Connection management
- `schema.ts` = Table definitions
- `migrations.ts` = Schema creation
- `repositories/` = Data access

### 3. **Type Safety**

All queries are type-safe through Drizzle ORM

### 4. **Offline-First Ready**

- UUID primary keys
- Sync flags (0 = needs sync)
- Timestamps for conflict resolution

## 🔮 Next Steps for Tiqati

### Ready for Laravel Backend Sync

1. **Add sync service**:

   ```typescript
   // src/services/sync.service.ts
   export async function syncToBackend() {
     const unsynced = await getUnsyncedProducts();
     await postToLaravel(unsynced);
     await markAsSynced(unsynced.map((p) => p.id));
   }
   ```

2. **Add network detection**:

   ```typescript
   import NetInfo from "@react-native-community/netinfo";
   const isOnline = await NetInfo.fetch();
   if (isOnline) await syncToBackend();
   ```

3. **Add background sync**:
   ```typescript
   import * as BackgroundFetch from "expo-background-fetch";
   // Sync every 15 minutes
   ```

## 📊 Performance Benefits

- ✅ Faster app startup (no repeated DB initialization)
- ✅ Smoother navigation (no DB locks)
- ✅ Better memory usage (single connection)
- ✅ Type-safe queries (catch errors at compile time)

## 🎉 Summary

Your database architecture is now:

- **Clean**: Clear separation of concerns
- **Stable**: No more race conditions or re-initialization
- **Scalable**: Ready for offline-first with future backend sync
- **Production-Ready**: Follows industry best practices

The refactoring resolves all the issues you mentioned and provides a solid foundation for the Tiqati app.
