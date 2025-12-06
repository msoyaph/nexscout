# DEBUG AMBASSADOR CONNECTION ISSUE 🔍

**Error:** "Could not find the table 'public.ambassador_profiles' in the schema cache"  
**Status:** Tables deployed but app can't see them

---

## 🎯 **CRITICAL CHECKS**

### **Check #1: Verify Supabase Project Match**

**You might have run the SQL on the WRONG Supabase project!**

**Steps:**

1. **In Supabase Dashboard:**
   - Note the project name at top left
   - Note the project URL (e.g., `abc123.supabase.co`)

2. **In Your App:**
   - Check `.env.local` or `.env`
   - Find `VITE_SUPABASE_URL`
   - Compare the project ref

**Example:**
```
Dashboard: https://xyz789.supabase.co
.env: VITE_SUPABASE_URL=https://abc123.supabase.co

❌ MISMATCH! Tables are in xyz789, but app connects to abc123!
```

**If mismatch:**
- Run the SQL in the CORRECT project (the one your app connects to)

---

### **Check #2: Run Diagnostic SQL**

**Copy this file:** `DEBUG_AMBASSADOR_SCHEMA.sql` (I just created it)

**Run in Supabase SQL Editor:**
1. Copy entire contents of `DEBUG_AMBASSADOR_SCHEMA.sql`
2. Paste in SQL Editor
3. Click "Run"
4. **Share the results with me**

**What it checks:**
- Does table exist?
- What's the table structure?
- What policies exist?
- What database are you connected to?

---

### **Check #3: Verify Environment Variables**

**In your terminal, run:**

```bash
cd /Users/cliffsumalpong/Documents/NexScout
cat .env.local | grep SUPABASE
# Or
cat .env | grep SUPABASE
```

**Expected output:**
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Verify:**
- URL matches your Supabase project
- Anon key is valid

---

### **Check #4: Test Direct Database Query**

**In browser console (F12 → Console), run:**

```javascript
// Check what URL Supabase is using
console.log('App Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Try to query the table directly
const { data, error } = await supabase
  .from('ambassador_profiles')
  .select('count')
  .limit(0);

console.log('Direct query result:', { data, error });

// Share this error message with me
```

---

## 🔧 **POSSIBLE SCENARIOS**

### **Scenario 1: Wrong Project**

**Symptom:**
- SQL ran successfully in Dashboard
- App still can't see table

**Cause:**
- You have multiple Supabase projects
- Ran SQL in Project A
- App connects to Project B

**Fix:**
- Check project URLs match
- Run SQL in the correct project

---

### **Scenario 2: Local vs Remote Database**

**Symptom:**
- Tables exist in remote Supabase
- App connected to local Supabase instance

**Cause:**
- Running `supabase start` locally
- App using local database
- Remote tables not synced to local

**Fix:**
```bash
# Check if running locally
supabase status

# If local is running, stop it
supabase stop

# Update .env to use remote
# VITE_SUPABASE_URL=https://your-remote-project.supabase.co

# Restart app
npm run dev
```

---

### **Scenario 3: Tables Actually Don't Exist**

**Symptom:**
- "Success" message but table not visible

**Cause:**
- SQL might have partially failed
- Or ran on test/staging database

**Fix:**
- Run diagnostic SQL (DEBUG_AMBASSADOR_SCHEMA.sql)
- Check if table actually exists
- If not, run DEPLOY_AMBASSADOR_SAFE.sql again

---

## 📋 **IMMEDIATE ACTION ITEMS**

### **Do These Now:**

1. **Run Diagnostic SQL**
   ```
   File: DEBUG_AMBASSADOR_SCHEMA.sql
   Where: Supabase SQL Editor
   Action: Copy → Paste → Run → Share results
   ```

2. **Check Project URL**
   ```bash
   # In terminal
   cd /Users/cliffsumalpong/Documents/NexScout
   cat .env.local | grep VITE_SUPABASE_URL
   
   # Compare to Supabase Dashboard URL
   ```

3. **Check Browser Console**
   ```
   F12 → Console tab
   Look for error details
   Share exact error message
   ```

---

## 🎯 **SHARE WITH ME**

**Please share:**

1. **Result of diagnostic SQL** (from DEBUG_AMBASSADOR_SCHEMA.sql)
2. **Your Supabase URL** (from .env, just the project ref, e.g., xyz789)
3. **Browser console error** (full error message)

**With this info, I can pinpoint the exact issue!**

---

## 💡 **MOST COMMON FIX**

**9 out of 10 times, it's one of these:**

1. **Restart dev server** (didn't fully restart)
   ```bash
   # Make sure you see:
   # "Local: http://localhost:5173"
   # "ready in XXX ms"
   ```

2. **Wrong Supabase project** (SQL ran elsewhere)
   - Verify URLs match

3. **Local Supabase running** (blocking remote)
   ```bash
   supabase stop
   npm run dev
   ```

---

## ✅ **QUICK TEST**

**Run this in Supabase SQL Editor:**

```sql
SELECT COUNT(*) FROM ambassador_profiles;
```

**If it works:** Tables exist, it's a connection issue  
**If it fails:** Tables don't exist, need to run SQL again

---

**Run the diagnostic SQL and share the results - I'll fix it immediately!** 🚀




