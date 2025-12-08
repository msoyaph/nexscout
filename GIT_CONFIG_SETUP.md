# ⚙️ Git Configuration Setup

## 🔧 Configure Git User Name and Email

Before making commits, you need to configure your Git identity.

### **Option 1: Global Configuration (Recommended)**

This sets your identity for all Git repositories on your computer:

```bash
# Set your name
git config --global user.name "Your Name"

# Set your email (use the email associated with your GitHub account)
git config --global user.email "your-email@example.com"
```

**Example:**
```bash
git config --global user.name "Cliff Sumalpong"
git config --global user.email "geoffmax22@gmail.com"
```

### **Option 2: Repository-Specific Configuration**

If you want different identity for this repository only:

```bash
# Set for this repository only
git config user.name "Your Name"
git config user.email "your-email@example.com"
```

---

## ✅ Verify Configuration

After setting, verify it's configured correctly:

```bash
# Check global config
git config --global user.name
git config --global user.email

# Check repository-specific config
git config user.name
git config user.email
```

---

## 📝 Quick Setup Commands

Run these commands in your terminal:

```bash
cd /Users/cliffsumalpong/Documents/NexScout2

# Set your name (replace with your actual name)
git config --global user.name "Cliff Sumalpong"

# Set your email (use your GitHub email)
git config --global user.email "geoffmax22@gmail.com"

# Verify
git config --global user.name
git config --global user.email
```

---

## 🎯 After Configuration

Once configured, you can now:

1. **Stage changes:**
   ```bash
   git add .
   ```

2. **Commit:**
   ```bash
   git commit -m "Your commit message"
   ```

3. **Push:**
   ```bash
   git push origin main
   ```

---

## 💡 Tips

- **Use the same email** as your GitHub account for commits to be linked to your profile
- **Global config** is recommended so you don't have to set it for each repository
- **You can change it anytime** with the same commands

---

## 🔍 View All Git Config

To see all your Git configuration:

```bash
git config --list
```

Or just global config:

```bash
git config --global --list
```




