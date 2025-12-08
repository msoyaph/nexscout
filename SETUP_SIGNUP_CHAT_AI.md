# Setup Guide: Wire Signup Page Chatbox to AI System

## ✅ Implementation Complete

The signup page chatbox is now wired to your AI system! Here's what was done:

### What Was Implemented

1. **SuperAdmin Connection** - Chatbox connects to `geoffmax22@gmail.com` account
2. **Public Chatbot Engine** - Uses the same AI system as public chat pages
3. **Session Management** - Creates `public_chat_sessions` for each visitor
4. **Prospect Creation** - Automatically converts qualified visitors to prospects
5. **AI System Instructions** - Will use your custom instructions from `chatbot_settings`

---

## 🔧 Setup Steps

### Step 1: Save AI System Instructions to Database

You need to copy the AI System Instructions from `NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md` into your SuperAdmin's `chatbot_settings`.

**Option A: Via Supabase Dashboard**

1. Go to Supabase Dashboard → SQL Editor
2. Run this query (replace `YOUR_INSTRUCTIONS_HERE` with the full content from `NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md`):

```sql
-- Get SuperAdmin user ID
SELECT id FROM profiles WHERE email = 'geoffmax22@gmail.com';

-- Then update chatbot_settings (replace USER_ID with the ID from above)
INSERT INTO chatbot_settings (
  user_id,
  display_name,
  greeting_message,
  custom_system_instructions,
  use_custom_instructions,
  instructions_override_intelligence,
  is_active
)
VALUES (
  'USER_ID_FROM_ABOVE',  -- Replace with actual user ID
  'NexScout AI Assistant',
  'Hi! 👋 I''m your NexScout AI assistant. Ask me anything about our features, pricing, or how we can help grow your business!',
  'YOUR_INSTRUCTIONS_HERE',  -- Paste full content from NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md
  true,   -- Enable custom instructions
  true,   -- Override intelligence (use ONLY custom instructions)
  true
)
ON CONFLICT (user_id)
DO UPDATE SET
  custom_system_instructions = EXCLUDED.custom_system_instructions,
  use_custom_instructions = true,
  instructions_override_intelligence = true,
  updated_at = now();
```

**Option B: Via Chatbot Settings Page**

1. Login as SuperAdmin (`geoffmax22@gmail.com`)
2. Go to **Chat → Settings → Training Data**
3. Copy the entire content from `NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md`
4. Paste into **"AI System Instructions"** text area
5. Make sure **"Enable Custom Instructions"** is ON
6. Make sure **"Override Intelligence"** is ON
7. Click **"Save Changes"**

---

## 🎯 How It Works

### 1. Visitor Opens Chatbox
- Visitor clicks the floating chat button on signup page
- System creates a `public_chat_sessions` record
- Links session to SuperAdmin user ID

### 2. Visitor Sends Message
- Message is saved to `public_chat_messages`
- Edge Function processes message using:
  - SuperAdmin's `chatbot_settings.custom_system_instructions`
  - AI System Instructions you configured
  - Company intelligence (if override is OFF)

### 3. AI Responds
- AI uses your custom instructions
- Responds in Taglish, Filipino-friendly tone
- Handles objections, converts to signup
- Tracks buying signals and intent

### 4. Prospect Creation
- If visitor provides contact info (name, email, phone)
- And shows buying intent (high score)
- System automatically creates prospect in your pipeline
- Links to SuperAdmin's prospect list

---

## 📊 What Gets Tracked

### In `public_chat_sessions`:
- `visitor_session_id` - Unique visitor ID
- `buying_intent_score` - 0.0 to 1.0
- `qualification_score` - 0.0 to 1.0
- `conversation_context` - Intent, temperature, signals
- `status` - active, converted, archived

### In `public_chat_messages`:
- All messages (visitor + AI)
- `ai_emotion` - Detected emotion
- `ai_intent` - Detected intent
- `ai_buying_signals` - Array of signals

### In `prospects` (if qualified):
- `full_name` - From conversation
- `email` - If provided
- `phone` - If provided
- `scout_score` - Based on conversation
- `pipeline_stage` - Usually 'new' or 'contacted'
- `metadata` - Conversation summary

---

## 🔍 Viewing Conversations

### Option 1: Via Chatbot Sessions Page
1. Login as SuperAdmin
2. Go to **Chat → Sessions**
3. Look for sessions with `chatbot_id = 'signup-page-chat'`
4. Click to view full conversation

### Option 2: Via Database
```sql
-- View all signup page chat sessions
SELECT * FROM public_chat_sessions
WHERE chatbot_id = 'signup-page-chat'
ORDER BY created_at DESC;

-- View messages for a session
SELECT * FROM public_chat_messages
WHERE session_id = 'SESSION_ID_HERE'
ORDER BY created_at ASC;
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] SuperAdmin user ID is found (`geoffmax22@gmail.com`)
- [ ] `chatbot_settings` exists for SuperAdmin
- [ ] `custom_system_instructions` contains full AI instructions
- [ ] `use_custom_instructions = true`
- [ ] `instructions_override_intelligence = true`
- [ ] Chatbox opens on signup page
- [ ] Messages are sent and received
- [ ] Conversations are saved to database
- [ ] Prospects are created when qualified

---

## 🐛 Troubleshooting

### Chatbox doesn't respond
- Check browser console for errors
- Verify SuperAdmin user ID is found
- Check Edge Function logs in Supabase

### AI responses are generic
- Verify `custom_system_instructions` is saved
- Check `use_custom_instructions = true`
- Check `instructions_override_intelligence = true`

### Prospects not created
- Check if visitor provided contact info
- Verify `buying_intent_score` is high enough
- Check `auto_convert_to_prospect` setting

### Messages not saving
- Check Supabase RLS policies
- Verify `public_chat_sessions` and `public_chat_messages` tables exist
- Check Edge Function is deployed

---

## 📝 Next Steps

1. **Save AI Instructions** - Copy from `NEXSCOUT_AI_SYSTEM_INSTRUCTIONS.md` to `chatbot_settings`
2. **Test Chatbox** - Open signup page and test conversation
3. **Monitor Sessions** - Check Chatbot Sessions page for new conversations
4. **Review Prospects** - Check Pipeline page for auto-created prospects

---

**Status:** ✅ Code Complete - Needs AI Instructions Setup

**Ready to use once AI System Instructions are saved to database!**




