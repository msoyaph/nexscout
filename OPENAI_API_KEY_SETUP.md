# OpenAI API Key Setup for Public Chatbot

## Problem Identified

The public-facing AI chatbot is returning **generic, repetitive responses** instead of using your custom AI instructions because:

1. ✅ Custom instructions ARE properly configured (5197 characters)
2. ✅ `use_custom_instructions` is set to `true`
3. ✅ `instructions_override_intelligence` is set to `true`
4. ❌ **OpenAI API key is NOT configured** in Supabase Edge Functions

**Current Behavior:** The chatbot falls back to hardcoded generic responses that only extract minimal info from your custom instructions.

**Expected Behavior:** The chatbot should use OpenAI GPT-3.5/4 with your full custom instructions to generate intelligent, personalized responses.

---

## Solution: Add OpenAI API Key

### Step 1: Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

### Step 2: Add Key to Supabase

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Settings**
3. Under "Secrets", add:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-your-actual-key-here`
4. Click "Save"

**Option B: Via Supabase CLI**
```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 3: Redeploy Edge Function

The `public-chatbot-chat` function needs to be redeployed to pick up the new secret:

```bash
# Using Supabase CLI
supabase functions deploy public-chatbot-chat
```

Or redeploy from the dashboard.

### Step 4: Test

Visit your public chatbot and send a message. Check the Edge Function logs:

**Before (No API Key):**
```
[PublicChatbot] No OpenAI key configured, using fallback
[PublicChatbot] Using fallback - OpenAI key not configured!
```

**After (With API Key):**
```
[PublicChatbot] Calling AI with X messages
[PublicChatbot] AI response generated successfully
```

---

## How It Works

### With OpenAI Key (CORRECT)
```
User Message
  ↓
Load Custom Instructions (5197 chars)
  ↓
Build System Prompt with:
  - Your custom personality (Mila)
  - Product knowledge (Millennium Soya)
  - Sales scripts and flows
  - Taglish conversation style
  ↓
Send to OpenAI GPT-3.5-turbo
  ↓
✅ Intelligent, personalized response
```

### Without OpenAI Key (CURRENT)
```
User Message
  ↓
Load Custom Instructions
  ↓
Try to extract company name
  ↓
Use hardcoded generic response
  ↓
❌ Generic, repetitive response
```

---

## Cost Information

### OpenAI Pricing (GPT-3.5-Turbo)
- **Input:** $0.0010 per 1K tokens (~750 words)
- **Output:** $0.0020 per 1K tokens (~750 words)

### Estimated Costs
- **Per conversation:** ~$0.01 - $0.05
- **100 conversations/day:** ~$1 - $5/day
- **1000 conversations/day:** ~$10 - $50/day

**Your custom instructions (5197 chars) ≈ 1300 tokens** sent with each message.

---

## Alternative: Use Cheaper/Free Models

If OpenAI costs are a concern, you can modify the edge function to use:

1. **GPT-3.5-Turbo** (cheapest OpenAI) - Current default
2. **GPT-4o-mini** - More capable, still affordable
3. **Anthropic Claude** - Alternative provider
4. **Local models** via Ollama - Free but requires hosting

---

## Verification Checklist

- [ ] OpenAI account created
- [ ] API key generated
- [ ] Key added to Supabase secrets as `OPENAI_API_KEY`
- [ ] Edge function redeployed
- [ ] Chatbot tested with messages
- [ ] Logs show "AI response generated successfully"
- [ ] Responses are intelligent and follow custom instructions

---

## Troubleshooting

**Still getting generic responses?**

1. Check Supabase Edge Function logs
2. Verify secret is named exactly `OPENAI_API_KEY`
3. Ensure function was redeployed after adding secret
4. Check OpenAI account has credits/billing enabled
5. Test API key directly: https://platform.openai.com/playground

**API Key not working?**

```bash
# Test your key
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer sk-your-key" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hi"}]}'
```

---

## Next Steps

1. **Add OpenAI API key** following steps above
2. **Test thoroughly** with various messages
3. **Monitor usage** in OpenAI dashboard
4. **Set usage limits** to control costs
5. Consider upgrading to GPT-4 for even better responses

**Once configured, your custom instructions will work perfectly!** 🎉
