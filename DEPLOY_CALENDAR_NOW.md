# 🚀 DEPLOY SMART CALENDAR - STEP BY STEP

**Time:** 5 minutes  
**Difficulty:** Easy

---

## 📋 STEP 1: DEPLOY SQL MIGRATION

### **1. Open the Migration File**
```
File: supabase/migrations/20251203220000_create_smart_calendar_system.sql
```

### **2. Copy the Entire File**
- Click inside the file
- Press `Cmd + A` (Mac) or `Ctrl + A` (Windows) - Select all
- Press `Cmd + C` (Mac) or `Ctrl + C` (Windows) - Copy

### **3. Open Supabase SQL Editor**
1. Go to: **https://supabase.com/dashboard**
2. Click your **NexScout project**
3. Click **"SQL Editor"** in left sidebar
4. Click **"New query"** button

### **4. Paste & Run**
1. Paste the copied SQL (Cmd/Ctrl + V)
2. Click **"Run"** button (bottom right)
3. Wait 5-10 seconds

### **5. Verify Success**
You should see:
```
✅ Smart Calendar System created successfully!
📅 Tables: calendar_settings, meeting_types, weekly_availability, date_overrides, calendar_bookings
🔗 Public booking: /book/[slug]
🤖 AI Chatbot integration ready
📧 Notification system ready
```

---

## ✅ STEP 2: VERIFY TABLES CREATED

Run this query to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'calendar%'
ORDER BY table_name;
```

**Expected Result:**
```
calendar_bookings
calendar_settings
```

Also check:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('meeting_types', 'weekly_availability', 'date_overrides', 'booking_notifications')
ORDER BY table_name;
```

**Expected Result:**
```
booking_notifications
date_overrides
meeting_types
weekly_availability
```

---

## ✅ STEP 3: CHECK YOUR BOOKING LINK

Run this query to see your auto-generated booking link:
```sql
SELECT 
  user_id,
  booking_slug,
  display_name,
  is_booking_enabled
FROM calendar_settings
WHERE user_id = auth.uid();
```

**Expected Result:**
```
user_id: [your-uuid]
booking_slug: [your-slug] (e.g., "cliffsumalpong123")
display_name: [your-name]
is_booking_enabled: true
```

Your booking link is:
```
https://nexscout.com/book/[your-slug]
```

---

## 🎉 SUCCESS!

If you see:
- ✅ Success message with "Smart Calendar System created"
- ✅ All tables exist
- ✅ Your booking slug is generated

**You're ready for the next step!** 🚀

---

## 🐛 TROUBLESHOOTING

### Error: "relation already exists"
**Solution:** Tables already created, you're good! Skip to Step 2.

### Error: "permission denied"
**Solution:** Make sure you're logged into the correct Supabase project.

### Error: "function already exists"
**Solution:** Functions already created, you're good!

---

## 📝 NEXT STEPS

After database is deployed:
1. ✅ Test Calendar page (/calendar)
2. ✅ Set your availability
3. ✅ Copy your booking link
4. ✅ Integrate with AI Chatbot (next guide)

---

**Ready to continue?** See: `AI_CHATBOT_CALENDAR_INTEGRATION.md`




