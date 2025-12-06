# 🚀 Production Deployment Instructions

## Quick Deploy (Recommended)

### Method 1: Using the Deploy Script
```bash
./deploy.sh
```

### Method 2: Using npm script
```bash
npm run deploy
```

### Method 3: Manual Steps
```bash
# 1. Build the application
npm run build

# 2. Deploy to Vercel
vercel --prod
```

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready
- [x] All critical bugs fixed
- [x] No linter errors
- [x] Build succeeds locally
- [x] All routes tested

### ⚠️ Environment Variables (CRITICAL)
Before deploying, ensure these are set in **Vercel Dashboard**:

1. Go to: https://vercel.com → Your Project → Settings → Environment Variables

2. Add these variables for **Production** environment:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://nexscout.co
   VITE_FACEBOOK_APP_ID=your-facebook-app-id (optional)
   ```

3. **IMPORTANT:** 
   - Make sure `VITE_SUPABASE_URL` uses **HTTPS** (not HTTP)
   - Redeploy after adding environment variables

---

## 🚀 Step-by-Step Deployment

### Step 1: Install Vercel CLI (if not installed)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
Follow the prompts to authenticate.

### Step 3: Build the Application
```bash
npm run build
```
This creates the `dist/` folder with optimized production files.

### Step 4: Deploy to Production
```bash
vercel --prod
```

**What happens:**
- Vercel uploads your `dist/` folder
- Creates a production deployment
- Provides you with a deployment URL
- Automatically configures HTTPS

### Step 5: Verify Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify all required variables are set for **Production**
3. If you added new variables, **redeploy**:
   ```bash
   vercel --prod
   ```

---

## 🌐 Connect Your Domain (nexscout.co)

### Step 1: Add Domain in Vercel
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Click "Add Domain"
3. Enter: `nexscout.co`
4. Also add: `www.nexscout.co`

### Step 2: Update DNS Records
Vercel will provide DNS records to add. Update your domain's DNS:

**For nexscout.co:**
- Type: `A` or `CNAME`
- Name: `@` or `nexscout.co`
- Value: (provided by Vercel)

**For www.nexscout.co:**
- Type: `CNAME`
- Name: `www`
- Value: (provided by Vercel)

### Step 3: Wait for DNS Propagation
- Usually takes 5-30 minutes
- Can take up to 48 hours (rare)
- Check status in Vercel Dashboard

---

## ✅ Post-Deployment Verification

### 1. Test Critical Routes
- [ ] Homepage loads: `https://nexscout.co`
- [ ] Signup works: Test new user registration
- [ ] Login works: Test existing user login
- [ ] Public chat: `https://nexscout.co/chat/[slug]`
- [ ] Terms page: `https://nexscout.co/terms`
- [ ] Privacy page: `https://nexscout.co/privacy`

### 2. Check Browser Console
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

### 3. Verify Environment Variables
- Check that Supabase connection works
- Verify API calls succeed
- Test authentication flow

### 4. Test on Mobile
- Open on mobile device
- Test responsive design
- Verify touch interactions

---

## 🔧 Troubleshooting

### Build Fails
```bash
# Check for errors
npm run typecheck
npm run lint

# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Environment Variables Not Working
- ✅ Make sure variables start with `VITE_`
- ✅ Set for **Production** environment (not Preview)
- ✅ Redeploy after adding variables
- ✅ Check Vercel build logs

### 404 Errors on Routes
- ✅ Verify `vercel.json` exists in root
- ✅ Check that routes redirect to `index.html`
- ✅ Clear browser cache

### Mixed Content Errors
- ✅ Ensure `VITE_SUPABASE_URL` uses HTTPS
- ✅ Check Supabase CORS settings
- ✅ Verify all API calls use HTTPS

### Deployment URL Not Working
- ✅ Check Vercel deployment logs
- ✅ Verify build succeeded
- ✅ Check environment variables
- ✅ Wait a few minutes for propagation

---

## 📊 Deployment Status

After deployment, you'll see:
- ✅ Deployment URL (e.g., `nexscout-xyz.vercel.app`)
- ✅ Production URL (e.g., `https://nexscout.co`)
- ✅ Build logs
- ✅ Deployment status

---

## 🎯 Quick Commands Reference

```bash
# Build only
npm run build

# Deploy to production
vercel --prod

# Deploy to preview (staging)
vercel

# View deployment logs
vercel logs

# List deployments
vercel ls
```

---

## 🆘 Need Help?

1. **Check Vercel Dashboard** for deployment logs
2. **Check browser console** for runtime errors
3. **Verify environment variables** are set correctly
4. **Review build logs** in Vercel

---

**Ready to deploy?** Run `./deploy.sh` or `npm run deploy`! 🚀
