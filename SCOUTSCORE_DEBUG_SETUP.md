# ScoutScore Debug Panel - Setup Guide

## ✅ Step 1: Edge Function File (COMPLETE)

The Edge Function file has been created at:
- **Location**: `supabase/functions/scoutscore-debug/index.ts`
- **Status**: ✅ File copied successfully

## 🚀 Step 2: Deploy Edge Function

### Option A: Using Supabase CLI (Recommended)

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project** (if not already linked):
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (Find your project ref in Supabase Dashboard → Settings → General)

4. **Deploy the function**:
   ```bash
   supabase functions deploy scoutscore-debug
   ```

### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Click **Create Function**
5. Name it: `scoutscore-debug`
6. Copy the contents of `supabase/functions/scoutscore-debug/index.ts`
7. Paste into the function editor
8. Click **Deploy**

## ✅ Step 3: Test the Setup

### Option 1: Test via Client (Recommended)

The debug panel will automatically:
1. ✅ Try the Edge Function first
2. ✅ Fall back to client-side computation if Edge Function fails

**To test:**
1. Open your app
2. Navigate to a Prospect Detail page
3. Click **"Debug View"** button next to "Why This Score?"
4. The panel should load successfully

### Option 2: Test Edge Function Directly

```bash
# Get your access token from the browser console:
# localStorage.getItem('sb-<project-ref>-auth-token')

curl -X GET \
  "https://YOUR_PROJECT_REF.supabase.co/functions/v1/scoutscore-debug?leadId=YOUR_LEAD_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## 🔧 Current Implementation

### Client-Side Fallback (Always Available)

The `getScoutScoreDebug()` function in `src/lib/api/getScoutScoreDebug.ts`:
- ✅ **First**: Tries to call the Edge Function
- ✅ **Fallback**: Uses client-side computation with existing ScoutScore engines
- ✅ **No API Required**: Works even without deploying the Edge Function

### Edge Function (Optional, Better Performance)

- ✅ Server-side computation
- ✅ Faster for complex calculations
- ✅ Better for production

## 📋 What You Have Now

1. ✅ **Edge Function Code**: `supabase/functions/scoutscore-debug/index.ts`
2. ✅ **Client-Side API Wrapper**: `src/lib/api/getScoutScoreDebug.ts`
3. ✅ **Debug Panel UI**: `src/components/debug/ScoutScoreDebugPanel.tsx`
4. ✅ **Integrated in ProspectDetailPage**: Click "Debug View" button

## 🎯 Next Steps

1. **Immediate**: The debug panel works NOW with client-side fallback
2. **Optional**: Deploy Edge Function for better performance
3. **Future**: Enhance Edge Function to call actual scoring engines

## ❓ Troubleshooting

### "Edge Function failed, using client-side computation"
- ✅ **This is normal!** The client-side fallback is working
- To fix: Deploy the Edge Function using steps above

### "VITE_SUPABASE_URL not configured"
- Check your `.env` file has `VITE_SUPABASE_URL`
- Client-side fallback doesn't need this

### "Prospect not found or access denied"
- Verify the `leadId` exists in the `prospects` table
- Ensure the prospect belongs to the logged-in user

---

**Status**: ✅ **READY TO USE**
The debug panel works immediately with client-side computation. Deploy the Edge Function for better performance.


