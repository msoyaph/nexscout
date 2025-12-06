# QUICK FIX: "Table May Not Exist Yet" Error

**Error:** Failed to save settings. The table may not exist yet.  
**Fix Time:** 30 seconds  
**Status:** Easy fix! ✅

---

## 🔴 THE PROBLEM

When you clicked "Save Settings" in AI Pitch Deck Settings, you got an error because the database tables haven't been created yet.

**Tables needed:**
- `ai_system_instructions`
- `pitch_deck_settings`
- Storage buckets: `ai-instructions-assets`, `ai-instructions-docs`

---

## ✅ THE SOLUTION (One Command)

### Run This Command:

```bash
cd /Users/cliffsumalpong/Documents/NexScout
supabase db push
```

**What this does:**
1. Creates `ai_system_instructions` table
2. Creates `pitch_deck_settings` table
3. Creates storage buckets for images/files
4. Adds RLS policies for security
5. Removes Elite tier (bonus!)

**Time:** ~30 seconds

---

## 🧪 TEST AFTER DEPLOYMENT

### 1. Verify Tables Created

```sql
-- Check tables exist
SELECT COUNT(*) FROM ai_system_instructions;
SELECT COUNT(*) FROM pitch_deck_settings;

-- Check storage buckets
SELECT * FROM storage.buckets 
WHERE id LIKE 'ai-instructions%';
```

**Expected:** All queries return successfully

### 2. Test Pitch Deck Settings

1. Open AI Pitch Deck page
2. Click purple ⚙️ "AI Settings" button
3. Enable custom instructions
4. Write: "Test instructions"
5. Click "Save Settings"
6. ✅ Should show: "Settings saved successfully!"

### 3. Test Image Upload

1. In settings modal
2. Click "Insert Image"
3. Choose "Upload" mode
4. Upload any image
5. ✅ Should upload to storage
6. ✅ Preview should show

### 4. Test File Upload

1. Click "Add File"
2. Choose "Upload" mode
3. Upload any PDF
4. ✅ Should upload to storage
5. ✅ File should appear in list

---

## 📋 WHAT GETS CREATED

### Database Tables

**ai_system_instructions:**
- Stores custom AI instructions for ALL features
- Columns: custom_instructions, use_custom_instructions, override_intelligence, rich_content
- RLS: Users can only see/edit their own

**pitch_deck_settings:**
- Backward compatibility for pitch decks
- Same structure as above

### Storage Buckets

**ai-instructions-assets:**
- For images: products, logos, catalogs, screenshots
- Public read access
- User-specific folders

**ai-instructions-docs:**
- For files: brochures, PDFs, docs, spreadsheets
- Public read access
- User-specific folders

---

## 🚀 AFTER THE FIX

### You Can Now:

✅ Save AI system instructions (no more error!)  
✅ Insert product images via URL  
✅ Upload product images from computer  
✅ Add file links (brochures, PDFs)  
✅ Upload files from computer  
✅ Use Override Intelligence mode  
✅ Use Smart Mode (merge with auto data)  
✅ Customize ALL AI features  

---

## 💡 QUICK TEST SCRIPT

```bash
# 1. Deploy migrations
supabase db push

# 2. Check if tables exist
psql $DATABASE_URL -c "SELECT COUNT(*) FROM ai_system_instructions;"
# Should return: 0 (table exists, just empty)

# 3. Check storage
psql $DATABASE_URL -c "SELECT id FROM storage.buckets WHERE id LIKE 'ai-instructions%';"
# Should return: ai-instructions-assets, ai-instructions-docs

# 4. Success! Now test in UI
```

---

## 🎯 SUMMARY

**Problem:** Database tables don't exist  
**Solution:** Deploy migrations with `supabase db push`  
**Time:** 30 seconds  
**Result:** Everything works! ✅

---

**Run the command and you're done!** 🚀

```bash
supabase db push
```




