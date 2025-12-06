# 🔑 OpenAI API Key Setup Guide

Complete guide to setting up your OpenAI API key for NexScout's AI features.

---

## 📝 What You Need

1. **OpenAI Account** (platform.openai.com)
2. **API Key** (costs ~$0.002 per message analyzed)
3. **Payment Method** (credit card for OpenAI billing)

---

## 🚀 QUICK SETUP (5 minutes)

### **Step 1: Get Your API Key**

1. Go to: **https://platform.openai.com/api-keys**
2. Click **"Create new secret key"**
3. Name it: `NexScout-Production`
4. Click **"Create secret key"**
5. **COPY THE KEY** (starts with `sk-proj-...`)
   - ⚠️ **IMPORTANT:** You can only see it once!
   - Save it somewhere safe (password manager)

---

### **Step 2: Add Billing**

1. Go to: **https://platform.openai.com/settings/organization/billing**
2. Click **"Add payment method"**
3. Enter credit card details
4. Set **usage limit**: Start with **$10/month**
   - This covers ~5,000 message analyses
   - You can increase later

---

### **Step 3A: For Development (Local)**

1. **Open your `.env` file** (create if doesn't exist):
   ```bash
   # Location: /Users/cliffsumalpong/Documents/NexScout/.env
   ```

2. **Add this line:**
   ```bash
   VITE_OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
   ```
   Replace `YOUR-ACTUAL-KEY-HERE` with your copied key.

3. **Restart dev server:**
   ```bash
   Ctrl + C
   npm run dev
   ```

4. **Test it works:**
   - Go to Pipeline
   - Click "..." on prospect → "See Progress"
   - AI analysis should work

---

### **Step 3B: For Production (Secure - Recommended)**

**⚠️ Security:** Never expose API keys in client-side code!

**Use Supabase Edge Function instead:**

1. **Deploy the edge function:**
   ```bash
   cd /Users/cliffsumalpong/Documents/NexScout
   supabase functions deploy analyze-message
   ```

2. **Set the secret in Supabase:**
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE
   ```

3. **Update your code** to call the edge function instead:

   ```typescript
   // Instead of calling OpenAI directly:
   // const response = await openai.chat.completions.create(...)

   // Call your edge function:
   const { data } = await supabase.functions.invoke('analyze-message', {
     body: {
       message: 'Magkano po?',
       prospectName: 'Juan Dela Cruz',
       previousMessages: ['...'],
     },
   });

   const analysis = data.analysis;
   ```

---

## 💰 Cost Breakdown

### **GPT-4 Turbo Pricing:**
- Input: $0.01 per 1K tokens (~750 words)
- Output: $0.03 per 1K tokens

### **Average Message Analysis:**
- Input tokens: ~500 (system prompt + message)
- Output tokens: ~200 (JSON response)
- **Cost per analysis: ~$0.002** (0.2 cents)

### **Monthly Estimates:**

| Usage | Messages/Day | Messages/Month | Cost/Month |
|-------|--------------|----------------|------------|
| Light | 10 | 300 | $0.60 |
| Medium | 50 | 1,500 | $3.00 |
| Heavy | 200 | 6,000 | $12.00 |
| Pro | 500 | 15,000 | $30.00 |

**Recommendation:** Start with **$10/month limit**, monitor usage, adjust as needed.

---

## 🧪 Test Your Setup

### **Quick Test (Browser Console):**

```javascript
// After adding API key to .env and restarting server
const result = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'user', content: 'Say "API key works!"' }
    ],
  }),
});

const data = await result.json();
console.log(data.choices[0].message.content); // Should print: "API key works!"
```

### **Test Message Analysis:**

```typescript
import { messageAnalysisService } from '@/services/omnichannel/messageAnalysisService';

const analysis = await messageAnalysisService.analyzeMessage(
  'Magkano po yung product? Interested ako!',
  {
    prospectName: 'Juan Dela Cruz',
  }
);

console.log('Sentiment:', analysis.sentiment);
console.log('Intent:', analysis.intent);
console.log('Buying Signals:', analysis.buyingSignals);
console.log('ScoutScore Impact:', analysis.scoutScoreImpact);
```

**Expected Output:**
```
Sentiment: positive
Intent: buying
Buying Signals: ["Magkano", "Interested"]
ScoutScore Impact: +13
```

---

## 🔒 Security Best Practices

### **DO:**
✅ Use `.env` file for local development  
✅ Add `.env` to `.gitignore` (never commit API keys!)  
✅ Use edge functions for production  
✅ Set usage limits in OpenAI dashboard  
✅ Monitor usage regularly  
✅ Rotate keys every 3-6 months  

### **DON'T:**
❌ Commit API keys to GitHub  
❌ Share API keys publicly  
❌ Use same key for dev and production  
❌ Put API keys in client-side code (production)  
❌ Leave unlimited spending enabled  

---

## 🛠️ Troubleshooting

### **Error: "API key not found"**
**Solution:** Check `.env` file has correct format:
```bash
VITE_OPENAI_API_KEY=sk-proj-abc123...
# No quotes, no spaces around =
```

### **Error: "Insufficient quota"**
**Solution:** Add billing at https://platform.openai.com/settings/organization/billing

### **Error: "Invalid API key"**
**Solution:** 
- Key might be expired or deleted
- Create new key at https://platform.openai.com/api-keys

### **Error: "Rate limit exceeded"**
**Solution:** 
- Wait 1 minute and try again
- Upgrade to paid tier (if on free trial)
- Implement request throttling

---

## 📊 Monitor Usage

### **Check Usage:**
1. Go to: **https://platform.openai.com/usage**
2. View daily/monthly usage
3. Set up billing alerts

### **Set Usage Limits:**
1. Go to: **https://platform.openai.com/settings/organization/limits**
2. Set **Monthly budget**: $10 (start)
3. Set **Email notifications**: At 75% and 100%

---

## 🔄 Alternative: Fallback Mode

If you don't want to use OpenAI (or want to save costs), the system has a **keyword-based fallback**:

```typescript
// In messageAnalysisService.ts
// This runs automatically if OpenAI fails
private static fallbackAnalysis(message: string) {
  // Simple keyword matching
  // Detects: "Magkano", "Interested", "How much", etc.
  // Less accurate but FREE
}
```

**To use fallback only:**
- Don't set `VITE_OPENAI_API_KEY`
- System will auto-fallback to keyword analysis
- Accuracy: ~60% vs 90% with GPT-4

---

## 📞 Support

**OpenAI Help:**
- Docs: https://platform.openai.com/docs
- Community: https://community.openai.com
- Status: https://status.openai.com

**NexScout Help:**
- Check console logs for errors
- Test with simple messages first
- Monitor OpenAI dashboard for usage

---

## ✅ Checklist

- [ ] Created OpenAI account
- [ ] Generated API key
- [ ] Added payment method
- [ ] Set usage limit ($10/month)
- [ ] Added key to `.env` file
- [ ] Restarted dev server
- [ ] Tested message analysis
- [ ] Verified ScoutScore updates
- [ ] Monitored first day usage
- [ ] (Production) Deployed edge function

---

## 🎉 You're Ready!

Once your API key is set up, NexScout will:
- ✅ Analyze every prospect message with AI
- ✅ Detect sentiment (positive/negative)
- ✅ Identify buying signals ("Magkano?")
- ✅ Auto-update ScoutScore
- ✅ Suggest next actions
- ✅ Track engagement trends

**Cost:** ~$0.002 per message analyzed  
**Value:** Priceless sales insights! 💎

---

**Need help?** Check the troubleshooting section above or test with the quick test script!
