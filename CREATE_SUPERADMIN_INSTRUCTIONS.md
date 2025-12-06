# Create SuperAdmin Account - Complete Instructions

## What This Does:

1. ✅ Fixes infinite recursion in admin_users RLS policies
2. ✅ Creates SuperAdmin account for geoffmax22@gmail.com
3. ✅ Grants full access to Data Feeder, Power Mode, all admin features

---

## 🚀 **Run This (2 Minutes):**

### **File:** `FIX_INFINITE_RECURSION_AND_CREATE_ADMIN.sql`

1. **Copy** entire file
2. **Paste** in Supabase SQL Editor  
3. **Run**

---

## 📋 **Expected Output:**

### **If You Haven't Signed Up with geoffmax22@gmail.com Yet:**
```
ERROR: User geoffmax22@gmail.com not found. 
Please sign up first with this email, then run this script again.
```

**Solution:** 
1. Sign up at your app with geoffmax22@gmail.com
2. Then run the SQL again

---

### **If You Already Have an Account:**
```
NOTICE: Found user: geoffmax22@gmail.com (ID: ...)
NOTICE: ✅ SuperAdmin account created for geoffmax22@gmail.com!
NOTICE: You now have full access to Data Feeder, Power Mode, and all admin features!

user_id       | email                  | is_super_admin | is_admin
--------------|------------------------|----------------|----------
...           | geoffmax22@gmail.com   | t              | t
```

---

## ✅ **Then Test:**

1. **Log out**
2. **Log in** with: geoffmax22@gmail.com
3. **Go to:** /admin/data-feeder
4. **No "Make Me Admin" warning!** ✅
5. **Power Mode → New Post → Save**
6. **Works!** ✅

---

## 🎯 **What You'll Have:**

- ✅ SuperAdmin access
- ✅ Can create unlimited company templates
- ✅ Can publish AI instructions
- ✅ Can manage all Data Feeder content
- ✅ No infinite recursion errors

---

**Run the SQL now!**

If geoffmax22@gmail.com doesn't exist, sign up first, then run it! 🚀✨

