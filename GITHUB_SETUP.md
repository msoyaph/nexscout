# 🐙 GitHub Setup Guide for NexScout

Complete guide to prepare and push your NexScout repository to GitHub.

---

## ✅ Pre-Commit Checklist

Before committing, ensure:

- [x] `.gitignore` is properly configured (✅ Done)
- [x] `README.md` created (✅ Done)
- [x] `.env.example` created (✅ Done)
- [ ] No `.env` files in repository
- [ ] No `node_modules` in repository
- [ ] No `dist` folder in repository
- [ ] No sensitive API keys in code

---

## 🚀 Step 1: Initialize Git Repository

If git is not initialized:

```bash
cd /Users/cliffsumalpong/Documents/NexScout2
git init
```

---

## 🔍 Step 2: Verify What Will Be Committed

Check what files will be committed:

```bash
git status
```

**Expected output:**
- ✅ Source files (`src/`)
- ✅ Configuration files (`package.json`, `vite.config.ts`, etc.)
- ✅ Documentation files (`.md` files)
- ✅ Public assets (`public/`)
- ❌ `node_modules/` (should be ignored)
- ❌ `.env*` files (should be ignored)
- ❌ `dist/` folder (should be ignored)

---

## 🧹 Step 3: Clean Up Before Committing

### Remove any accidentally tracked files:

```bash
# Remove .env files if they were tracked
git rm --cached .env .env.local .env.production 2>/dev/null || true

# Remove node_modules if it was tracked
git rm -r --cached node_modules 2>/dev/null || true

# Remove dist if it was tracked
git rm -r --cached dist 2>/dev/null || true
```

### Verify sensitive files are not tracked:

```bash
# Check for any .env files
git ls-files | grep -E "\.env$|\.env\."

# Should return nothing (or only .env.example)
```

---

## 📝 Step 4: Create Initial Commit

```bash
# Stage all files
git add .

# Verify what's staged
git status

# Create initial commit
git commit -m "Initial commit: NexScout AI Sales Intelligence Platform

- React 18 + TypeScript + Vite setup
- Supabase integration
- Complete UI with 60+ pages
- AI-powered features
- Pipeline management
- Chatbot system
- Ready for production deployment"
```

---

## 🐙 Step 5: Create GitHub Repository

1. **Go to GitHub:** https://github.com/new

2. **Repository settings:**
   - Repository name: `nexscout` (or your preferred name)
   - Description: `AI-powered sales intelligence platform for the Filipino market`
   - Visibility: **Private** (recommended for now) or **Public**
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

3. **Click "Create repository"**

---

## 🔗 Step 6: Connect Local Repository to GitHub

After creating the GitHub repository, you'll see instructions. Use these commands:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/nexscout.git

# Or if using SSH:
# git remote add origin git@github.com:YOUR_USERNAME/nexscout.git

# Verify remote
git remote -v
```

---

## 📤 Step 7: Push to GitHub

```bash
# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**If you get authentication errors:**

- **HTTPS:** You'll need a Personal Access Token (see below)
- **SSH:** Set up SSH keys (see below)

---

## 🔐 Step 8: Authentication Setup

### Option A: Personal Access Token (HTTPS)

1. **Create a token:**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `NexScout Development`
   - Expiration: Choose your preference
   - Scopes: Check `repo` (full control)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Use token when pushing:**
   ```bash
   git push -u origin main
   # Username: your-github-username
   # Password: paste-your-token-here
   ```

3. **Store credentials (optional):**
   ```bash
   git config --global credential.helper store
   ```

### Option B: SSH Keys (Recommended)

1. **Generate SSH key:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Press Enter to accept default location
   # Enter a passphrase (optional but recommended)
   ```

2. **Copy public key:**
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # Copy the entire output
   ```

3. **Add to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Title: `NexScout Development`
   - Key: Paste your public key
   - Click "Add SSH key"

4. **Test connection:**
   ```bash
   ssh -T git@github.com
   # Should see: "Hi YOUR_USERNAME! You've successfully authenticated..."
   ```

5. **Update remote to use SSH:**
   ```bash
   git remote set-url origin git@github.com:YOUR_USERNAME/nexscout.git
   ```

---

## ✅ Step 9: Verify Everything is Pushed

1. **Check remote status:**
   ```bash
   git status
   # Should show: "Your branch is up to date with 'origin/main'"
   ```

2. **Visit your GitHub repository:**
   - Go to: `https://github.com/YOUR_USERNAME/nexscout`
   - Verify all files are there
   - Check that `.env` files are NOT visible
   - Check that `node_modules` is NOT visible

---

## 🔄 Step 10: Future Commits

For future changes:

```bash
# Stage changes
git add .

# Or stage specific files
git add src/pages/SomePage.tsx

# Commit
git commit -m "Description of changes"

# Push
git push
```

---

## 🛡️ Security Reminders

### ⚠️ NEVER Commit:

- `.env` files
- `.env.local` files
- `.env.production` files
- API keys in code
- Service role keys
- Database passwords
- Personal access tokens

### ✅ Always Commit:

- `.env.example` (template file)
- Source code
- Configuration files (without secrets)
- Documentation

---

## 🐛 Troubleshooting

### Issue: "fatal: remote origin already exists"

**Solution:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/nexscout.git
```

### Issue: "Permission denied (publickey)"

**Solution:**
- Set up SSH keys (see Step 8, Option B)
- Or use HTTPS with Personal Access Token

### Issue: Large files won't push

**Solution:**
```bash
# Check for large files
find . -type f -size +50M ! -path "./node_modules/*" ! -path "./.git/*"

# If found, add to .gitignore and remove from tracking:
git rm --cached large-file.zip
git commit -m "Remove large file"
```

### Issue: Accidentally committed .env file

**Solution:**
```bash
# Remove from git (but keep local file)
git rm --cached .env
git commit -m "Remove .env from repository"
git push

# If already pushed, you need to:
# 1. Rotate the exposed API keys immediately
# 2. Use git filter-branch or BFG Repo-Cleaner to remove from history
```

---

## 📋 Quick Reference Commands

```bash
# Initialize repository
git init

# Check status
git status

# Stage files
git add .

# Commit
git commit -m "Your commit message"

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/nexscout.git

# Push
git push -u origin main

# View remotes
git remote -v

# View commit history
git log --oneline
```

---

## 🎉 You're All Set!

Your repository is now on GitHub and ready for:
- ✅ Collaboration
- ✅ CI/CD integration (Vercel, Netlify)
- ✅ Version control
- ✅ Issue tracking
- ✅ Pull requests

**Next Steps:**
1. Set up branch protection rules (Settings → Branches)
2. Add collaborators (Settings → Collaborators)
3. Set up GitHub Actions for CI/CD (optional)
4. Connect to Vercel/Netlify for auto-deployment

---

**Need help?** Check GitHub documentation: https://docs.github.com

