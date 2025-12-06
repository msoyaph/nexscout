# 🚀 Quick Production Deployment Guide

## Step 1: Build the Application
```bash
npm run build
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Recommended)

1. **Install Vercel CLI (if not installed):**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

### Option B: Using GitHub Integration

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect settings and deploy

## Step 3: Configure Environment Variables

**CRITICAL:** Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_APP_URL=https://nexscout.co
VITE_FACEBOOK_APP_ID=your-facebook-app-id (optional)
```

**Important:**
- Make sure `VITE_SUPABASE_URL` uses HTTPS (not HTTP)
- Add these for **Production** environment
- Redeploy after adding environment variables

## Step 4: Connect Domain (nexscout.co)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add `nexscout.co` and `www.nexscout.co`
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (5-30 minutes)

## Step 5: Verify Deployment

1. Visit your production URL
2. Test critical flows:
   - ✅ Signup/Login
   - ✅ Public chat routes (`/chat/[slug]`)
   - ✅ Terms/Privacy (`/terms`, `/privacy`)
   - ✅ Main dashboard

## Troubleshooting

### Build Fails
- Check for TypeScript errors: `npm run typecheck`
- Check for linting errors: `npm run lint`
- Verify all dependencies installed: `npm install`

### Environment Variables Not Working
- Make sure variables start with `VITE_`
- Redeploy after adding variables
- Check Vercel build logs

### 404 Errors on Routes
- Verify `vercel.json` is in root directory
- Check that all routes redirect to `index.html`

### Mixed Content Errors
- Ensure `VITE_SUPABASE_URL` uses HTTPS
- Check Supabase CORS settings

## Post-Deployment Checklist

- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test public chat (`/chat/[slug]`)
- [ ] Test Terms/Privacy pages
- [ ] Verify environment variables loaded
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify HTTPS is working
- [ ] Check Supabase connection

---

**Ready to deploy?** Run the commands above! 🚀

