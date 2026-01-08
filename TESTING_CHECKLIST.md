# 🧪 Testing Checklist - Refactored Architecture

## ✅ Pre-Test Validation

- [x] TypeScript compilation: **PASSED** (no errors)
- [x] All imports updated to centralized schema
- [x] Database client singleton created
- [x] Migrations properly organized
- [ ] Old deprecated files removed (optional cleanup)

## 🚀 How to Test

### 1. Start Fresh Metro Bundler

```bash
# Stop current bundler (Ctrl+C)
npm start
```

### 2. Reload App in Expo Go

- **Option A**: Press `r` in Metro terminal
- **Option B**: Close Expo Go app completely and reopen
- **Option C**: Shake device → "Reload"

### 3. Test Database Initialization

**Expected**: App loads without errors

✅ **Success indicators**:

- No "java.lang.String cannot be cast to java.lang.Boolean" error
- No "Database not ready" errors
- Bottom tabs visible (Products | Sales)

❌ **Failure indicators**:

- Red error screen
- Metro bundler shows errors
- App crashes on startup

### 4. Test Products Screen

#### Create Product

1. Navigate to **Products** tab
2. Enter name: "Test Product"
3. Enter price: "9.99"
4. Tap "Create Product"

**Expected**: Product appears in list below

#### Verify Display

Check that product shows:

- ✅ Name: "Test Product"
- ✅ Price: "$9.99" (formatted correctly)
- ✅ Synced: "No" (red badge)

#### Delete Product

1. Tap "Delete" button
2. Product disappears from list

**Expected**: Smooth deletion, no errors

### 5. Test Sales Screen

#### Create Sale

1. Navigate to **Sales** tab
2. Tap "Select Product" button
3. Modal opens showing products list
4. Tap on a product
5. Modal closes, product name appears
6. Enter quantity: "5"
7. See total preview update automatically
8. Tap "Create Sale"

**Expected**: Sale appears in list below

#### Verify Calculation

Check that sale shows:

- ✅ Product name
- ✅ Quantity: "5"
- ✅ Total: "$49.95" (if product was $9.99)
- ✅ Synced: "No" (red badge)

#### Delete Sale

1. Tap "Delete" button
2. Sale disappears from list

**Expected**: Smooth deletion, no errors

### 6. Test Navigation

1. Switch between Products and Sales tabs multiple times
2. Data should reload on each tab focus
3. No flickering or performance issues

**Expected**: Smooth navigation, data loads instantly

## 🐛 Troubleshooting

### Error: "Cannot read property 'execute' of undefined"

**Cause**: Database not initialized
**Fix**: Check App.tsx calls `initializeDatabase()` in useEffect

### Error: "Table does not exist"

**Cause**: Migrations didn't run
**Fix**: Check `runMigrations()` is called in `initializeDatabase()`

### Error: "Cannot find module '../db/schema/products'"

**Cause**: Old import path
**Fix**: Should be `'../db/schema'` (centralized)

### Products/Sales not loading

**Cause**: Type conversion issues
**Fix**: All numeric values should be wrapped with `Number()` in JSX

### Modal not opening on Android

**Known issue**: Not related to refactoring
**Workaround**: Already using Modal component correctly

## 📊 Performance Metrics

Track these for comparison:

| Metric           | Target  | Actual |
| ---------------- | ------- | ------ |
| App startup time | < 2s    | ?      |
| Product creation | < 500ms | ?      |
| Sale creation    | < 500ms | ?      |
| Tab switch delay | < 100ms | ?      |
| Memory usage     | < 100MB | ?      |

## ✨ What Should Work Better Now

1. **No database re-initialization**

   - Before: DB initialized on every screen focus
   - After: Initialized ONCE at app start

2. **Cleaner imports**

   - Before: `'../db/schema/products'`, `'../db/schema/sales'`
   - After: `'../db/schema'` (one source of truth)

3. **Type-safe queries**

   - All Drizzle queries have proper TypeScript types
   - IDE autocomplete works correctly

4. **Stable navigation**
   - useFocusEffect only loads data, doesn't touch DB
   - No race conditions

## 🎯 Success Criteria

Consider refactoring successful if:

1. ✅ App starts without errors
2. ✅ Can create products
3. ✅ Can create sales (with product selection)
4. ✅ Data persists after closing app
5. ✅ Navigation is smooth
6. ✅ No type casting errors
7. ✅ TypeScript compilation passes

## 📝 Report Results

After testing, document:

1. **What worked**: **************\_\_\_**************
2. **What failed**: **************\_\_\_**************
3. **Error messages**: **************\_\_\_**************
4. **Performance notes**: **************\_\_\_**************

## 🔄 If Issues Persist

If you still see type casting errors:

1. **Check Expo version**: `npx expo --version`
2. **Check expo-sqlite version**: See package.json
3. **Try database reset**:
   ```typescript
   // In App.tsx, temporary:
   import { resetDatabase } from "./src/db/migrations";
   await resetDatabase(); // Run ONCE, then remove
   ```
4. **Check Android logs**:
   ```bash
   npx react-native log-android
   ```

## 📞 Next Steps

If everything works:

1. Remove temporary database deletion code (if any)
2. Clean up deprecated files
3. Commit changes to git
4. Start building real Tiqati features!

If errors persist:

1. Share full error message
2. Share Metro bundler logs
3. Share Android logcat output
4. We'll investigate deeper
