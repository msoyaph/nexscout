# NexScout.ai Chrome Extension v1.0.0

A powerful Chrome extension for capturing social media data and sending it to NexScout.ai for intelligent prospect analysis.

## Features

✅ **Smart Capture** - Extract visible text + HTML from social media pages
✅ **Auto-Detection** - Automatically detects platform (Facebook, Instagram, LinkedIn, Twitter/X, TikTok)
✅ **Auto-Suggestion** - Suggests capture type based on URL (friends_list, post, profile, etc.)
✅ **Tagging System** - 12 pre-defined tags for categorizing prospects
✅ **Secure Storage** - API credentials stored securely via chrome.storage.sync
✅ **Beautiful UI** - Clean, modern interface with gradient design
✅ **Error Handling** - Comprehensive error handling and user feedback

---

## Installation

### Step 1: Get the Extension Files

All extension files are in the `chrome-extension/` folder:

```
chrome-extension/
├── manifest.json
├── background.js
├── contentScript.js
├── popup.html
├── popup.js
├── popup.css
├── options.html
├── options.js
├── icon128.svg
└── README.md
```

### Step 2: Create Icon (Required)

The extension needs a `icon128.png` file. You have 3 options:

**Option 1 - Convert the SVG:**
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon128.svg`
3. Convert to PNG (128x128)
4. Save as `icon128.png` in the extension folder

**Option 2 - Use Inkscape (if installed):**
```bash
inkscape icon128.svg --export-type=png --export-filename=icon128.png --export-width=128 --export-height=128
```

**Option 3 - Use Any Image:**
Use any 128x128 PNG image as a temporary placeholder.

### Step 3: Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder
5. The extension should now appear in your extensions list

### Step 4: Configure API Credentials

1. Click the NexScout.ai extension icon
2. Click **Settings** in the popup
3. Enter your credentials:
   - **NexScout API URL**: Your Supabase project URL (e.g., `https://abcdefgh.supabase.co`)
   - **API Token**: Your Supabase anon key or service role key
4. Click **Save Settings**

---

## Usage

### Capturing Social Media Data

1. **Navigate** to a social media page (Facebook, Instagram, LinkedIn, Twitter/X, TikTok)
2. **Click** the NexScout.ai extension icon
3. **Review** the auto-detected platform and suggested capture type
4. **Select** capture type (or keep the suggestion):
   - Friends List
   - Group Members
   - Post with Comments
   - Comments Only
   - Messages
   - Profile
   - Custom / Other
5. **Choose** tags that apply (optional):
   - Warm Market
   - Cold Market
   - OFW (Overseas Filipino Worker)
   - Insurance Customer
   - Business Owner
   - High Engagement
   - Low Engagement
   - Financial Stress
   - Real Estate Buyer
   - Student
   - Freelancer
   - Other
6. **Add notes** (optional)
7. **Click** "Capture & Send to NexScout"
8. **Wait** for success message

The data is now in your NexScout backend and can be processed!

---

## Auto-Detection Logic

### Platform Detection

The extension automatically detects the platform based on URL:

| URL Contains | Platform |
|--------------|----------|
| `facebook.com` or `fb.com` | Facebook |
| `instagram.com` | Instagram |
| `linkedin.com` | LinkedIn |
| `twitter.com` or `x.com` | Twitter |
| `tiktok.com` | TikTok |
| Other | Unknown |

### Capture Type Suggestion

The extension suggests capture type based on URL path:

| URL Path Contains | Suggested Type |
|-------------------|----------------|
| `/friends` | friends_list |
| `/groups` | group_members |
| `/posts` or `/post/` | post |
| `/messages` or `/inbox` | messages |
| `/profile` or `/timeline` | profile |
| Other | custom |

---

## API Integration

### Endpoint

```
POST /api/browser-capture/ingest
```

### Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_API_TOKEN
```

### Payload Structure

```json
{
  "captureType": "friends_list",
  "platform": "facebook",
  "sourceUrl": "https://facebook.com/...",
  "htmlSnapshot": "<!DOCTYPE html>...",
  "textContent": "Visible text content...",
  "tags": ["warm_market", "ofw"],
  "notes": "Met at conference 2024",
  "metadata": {
    "capturedAt": "2025-11-26T12:00:00.000Z",
    "extensionVersion": "1.0.0",
    "autoDetectedPlatform": "facebook",
    "autoSuggestedType": "friends_list"
  }
}
```

### Expected Response

```json
{
  "success": true,
  "event_id": "uuid-here"
}
```

---

## File Structure

### `manifest.json`
Chrome Extension configuration (Manifest v3)
- Declares permissions
- Registers content scripts
- Defines popup and options pages

### `background.js`
Service worker that handles communication between popup and content script

### `contentScript.js`
Injected into social media pages
- Detects platform
- Suggests capture type
- Extracts visible text
- Captures HTML snapshot

### `popup.html` / `popup.js` / `popup.css`
Main UI popup
- Form for capture configuration
- Tag selection
- Send to NexScout button

### `options.html` / `options.js`
Settings page for API credentials

### `icon128.svg` / `icon128.png`
Extension icon

---

## Development

### Testing Locally

1. Make changes to any file
2. Go to `chrome://extensions/`
3. Click the **Reload** button on the NexScout.ai extension
4. Test your changes

### Debugging

**Content Script:**
- Open DevTools on the social media page
- Check Console tab for `console.log` messages

**Popup:**
- Right-click the extension icon
- Select "Inspect popup"
- Check Console tab

**Background:**
- Go to `chrome://extensions/`
- Click "Inspect views: service worker"
- Check Console tab

**Storage:**
```javascript
// Check stored settings
chrome.storage.sync.get(['apiUrl', 'apiToken'], (result) => {
  console.log(result);
});
```

---

## Security Considerations

✅ **HTTPS Only** - Extension only works on HTTPS social media sites
✅ **Secure Storage** - API credentials stored in `chrome.storage.sync`
✅ **No Auto-Capture** - User must manually trigger captures
✅ **Permissions** - Only requests necessary permissions (activeTab, scripting, storage)
✅ **No Background Scraping** - Content script only runs when user visits supported sites

---

## Troubleshooting

### "No active tab found"
- Make sure you're on a social media page (Facebook, Instagram, LinkedIn, Twitter/X, TikTok)
- Refresh the page and try again

### "Failed to communicate with page"
- The content script may not have loaded
- Refresh the page
- Reload the extension from `chrome://extensions/`

### "API credentials not configured"
- Go to Settings (click Settings link in popup)
- Enter your NexScout API URL and token
- Click Save Settings

### "API Error: 401"
- Your API token is invalid
- Update your token in Settings

### "API Error: 404"
- The API endpoint doesn't exist
- Check your API URL in Settings
- Ensure the `/api/browser-capture/ingest` endpoint is deployed

### Extension icon not showing
- You need to create `icon128.png`
- Follow the icon creation instructions above
- Reload the extension

---

## Backend Requirements

Your NexScout backend must have this endpoint:

```typescript
// POST /api/browser-capture/ingest

interface BrowserCapturePayload {
  captureType: string;
  platform: string;
  sourceUrl: string;
  htmlSnapshot: string;
  textContent: string;
  tags: string[];
  notes: string;
  metadata: {
    capturedAt: string;
    extensionVersion: string;
    autoDetectedPlatform?: string;
    autoSuggestedType?: string;
  };
}

// Expected response:
{
  success: boolean;
  event_id?: string;
}
```

---

## Version History

### v1.0.0 (2025-11-26)
- Initial release
- Platform auto-detection
- Capture type auto-suggestion
- 12 pre-defined tags
- Secure credential storage
- Beautiful gradient UI

---

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review the browser console for errors
3. Verify API credentials in Settings
4. Check that backend endpoint is accessible

---

## License

Proprietary - NexScout.ai

---

## Credits

Built for **NexScout.ai** - Intelligent Prospect Analysis Platform

Extension Version: 1.0.0
Manifest Version: 3
Compatible with: Chrome 88+
