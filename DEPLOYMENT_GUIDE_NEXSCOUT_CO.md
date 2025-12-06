# 🚀 NexScout Deployment Guide - nexscout.co

Complete guide to deploy NexScout to production and connect to your domain.

---

## 📋 Pre-Launch Checklist

### ✅ Code Readiness
- [x] All critical bugs fixed
- [x] Settings pages functional and wired
- [x] SuperAdmin features locked for regular users
- [ ] Final code review completed
- [ ] All environment variables documented

### ✅ Database Readiness
- [ ] Supabase production project created
- [ ] All migrations applied to production
- [ ] RLS policies verified
- [ ] Database backups configured
- [ ] Test data cleaned (if needed)

### ✅ Security Readiness
- [ ] Environment variables secured
- [ ] API keys rotated for production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] SSL/HTTPS configured

---

## 🏗️ Step 1: Build Production Bundle

### 1.1 Install Dependencies
```bash
cd /Users/cliffsumalpong/Documents/NexScout2
npm install
```

### 1.2 Create Environment File
Create `.env.production` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key

# Facebook OAuth (if using)
VITE_FACEBOOK_APP_ID=your-facebook-app-id

# Production Domain
VITE_APP_URL=https://nexscout.co
```

**⚠️ Important:** Replace with your actual production Supabase credentials.

### 1.3 Build for Production
```bash
npm run build
```

This creates a `dist/` folder with optimized production files.

### 1.4 Test Production Build Locally
```bash
npm run preview
```

Visit `http://localhost:4173` to verify the build works.

---

## 🌐 Step 2: Choose Hosting Platform

### Option A: Vercel (Recommended - Easiest)

**Why Vercel:**
- Automatic deployments from GitHub
- Free SSL certificates
- Global CDN
- Easy domain connection
- Zero configuration needed

#### 2.1 Deploy to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Follow prompts:**
   - Link to existing project? **No**
   - Project name: **nexscout**
   - Directory: **./** (current directory)
   - Override settings? **No**

5. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_FACEBOOK_APP_ID` (if using)
     - `VITE_APP_URL` = `https://nexscout.co`

6. **Redeploy after adding env vars:**
   ```bash
   vercel --prod
   ```

#### 2.2 Connect Domain to Vercel

1. **In Vercel Dashboard:**
   - Go to Project → Settings → Domains
   - Click "Add Domain"
   - Enter: `nexscout.co`
   - Also add: `www.nexscout.co` (optional)

2. **Update DNS Records:**
   Go to your domain registrar (where you bought nexscout.co) and add:

   **For Root Domain (nexscout.co):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

   **OR use CNAME (recommended):**
   ```
   Type: CNAME
   Name: @
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

   **For WWW (www.nexscout.co):**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

3. **Wait for DNS Propagation:**
   - Usually takes 5-60 minutes
   - Check status in Vercel Dashboard → Domains

4. **SSL Certificate:**
   - Vercel automatically provisions SSL certificates
   - Wait 5-10 minutes after DNS propagates

---

### Option B: Netlify

#### 2.1 Deploy to Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Login:**
   ```bash
   netlify login
   ```

3. **Deploy:**
   ```bash
   netlify deploy --prod
   ```

4. **Set Environment Variables:**
   - Netlify Dashboard → Site Settings → Environment Variables
   - Add all `VITE_*` variables

5. **Connect Domain:**
   - Netlify Dashboard → Domain Settings → Add Custom Domain
   - Follow DNS instructions

---

### Option C: Cloudflare Pages

1. **Connect GitHub repo to Cloudflare Pages**
2. **Build settings:**
   - Build command: `npm run build`
   - Build output: `dist`
3. **Environment variables:** Add in Cloudflare Dashboard
4. **Custom domain:** Add in Pages → Custom Domains

---

## 🔧 Step 3: Configure Supabase for Production

### 3.1 Create Production Supabase Project

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Create New Project:**
   - Name: `nexscout-production`
   - Database Password: (save securely)
   - Region: **Southeast Asia (Singapore)** (closest to PH)
   - Plan: Choose based on expected traffic

### 3.2 Migrate Database Schema

1. **Export from Development:**
   ```bash
   # In Supabase SQL Editor, export all tables, functions, RLS policies
   ```

2. **Import to Production:**
   - Go to Production Project → SQL Editor
   - Run all migrations in order
   - Verify all tables created

### 3.3 Configure Supabase Settings

1. **Authentication → URL Configuration:**
   - Site URL: `https://nexscout.co`
   - Redirect URLs: 
     - `https://nexscout.co/**`
     - `https://www.nexscout.co/**`
     - `https://nexscout.co/auth/callback`
     - `https://nexscout.co/chat/**` (for public chatbot)

2. **Storage → Policies:**
   - Verify RLS policies are enabled
   - Test file uploads

3. **Edge Functions:**
   - Deploy all edge functions to production
   - Update environment variables in Edge Functions

### 3.4 Update Environment Variables

**In your hosting platform (Vercel/Netlify), update:**
```
VITE_SUPABASE_URL=https://your-production-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

---

## 🔐 Step 4: Security Configuration

### 4.1 Supabase RLS Policies

Verify all tables have RLS enabled:
```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 4.2 CORS Configuration

**In Supabase Dashboard → Settings → API:**
- Add `https://nexscout.co` to allowed origins
- Add `https://www.nexscout.co` to allowed origins

### 4.3 Rate Limiting

**Configure in Supabase:**
- Go to Settings → API
- Enable rate limiting
- Set appropriate limits

---

## 📱 Step 5: Update App URLs

### 5.1 Update Hardcoded URLs

Search for hardcoded URLs in codebase:
```bash
grep -r "localhost:5173" src/
grep -r "nexscoutai.com" src/
```

Replace with:
- `https://nexscout.co` (production)
- Or use `import.meta.env.VITE_APP_URL` for dynamic URLs

### 5.2 Update Chatbot Links

In `ChatbotSettingsPage.tsx` and related files, update:
```typescript
// Change from:
const link = `https://nexscoutai.com/chat/${chatSlug}`;

// To:
const link = `${import.meta.env.VITE_APP_URL || 'https://nexscout.co'}/chat/${chatSlug}`;
```

---

## 🧪 Step 6: Pre-Launch Testing

### 6.1 Test Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Public chatbot loads: `https://nexscout.co/chat/{slug}`
- [ ] All pages load without errors
- [ ] Settings save correctly
- [ ] Payment flow works (if enabled)
- [ ] Email notifications work
- [ ] File uploads work
- [ ] Mobile responsive on all pages

### 6.2 Performance Testing

```bash
# Test build size
npm run build
du -sh dist/

# Should be < 2MB for initial load
```

### 6.3 Browser Testing

Test on:
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox
- [ ] Edge

---

## 🚀 Step 7: Go Live!

### 7.1 Final Deployment

1. **Build and deploy:**
   ```bash
   npm run build
   vercel --prod  # or netlify deploy --prod
   ```

2. **Verify deployment:**
   - Visit `https://nexscout.co`
   - Test critical flows

### 7.2 Monitor

- **Vercel/Netlify Dashboard:** Check deployment logs
- **Supabase Dashboard:** Monitor database queries
- **Browser Console:** Check for errors

### 7.3 Post-Launch

1. **Set up monitoring:**
   - Consider Sentry for error tracking
   - Google Analytics (optional)

2. **Backup strategy:**
   - Supabase auto-backups enabled
   - Manual backup before major changes

3. **Documentation:**
   - Update README with production URLs
   - Document environment variables

---

## 🔄 Step 8: Continuous Deployment

### 8.1 GitHub Integration (Recommended)

1. **Connect GitHub to Vercel:**
   - Vercel Dashboard → Project → Settings → Git
   - Connect your GitHub repository
   - Enable "Auto-deploy"

2. **Automatic Deployments:**
   - Every push to `main` branch → Production
   - Every push to other branches → Preview

### 8.2 Environment Variables in Git

**⚠️ NEVER commit `.env` files!**

Create `.env.example`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_URL=https://nexscout.co
```

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 📊 Step 9: Post-Launch Monitoring

### 9.1 Key Metrics to Monitor

- **User Registrations:** Track daily signups
- **Error Rates:** Monitor Supabase logs
- **Performance:** Page load times
- **Database Usage:** Query performance
- **Storage Usage:** File uploads

### 9.2 Set Up Alerts

- **Supabase:** Set up email alerts for:
  - High error rates
  - Database connection issues
  - Storage limits

---

## 🆘 Troubleshooting

### Issue: Domain not connecting

**Solution:**
1. Verify DNS records are correct
2. Wait 24-48 hours for full propagation
3. Check DNS with: `dig nexscout.co`
4. Verify SSL certificate issued

### Issue: Environment variables not working

**Solution:**
1. Verify variables are set in hosting platform
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)
4. Restart deployment

### Issue: Supabase connection errors

**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Check `VITE_SUPABASE_ANON_KEY` is valid
3. Verify CORS settings in Supabase
4. Check RLS policies allow access

### Issue: Build fails

**Solution:**
1. Run `npm run build` locally to see errors
2. Fix TypeScript errors: `npm run typecheck`
3. Fix linting errors: `npm run lint`
4. Check for missing dependencies

---

## 📝 Quick Reference

### Build Commands
```bash
npm run build          # Build for production
npm run preview        # Preview production build
npm run typecheck      # Check TypeScript
npm run lint           # Check code quality
```

### Deployment Commands
```bash
vercel --prod          # Deploy to Vercel production
netlify deploy --prod  # Deploy to Netlify production
```

### Environment Variables Required
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_APP_URL (optional, defaults to nexscout.co)
VITE_FACEBOOK_APP_ID (if using Facebook OAuth)
```

---

## ✅ Launch Checklist

- [ ] Production Supabase project created
- [ ] Database schema migrated
- [ ] Environment variables configured
- [ ] Build succeeds locally
- [ ] Deployed to hosting platform
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] All pages load correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Public chatbot accessible
- [ ] Settings save correctly
- [ ] Mobile responsive verified
- [ ] Error monitoring set up
- [ ] Backup strategy in place

---

## 🎉 You're Ready to Launch!

Once all checklist items are complete, your app will be live at **https://nexscout.co**!

**Next Steps:**
1. Share with beta users
2. Monitor for issues
3. Gather feedback
4. Iterate and improve

Good luck with your soft launch! 🚀

