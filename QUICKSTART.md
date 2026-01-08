# Quick Start Guide

Get the app running in under 5 minutes!

## 🚀 Start the App

```bash
# Start the Expo development server
npm start
```

Then choose your platform:

- **Android**: Press `a` or scan QR code with Expo Go app
- **iOS**: Press `i` (macOS only) or scan QR code with Camera app
- **Web**: Press `w` to open in browser

## 📱 Test the App

### 1. Create Some Products

Navigate to the **Products** tab:

1. Enter product name: `"Laptop"`
2. Enter price: `999.99`
3. Click **Create Product**
4. Repeat for more products:
   - `"Mouse"` - `25.00`
   - `"Keyboard"` - `75.50`

### 2. Create Sales

Navigate to the **Sales** tab:

1. Click **Select a product**
2. Choose `"Laptop"` from the list
3. Enter quantity: `2`
4. Notice the total auto-calculates: `$1,999.98`
5. Click **Create Sale**

### 3. Verify Data Persistence

1. Close the app completely
2. Reopen the app
3. Check that products and sales are still there

✅ **Data persists!** All stored in local SQLite database.

## 🔍 Explore the Architecture

### File Organization

```
src/
├── db/                 # Database setup (open once)
├── repositories/       # Database queries (Drizzle ORM)
├── services/          # Business logic & validation
├── hooks/             # React state management
└── screens/           # UI components
```

### Follow the Data Flow

**Creating a Product**:

```
ProductsScreen.tsx
    ↓ calls
useProducts.ts hook
    ↓ calls
products.service.ts (validates price > 0)
    ↓ calls
products.repo.ts (Drizzle ORM)
    ↓ writes to
SQLite database
```

### Key Architecture Rules

✅ **DO**:

- Screens only call hooks
- Hooks only call services
- Services only call repositories
- Repositories only access database

❌ **DON'T**:

- Import `getDB()` in screens
- Write SQL in components
- Initialize database multiple times
- Skip layers

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios

# Run in web browser
npm run web

# Type check
npx tsc --noEmit

# Generate migrations (future)
npx drizzle-kit generate:sqlite
```

## 📊 Database Schema

### Products Table

| Column     | Type    | Description            |
| ---------- | ------- | ---------------------- |
| id         | TEXT    | UUID (primary key)     |
| name       | TEXT    | Product name           |
| price      | REAL    | Product price          |
| created_at | TEXT    | ISO timestamp          |
| updated_at | TEXT    | ISO timestamp          |
| synced     | INTEGER | 0=not synced, 1=synced |

### Sales Table

| Column     | Type    | Description             |
| ---------- | ------- | ----------------------- |
| id         | TEXT    | UUID (primary key)      |
| product_id | TEXT    | Foreign key to products |
| quantity   | INTEGER | Number of units sold    |
| total      | REAL    | Calculated: qty × price |
| created_at | TEXT    | ISO timestamp           |
| updated_at | TEXT    | ISO timestamp           |
| synced     | INTEGER | 0=not synced, 1=synced  |

## 🐛 Troubleshooting

### "Database not initialized" error

**Solution**: Make sure `initDB()` runs in [App.tsx](App.tsx) before screens render.

### Changes not showing

**Solution**: Use `useFocusEffect` to reload data when screen comes into focus.

### "Product not found" when creating sale

**Solution**: Create at least one product first!

### App crashes on startup

**Solution**:

1. Clear Expo cache: `npx expo start -c`
2. Reinstall dependencies: `rm -rf node_modules && npm install`

## 📚 Next Steps

1. **Read the architecture**: Open [ARCHITECTURE.md](ARCHITECTURE.md)
2. **Understand sync**: Check the "Future Backend Sync" section in [README.md](README.md)
3. **Add features**: Try adding product categories or customer information
4. **Implement sync**: Connect to a Laravel backend

## 💡 Tips

- **Navigate safely**: `useFocusEffect` reloads data automatically
- **Auto-calculate**: Sales total is computed by service layer
- **Sync-ready**: Each record has a `synced` flag for future backend sync
- **Type-safe**: Full TypeScript support with Drizzle ORM

## 🎯 What You've Built

✅ Offline-first mobile app  
✅ Clean layered architecture  
✅ Type-safe database operations  
✅ Automatic calculations (total = qty × price)  
✅ Foreign key relationships (sales → products)  
✅ Sync-ready structure (synced flags)  
✅ Production-ready error handling

Congratulations! You now have a solid foundation for an offline-first React Native app. 🎉
