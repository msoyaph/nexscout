# Magic Button Setup - Complete Guide

**Status:** Edge Function Deployed ✅  
**Next Step:** Configure OpenAI API Key

---

## ✅ What's Done

1. **Edge Function Deployed**
   - `generate-ai-content` is now live
   - URL: `https://dohrkewdanppkqulvhhz.supabase.co/functions/v1/generate-ai-content`

2. **Error Handling Improved**
   - Better error messages
   - Network error detection
   - User-friendly feedback

---

## 🔑 Required: OpenAI API Key

The Magic button requires an OpenAI API key to be configured in Supabase.

### Quick Setup (2 minutes)

**Option 1: Supabase Dashboard (Recommended)**

1. Go to: https://supabase.com/dashboard/project/dohrkewdanppkqulvhhz/functions
2. Click **"Secrets"** or **"Environment Variables"**
3. Click **"Add Secret"**
4. Enter:
   - **Name:** `OPENAI_API_KEY`
   - **Value:** `sk-proj-your-actual-key-here`
5. Click **"Save"**

**Option 2: Supabase CLI**

```bash
supabase secrets set OPENAI_API_KEY=sk-proj-your-actual-key-here
```

### Get Your OpenAI API Key

1. Go to: https://platform.openai.com/api-keys
2. Click **"Create new secret key"**
3. Copy the key (starts with `sk-proj-...`)
4. **Important:** Save it securely - you can only see it once!

---

## 🧪 Testing the Magic Button

After adding the OpenAI API key:

1. Go to **Chatbot Settings** → **Training** tab
2. Enable **"Custom Instructions"**
3. Add some content in the rich text editor
4. Click the **"Improve"** (Magic) button
5. You should see:
   - ✨ Sparkle animation
   - Content being improved
   - Formatted, organized output

---

## 🔍 Troubleshooting

### Error: "Failed to fetch"
- ✅ **Fixed:** Edge function is now deployed
- ⚠️ **Check:** OpenAI API key is configured
- ⚠️ **Check:** Internet connection

### Error: "Insufficient energy"
- User doesn't have enough energy
- Check energy balance in user profile

### Error: "OpenAI API error: 401"
- Invalid or missing OpenAI API key
- Re-check the secret in Supabase dashboard

### Error: "OpenAI API error: 429"
- Rate limit exceeded
- Wait a few minutes and try again

---

## 📝 Edge Function Details

**Function:** `generate-ai-content`  
**Endpoint:** `/functions/v1/generate-ai-content`  
**Method:** POST  
**Auth:** Required (JWT token)  
**Required Secret:** `OPENAI_API_KEY`

**Request Format:**
```json
{
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "model": "gpt-4",
  "temperature": 0.3,
  "max_tokens": 1000,
  "generationType": "ai_chatbot_response"
}
```

---

## ✅ Verification Checklist

- [x] Edge function deployed
- [ ] OpenAI API key added to Supabase secrets
- [ ] Test Magic button with sample content
- [ ] Verify improved output
- [ ] Test Undo button
- [ ] Check error messages display correctly

---

**Status:** Ready to test once OpenAI API key is configured  
**Last Updated:** December 2025


