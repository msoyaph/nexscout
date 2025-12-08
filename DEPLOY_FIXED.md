# 🚀 Fixed Deployment Instructions

## ✅ Solution: Use npx (No Global Installation Needed)

You don't need to install Vercel CLI globally! Use `npx` instead, which runs it without installation.

---

## Quick Deploy (3 Steps)

### Step 1: Build
```bash
npm run build
```

### Step 2: Deploy (using npx - no installation needed)
```bash
npx vercel --prod
```

**That's it!** `npx` will download and run Vercel CLI automatically.

---

## Alternative: Install Locally (No Permissions Needed)

If you prefer to install it locally in your project:

```bash
npm install --save-dev vercel
```

Then use:
```bash
npm run deploy
```

Or directly:
```bash
npx vercel --prod
```

---

## Full Deployment Process

### 1. Build the Application
```bash
npm run build
```

### 2. Login to Vercel (first time only)
```bash
npx vercel login
```

### 3. Deploy to Production
```bash
npx vercel --prod
```

**What happens:**
- First time: `npx` downloads Vercel CLI temporarily
- You'll be prompted to link your project (if not already linked)
- Vercel uploads your `dist/` folder
- Creates production deployment
- Provides deployment URL

---

## Using the Deploy Script

The `deploy.sh` script has been updated to use `npx`:

```bash
./deploy.sh
```

Or use npm script:
```bash
npm run deploy
```

---

## Environment Variables (CRITICAL)

**Before deploying**, set these in Vercel Dashboard:

1. Go to: https://vercel.com → Your Project → Settings → Environment Variables

2. Add for **Production**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_URL=https://nexscout.co
   ```

3. **IMPORTANT:** 
   - `VITE_SUPABASE_URL` must use HTTPS
   - Redeploy after adding variables

---

## Troubleshooting

### "Command not found" errors
- Use `npx vercel` instead of `vercel`
- No installation needed with `npx`

### Permission errors
- Don't use `sudo` - use `npx` instead
- Or install locally: `npm install --save-dev vercel`

### Build fails
```bash
# Check for errors
npm run typecheck
npm run lint

# Clean rebuild
rm -rf dist node_modules
npm install
npm run build
```

---

## Ready to Deploy?

```bash
# Option 1: Using npm script
npm run deploy

# Option 2: Using deploy script
./deploy.sh

# Option 3: Manual
npm run build
npx vercel --prod
```

**No global installation needed!** 🎉




