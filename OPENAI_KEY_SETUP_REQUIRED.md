# OpenAI API Key Setup - CRITICAL REQUIREMENT

## Current Issue

Your OpenAI usage dashboard shows **0 requests**, which means the Edge Function cannot access the OpenAI API key. The chatbot is falling back to generic responses instead of using AI.

## Root Cause

The Edge Function needs the OpenAI API key to be configured as a **Supabase Edge Function Secret**, not just added to your project settings.

## How to Add OpenAI API Key (Choose ONE method)

### Method 1: Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **Project Settings** (gear icon in left sidebar)
4. Click on **Edge Functions** in the left menu
5. Scroll to **Environment Variables** or **Secrets** section
6. Click **Add Variable** or **Add Secret**
7. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (starts with `sk-`)
8. Click **Save**
9. **IMPORTANT**: Redeploy the Edge Function or restart it for changes to take effect

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
supabase secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

### Method 3: Via SQL (Vault - Alternative)

If your project has the vault extension enabled:

```sql
SELECT vault.create_secret('sk-your-actual-openai-key-here', 'OPENAI_API_KEY');
```

## How to Get an OpenAI API Key

If you don't have an OpenAI API key yet:

1. Go to https://platform.openai.com/signup
2. Create an account or sign in
3. Go to https://platform.openai.com/api-keys
4. Click **Create new secret key**
5. Copy the key (it starts with `sk-`)
6. **IMPORTANT**: Save this key securely - you won't be able to see it again

## Verification Steps

### Step 1: Check if Key is Accessible

After adding the key, the Edge Function will log:
- `[PublicChatbot] ✅ Found OpenAI key in environment` OR
- `[PublicChatbot] ✅ Found OpenAI key in vault`

### Step 2: Test the Chatbot

1. Go to https://nexscoutai.com/chat/soya
2. Send a message like "Hello"
3. Check your OpenAI usage dashboard
4. You should see **1 request** appear

### Step 3: Verify Custom Instructions are Working

The chatbot should now:
- Respond in Taglish (Tagalog-English mix)
- Mention WonderSoya products
- Use the Mila persona
- Give personalized, contextual responses

## Common Issues

### Issue 1: "I added the key but it's still not working"

**Solution**: Edge Functions use a separate secret storage from regular project settings. You need to add it specifically to **Edge Functions** secrets, not just project API settings.

### Issue 2: "Where do I find Edge Functions secrets?"

**Solution**:
- Dashboard → Project Settings → Edge Functions → Environment Variables
- OR use Supabase CLI: `supabase secrets set OPENAI_API_KEY=sk-...`

### Issue 3: "I don't see the Edge Functions section"

**Solution**: Make sure you're in:
1. Your project dashboard (not organization settings)
2. Project Settings (gear icon)
3. Look for "Edge Functions" or "Functions" in left menu

### Issue 4: "The key works elsewhere but not in Supabase"

**Solution**:
1. Verify the key is valid at https://platform.openai.com/api-keys
2. Make sure you have API credits/billing enabled in OpenAI
3. Check that the key has not been revoked
4. Try creating a new key and using that instead

## Current System Status

### ✅ What's Working

1. **Edge Function**: Deployed and accessible at `/functions/v1/public-chatbot-chat`
2. **JWT Verification**: Disabled for public access (`verifyJWT: false`)
3. **Database Setup**: All tables configured correctly
4. **AI Agent Settings**: Configured for username 'soya'
5. **Custom Instructions**: 10,258 characters of Mila persona saved
6. **Settings Enabled**:
   - `use_custom_instructions = true`
   - `instructions_override_intelligence = true`
7. **Frontend**: Properly wired to call the Edge Function
8. **Vault Fallback**: Edge Function now checks vault if env var not found

### ❌ What's Missing

1. **OpenAI API Key**: Not accessible to Edge Function
   - Not in environment variables
   - Not in vault
   - Result: 0 requests to OpenAI API

## Expected Behavior After Fix

Once you add the OpenAI API key:

1. **Immediate**: Edge Function can call OpenAI GPT-4o-mini
2. **Response Quality**: Chatbot uses 10,258-character Mila persona
3. **Language**: Responses in Taglish (Filipino-English)
4. **Product Knowledge**: Mentions WonderSoya products appropriately
5. **Personalization**: Contextual, helpful responses tailored to visitor needs
6. **Analytics**: OpenAI usage dashboard shows increasing request count
7. **Prospect Creation**: Qualified visitors automatically added to your prospects
8. **Intelligence**: All 10+ AI engines activated (scoring, matching, closing, etc.)

## Cost Estimation

GPT-4o-mini pricing (as of Dec 2024):
- **Input**: $0.150 per 1M tokens (~$0.15 per 1000 conversations)
- **Output**: $0.600 per 1M tokens (~$0.60 per 1000 conversations)
- **Average conversation**: ~2000-3000 tokens total
- **Estimated cost**: $0.001-0.002 per conversation (~₱0.05-0.10 per chat)

Very affordable for production use!

## Next Steps

1. **Add OpenAI API key** using Method 1 (Dashboard) above
2. **Test the chatbot** at https://nexscoutai.com/chat/soya
3. **Verify usage** in your OpenAI dashboard
4. **Celebrate** - Your AI chatbot with custom Mila persona is live!

## Support

If you continue to have issues after following this guide:

1. Check Supabase Edge Function logs for error messages
2. Verify your OpenAI account has billing enabled
3. Try creating a fresh OpenAI API key
4. Confirm the key is added to **Edge Functions** secrets (not just project settings)

---

**Remember**: The Edge Function has been updated to check both environment variables AND vault for the OpenAI key. Once you add it to either location, it will work immediately!
