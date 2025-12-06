# 🔍 CALENDAR SETTINGS - SYSTEM DIAGNOSTIC

## ✅ Components Verified

### **1. Database Schema** ✅
**File:** `supabase/migrations/20251203220000_create_smart_calendar_system.sql`

**Tables:**
- ✅ `calendar_settings` - Created with all fields
- ✅ `meeting_types` - Created
- ✅ `weekly_availability` - Created
- ✅ `date_overrides` - Created
- ✅ `calendar_bookings` - Created
- ✅ `booking_notifications` - Created

**Key Fields in `calendar_settings`:**
```sql
- id UUID PRIMARY KEY
- user_id UUID REFERENCES auth.users(id) UNIQUE
- booking_slug TEXT UNIQUE
- is_booking_enabled BOOLEAN DEFAULT TRUE
- display_name TEXT NOT NULL
- welcome_message TEXT
- timezone TEXT DEFAULT 'Asia/Manila'
- min_notice_hours INTEGER DEFAULT 2
- max_days_advance INTEGER DEFAULT 30
```

---

### **2. RLS Policies** ✅

**For `calendar_settings` table:**
- ✅ **SELECT (Public):** "Public can view calendar settings by slug" - USING (TRUE)
- ✅ **SELECT (Owner):** "Users can view own calendar settings" - USING (auth.uid() = user_id)
- ✅ **INSERT:** "Users can create own calendar settings" - WITH CHECK (auth.uid() = user_id)
- ✅ **UPDATE:** "Users can update own calendar settings" - USING (auth.uid() = user_id) ← **THIS IS THE KEY ONE!**

**Policy for UPDATE is correct!** ✅

---

### **3. Service Layer** ✅

**File:** `src/services/calendar/calendarService.ts`

**Methods:**
- ✅ `getSettings(userId)` - Fetches calendar settings
- ✅ `updateSettings(userId, updates)` - Updates calendar settings
- ✅ `getMeetingTypes(userId)` - Fetches meeting types
- ✅ `createMeetingType(userId, data)` - Creates meeting type
- ✅ `getBookings(userId)` - Fetches bookings

**updateSettings Implementation:**
```typescript
async updateSettings(userId, updates): Promise<boolean> {
  const { data, error } = await supabase
    .from('calendar_settings')
    .update(updates)
    .eq('user_id', userId)
    .select();
  
  if (error) throw error;
  return true;
}
```

**Enhanced with:**
- ✅ Console logging for debugging
- ✅ `.select()` to return updated data
- ✅ Proper error throwing

---

### **4. UI Component** ✅

**File:** `src/pages/CalendarPage.tsx`

**Features:**
- ✅ Loads settings on mount: `useEffect(() => loadCalendarData())`
- ✅ Tracks edits: `editedSettings` state
- ✅ Save button with validation
- ✅ Shows unsaved changes preview
- ✅ Dynamic button states (disabled/saving/ready)
- ✅ Success/error alerts

**Enhanced with:**
- ✅ Better error messages
- ✅ Console logging for debugging
- ✅ Validation before save
- ✅ Unsaved changes indicator
- ✅ Change count in button text

---

## 🐛 Potential Issues & Fixes

### **Issue #1: Migration Not Deployed**
**Symptom:** Table doesn't exist error

**Fix:**
```bash
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push
```

**Or manually run in Supabase SQL Editor:**
```
supabase/migrations/20251203220000_create_smart_calendar_system.sql
```

---

### **Issue #2: User Not Authenticated**
**Symptom:** "User session not found" error

**Fix:** The code now checks `!user` separately and logs to console

**Debug Steps:**
1. Open browser console
2. Click "Save Settings"
3. Check console logs:
   ```
   === SAVE BUTTON CLICKED ===
   User: { id: '...', email: '...' }
   Settings: { ... }
   Edited Settings: { display_name: 'Cliff', ... }
   ```

---

### **Issue #3: Settings Not Initialized**
**Symptom:** `settings` is null

**Fix:** CalendarPage already has auto-initialization:
```typescript
if (!settingsData) {
  await initializeCalendarSettings();
  const newSettings = await calendarService.getSettings(user.id);
  setSettings(newSettings);
}
```

This creates settings automatically if they don't exist!

---

### **Issue #4: RLS Policy Blocking Update**
**Symptom:** Update returns error but user is authenticated

**Check in Supabase Dashboard:**
1. Go to Table Editor → calendar_settings
2. Try manual UPDATE
3. Check if policy is active

**Policy should be:**
```sql
CREATE POLICY "Users can update own calendar settings"
  ON calendar_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 🧪 Testing Checklist

### **1. Calendar Settings Save:**
- [ ] Load Calendar page
- [ ] Click "⚙️ Settings" tab
- [ ] Edit "Display Name" to "Cliff"
- [ ] Edit "Welcome Message" to "Hi"
- [ ] Edit "Booking Slug" to "soya"
- [ ] See "Unsaved Changes" box with 3 changes
- [ ] Button shows "Save 3 Changes"
- [ ] Click "Save 3 Changes"
- [ ] Check console for logs
- [ ] Should see "✅ Settings saved successfully!"
- [ ] Changes should persist after page refresh

### **2. Add Meeting Type:**
- [ ] Load Calendar page
- [ ] Click "⏰ Availability" tab
- [ ] Click "Add Meeting Type" button
- [ ] Fill in:
  - Name: "1 minute"
  - Description: "Lets GO!"
  - Duration: 30
  - Location: Zoom
- [ ] Click "Create Meeting Type"
- [ ] Should see "✅ Meeting type created successfully!"
- [ ] New meeting type appears in list

### **3. Booking Link:**
- [ ] Check if booking link appears in top card
- [ ] Should be: `https://localhost:5173/book/[slug]`
- [ ] Click "Copy Link" button
- [ ] Should see "Copied!" confirmation
- [ ] Link should be in clipboard

---

## 🔧 Debugging Steps

If save still fails, check these in order:

### **1. Check Console Logs**
```javascript
=== SAVE BUTTON CLICKED ===
User: {...}
Settings: {...}
Edited Settings: {...}
[CalendarService] Updating settings for user: ...
[CalendarService] Updates: {...}
[CalendarService] Update successful. Data: {...}
```

### **2. Check Network Tab**
- Open DevTools → Network
- Click "Save Settings"
- Look for `calendar_settings` request
- Check response:
  - **200 OK** = Success
  - **401 Unauthorized** = RLS policy issue
  - **500 Error** = Database issue

### **3. Check Supabase Dashboard**
- Go to Table Editor
- View `calendar_settings` table
- Check if row exists for your user_id
- Try manual UPDATE
- Check if RLS policies are enabled

### **4. Check Migration Status**
```bash
supabase migration list
```

Look for:
```
20251203220000_create_smart_calendar_system.sql [APPLIED]
```

If not applied, run:
```bash
supabase db push
```

---

## 🚀 Quick Fix Commands

### **If migration not deployed:**
```bash
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push
```

### **If still errors, check database:**
```sql
-- Check if table exists
SELECT * FROM calendar_settings LIMIT 1;

-- Check if settings exist for user
SELECT * FROM calendar_settings WHERE user_id = auth.uid();

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'calendar_settings';
```

---

## 💡 Most Likely Issue

Based on the error "User session not found", the most likely cause is:

**The old error check was:**
```typescript
if (!settings || !user) {
  alert('❌ Error: User session not found...');
}
```

**This triggers when `settings` is null**, even if `user` is fine!

**The new check is:**
```typescript
if (!user) {
  alert('❌ User session not found...');
}
// Removed the !settings check - we can update even if settings is null
```

---

## ✅ Current Status

**All components are properly connected:**
1. ✅ Database schema with UPDATE policy
2. ✅ Service layer with updateSettings()
3. ✅ UI with proper state management
4. ✅ Enhanced error handling and logging
5. ✅ Validation and feedback

**Next step:** Test the save functionality and check console logs!

---

## 📞 Support

If still having issues, provide:
1. Browser console logs (after clicking "Save Settings")
2. Network tab response (status code)
3. Supabase migration status




