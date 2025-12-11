# Facebook Data Deletion - Quick Reference

## ✅ Files Created

### 1. Migration File
**Location:** `supabase/migrations/20251211140710_create_data_deletion_requests_table.sql`

**Note:** This file exists but may not be visible in your IDE because the `supabase` directory is in `.cursorignore`. 

**To view it:**
- Open terminal and run: `cat supabase/migrations/20251211140710_create_data_deletion_requests_table.sql`
- Or use Finder/File Explorer to navigate to: `supabase/migrations/`
- Or copy the SQL from: `FACEBOOK_DATA_DELETION_MIGRATION.sql` (same content)

### 2. Edge Function
**Location:** `supabase/functions/facebook-data-deletion/index.ts`

**To view it:**
- Terminal: `cat supabase/functions/facebook-data-deletion/index.ts`
- Or copy from: `FACEBOOK_DATA_DELETION_EDGE_FUNCTION.ts`

### 3. Status Page
**Location:** `src/pages/DataDeletionStatusPage.tsx` ✅ (Already exists)

### 4. App Route
**Location:** `src/App.tsx` ✅ (Already configured)

---

## 🚀 Quick Deployment

### Step 1: Run Migration

**Option A: Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Copy SQL from `FACEBOOK_DATA_DELETION_MIGRATION.sql`
3. Paste and Run

**Option B: Supabase CLI**
```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase db push
```

### Step 2: Deploy Edge Function

```bash
cd /Users/cliffsumalpong/Desktop/nexscout
supabase functions deploy facebook-data-deletion
```

### Step 3: Set Environment Variables

In Supabase Dashboard → Edge Functions → `facebook-data-deletion` → Settings → Secrets:

- `FACEBOOK_APP_SECRET` - Your Facebook App Secret
- `APP_URL` - Your app URL (e.g., `https://nexscout.co`)

### Step 4: Configure Facebook

1. Go to [Facebook App Dashboard](https://developers.facebook.com/apps/)
2. Settings → Basic
3. Data Deletion Request URL: `https://your-project-ref.supabase.co/functions/v1/facebook-data-deletion`

---

## 📍 File Locations Summary

| File | Location | Status |
|------|----------|--------|
| Migration SQL | `supabase/migrations/20251211140710_create_data_deletion_requests_table.sql` | ✅ Created |
| Edge Function | `supabase/functions/facebook-data-deletion/index.ts` | ✅ Created |
| Status Page | `src/pages/DataDeletionStatusPage.tsx` | ✅ Exists |
| App Route | `src/App.tsx` | ✅ Configured |
| Setup Guide | `FACEBOOK_DATA_DELETION_DEPLOYMENT_GUIDE.md` | ✅ Created |

---

## 🔍 Why Can't I See the File?

The `supabase` directory is in `.cursorignore`, which means:
- ✅ Files exist and are functional
- ❌ They may not show in Cursor IDE file explorer
- ✅ You can still access them via terminal or Finder

**To verify files exist:**
```bash
cd /Users/cliffsumalpong/Desktop/nexscout
ls -la supabase/migrations/20251211140710_create_data_deletion_requests_table.sql
ls -la supabase/functions/facebook-data-deletion/index.ts
```

Both commands should show the files exist!

