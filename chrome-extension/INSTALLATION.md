# Quick Installation Guide

## 🚀 5-Minute Setup

### Step 1: Prepare Icon (Required)

**Option A - Use Online Converter (Easiest)**
1. Open https://cloudconvert.com/svg-to-png
2. Upload `icon128.svg` from this folder
3. Download the converted PNG
4. Rename it to `icon128.png`
5. Place it in this folder (replace the placeholder)

**Option B - Use Any 128x128 PNG**
Just use any square PNG image (128x128 pixels) as `icon128.png`

### Step 2: Load Extension in Chrome

1. Open Chrome browser
2. Type `chrome://extensions/` in the address bar
3. Toggle **Developer mode** ON (top-right corner)
4. Click **Load unpacked** button
5. Select this `chrome-extension/` folder
6. Extension installed! 🎉

### Step 3: Configure Settings

1. Click the NexScout.ai icon in Chrome toolbar
2. Click **Settings** link
3. Enter:
   - **API URL**: `https://YOUR_PROJECT.supabase.co`
   - **API Token**: Your Supabase anon key
4. Click **Save Settings**

### Step 4: Test It!

1. Go to Facebook, Instagram, LinkedIn, Twitter, or TikTok
2. Click the NexScout.ai extension icon
3. Select capture type and tags
4. Click **Capture & Send to NexScout**
5. Success! ✅

---

## 🛠️ Troubleshooting

**Extension won't load?**
- Make sure `icon128.png` exists
- Check all files are in the folder
- Try reloading the extension

**Can't save settings?**
- Check the URL format (must start with https://)
- Make sure both fields are filled

**Capture not working?**
- Refresh the social media page
- Check you're on a supported site
- Open browser console (F12) to check for errors

---

## 📋 Checklist

Before using the extension, make sure you have:

- [ ] Created `icon128.png` (128x128 pixels)
- [ ] Loaded extension in Chrome
- [ ] Enabled Developer mode
- [ ] Configured API URL in Settings
- [ ] Configured API Token in Settings
- [ ] Tested on a social media page

---

## 📁 All Files Included

```
chrome-extension/
├── manifest.json          ✅ Extension config
├── background.js          ✅ Service worker
├── contentScript.js       ✅ Page scraper
├── popup.html            ✅ Main UI
├── popup.js              ✅ UI logic
├── popup.css             ✅ Styles
├── options.html          ✅ Settings page
├── options.js            ✅ Settings logic
├── icon128.svg           ✅ Icon source
├── icon128.png           ⚠️  NEEDS TO BE CREATED
├── README.md             ✅ Full documentation
└── INSTALLATION.md       ✅ This file
```

---

## 🎯 What This Extension Does

1. **Detects Platform**: Auto-identifies Facebook, Instagram, LinkedIn, Twitter/X, TikTok
2. **Suggests Type**: Auto-suggests capture type (friends_list, post, profile, etc.)
3. **Extracts Data**: Captures visible text and HTML from the page
4. **Adds Tags**: Lets you tag prospects (Warm Market, OFW, Business Owner, etc.)
5. **Sends to Backend**: POSTs data to your NexScout API endpoint

---

## ✅ Ready to Go!

Once installed and configured, you can:
- Capture friends lists
- Capture posts with comments
- Capture profiles
- Tag prospects
- Add notes
- Send everything to NexScout for AI analysis

**Enjoy using NexScout.ai! 🚀**
