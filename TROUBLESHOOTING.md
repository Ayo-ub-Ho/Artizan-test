# Troubleshooting: Type Casting Error

## Error: "java.lang.String cannot be cast to java.lang.Boolean"

### What Causes This?

This error occurs when SQLite returns data in a format that doesn't match what Drizzle ORM expects. Specifically:

1. **Old database schema**: If the database was created before the schema fix
2. **Type mismatch**: SQLite INTEGER fields being read as strings instead of numbers
3. **Cached data**: Old data structure in the database

### ✅ Solution 1: Clear App Data (Android)

The fastest way to fix this on Android:

1. **Long press** the Expo Go app icon
2. Tap **App Info**
3. Tap **Storage**
4. Tap **Clear Data** or **Clear Storage**
5. Restart the app

This will delete the old database and create a fresh one with the correct schema.

### ✅ Solution 2: Uninstall and Reinstall

1. Uninstall Expo Go app
2. Reinstall Expo Go from Play Store
3. Scan QR code again

### ✅ Solution 3: Use Database Reset Function

If you want to programmatically reset the database during development:

**Add a reset button to your app** (temporary, for development):

```typescript
// In ProductsScreen.tsx or any screen
import { resetDB } from "../db";

// Add this button (remove after testing)
<TouchableOpacity
  onPress={async () => {
    await resetDB();
    Alert.alert("Success", "Database reset! Please reload the app.");
  }}
>
  <Text>Reset Database (Dev Only)</Text>
</TouchableOpacity>;
```

### What Was Fixed?

The schemas were updated to explicitly specify numeric mode for INTEGER fields:

**Before:**

```typescript
synced: integer("synced").notNull().default(0);
quantity: integer("quantity").notNull();
```

**After:**

```typescript
synced: integer("synced", { mode: "number" }).notNull().default(0);
quantity: integer("quantity", { mode: "number" }).notNull();
```

This ensures Drizzle ORM properly converts SQLite INTEGER values to JavaScript numbers.

### Prevention

To prevent this in the future:

1. **Always specify `mode: 'number'`** for integer fields in Drizzle schemas
2. **Version your database** using migration files (future enhancement)
3. **Test on a fresh install** after schema changes
4. **Clear data** when switching between dev versions

### For iOS Simulator

If you're using iOS Simulator:

1. **Reset Content and Settings**:
   - Go to iOS Simulator menu
   - Device → Erase All Content and Settings
2. **Or delete app**:
   - Long press the Expo Go app
   - Tap the X to delete
   - Reinstall from App Store

### For Web

If testing on web:

1. Open Browser DevTools (F12)
2. Go to **Application** tab
3. Find **IndexedDB** or **WebSQL**
4. Delete the database
5. Refresh the page

### Verification

After clearing the database, verify it works:

1. ✅ Create a product - should work without errors
2. ✅ Create a sale - should work without errors
3. ✅ Navigate between tabs - data should persist
4. ✅ Check sync status - should show "○ Not synced"

### Still Having Issues?

If the error persists:

1. **Check the logs** for more specific error messages
2. **Verify schema files** have `mode: 'number'` on all integer fields
3. **Check Drizzle ORM version** in package.json
4. **Try running on a different device/emulator**

### Technical Details

SQLite stores values with type affinity, not strict types:

- INTEGER → Can be stored as various integer types
- When read without explicit type conversion, may return as string
- Drizzle ORM's `mode: 'number'` forces proper JavaScript number conversion

The fix ensures type safety from database to UI layer.

---

**The schema has been fixed. Just clear your app data and restart!** 🎉
