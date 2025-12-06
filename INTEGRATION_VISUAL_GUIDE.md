# 🎨 PREMIUM AUTOMATION - VISUAL TESTING GUIDE

**Quick reference for testing all integrated features**

---

## 🔄 SETUP (5 minutes)

### Step 1: Deploy SQL Migrations
```
1. Open: https://supabase.com/dashboard
2. Click: Your NexScout project
3. Click: "SQL Editor" (left sidebar)
4. Click: "New query"
5. Copy/paste: 20251203200000_update_automation_pricing_2_5x.sql
6. Click: "Run"
7. Wait for: "Success. No rows returned"
8. Click: "New query"
9. Copy/paste: 20251203201000_update_pipeline_trigger_costs.sql
10. Click: "Run"
11. Wait for: "Success. No rows returned"
```

### Step 2: Restart Dev Server
```bash
# Terminal
Ctrl + C
npm run dev
```

**✅ Ready to test!**

---

## 🧪 TEST ROUTE 1: PROSPECT DETAIL PAGE

### What to Look For:

```
┌─────────────────────────────────────────┐
│ 📱 Prospect Detail Page                 │
├─────────────────────────────────────────┤
│                                         │
│  👤 Juan Dela Cruz                      │
│  🌟 Scout Score: 85                     │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ ✨ AI SUGGESTS                    ║ │
│  ║ Follow-Up - High score, send now  ║ │
│  ║ [Run Recommendation →]            ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  [Generate Message]  [AI DeepScan]    │
│                                         │
└─────────────────────────────────────────┘
```

### Test Flow:

**1. Navigate to any prospect**
   - Click on a prospect from Pipeline
   - OR: Go to Prospects → View Detail

**2. Look for Smart Recommendation Card**
   - Purple/blue gradient box
   - "✨ AI SUGGESTS"
   - Action recommendation
   - [Run Recommendation] button

**3. Click "Run Recommendation"**
   - Preview Modal should open ↓

```
┌─────────────────────────────────────────┐
│ 👁️ PREVIEW BEFORE SEND                  │
├─────────────────────────────────────────┤
│                                         │
│  Action: Follow-Up                      │
│  Prospect: Juan Dela Cruz               │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ Generated Message:                ║ │
│  ║ "Hi Juan! I noticed you're..."   ║ │
│  ║                                   ║ │
│  ║ Quality Score: 87/100 ⭐         ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  📊 Estimated Outcome:                  │
│  • Reply Rate: 34%                      │
│  • Revenue: ₱6,800                      │
│                                         │
│  💎 Cost: 40E + 25C                     │
│                                         │
│  [Regenerate] [Cancel] [Approve & Send]│
│                                         │
└─────────────────────────────────────────┘
```

**4. Click "Approve & Send"**
   - Progress Modal should open ↓

```
┌─────────────────────────────────────────┐
│ ⚡ PROCESSING AUTOMATION                 │
├─────────────────────────────────────────┤
│                                         │
│  Processing: Follow-Up                  │
│  Prospect: Juan Dela Cruz               │
│                                         │
│  ✓ Checking resources                   │
│  🔄 Generating message... 2s            │
│  ⏳ Sending message... pending          │
│  ⏳ Complete... pending                 │
│                                         │
│  ▓▓▓▓▓░░░░░░░░░░ 40% (8s remaining)    │
│                                         │
│  [Cancel]                               │
│                                         │
└─────────────────────────────────────────┘
```

**5. Wait for Completion**
   - Success Toast should appear ↓

```
┌─────────────────────────────────────────┐
│ 🎉 SUCCESS TOAST (Bottom Right)         │
├─────────────────────────────────────────┤
│  ✅ Follow-Up Sent Successfully!        │
│                                         │
│  💡 Next action: Qualify prospect       │
│                                         │
│  [View Prospect] [Run Next Action]      │
│                                         │
│  [X]                                    │
└─────────────────────────────────────────┘
```

---

## 🧪 TEST ROUTE 2: PIPELINE PAGE

### What to Look For:

```
┌─────────────────────────────────────────────────────────┐
│ 📊 Pipeline                    👥 Active: 12  📈 Won: 8% │
│                                                         │
│ ⚡ 47/50 remaining  ← AUTOMATION QUOTA                  │
└─────────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ 🔵 Engage│ 🟣 Qualify│ 🟢 Nurture│ 🟢 Close │ ✅ Won   │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│          │          │          │          │          │
│ ╔══════╗ │ ╔══════╗ │ ╔══════╗ │          │          │
│ ║ Juan ║ │ ║ Maria║ │ ║ Pedro║ │          │          │
│ ║ ⭐85  ║ │ ║ ⭐82 ║ │ ║ ⭐45 ║ │          │          │
│ ╠══════╣ │ ╠══════╣ │ ╠══════╣ │          │          │
│ ║✨AI   ║ │ ║✨AI  ║ │ ║✨AI  ║ │          │          │
│ ║Follow-║ │ ║Book  ║ │ ║Nurture║ │         │          │
│ ║Up Now ║ │ ║Call  ║ │ ║Trust ║ │          │          │
│ ╚══════╝ │ ╚══════╝ │ ╚══════╝ │          │          │
│          │          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

### Test Flow:

**1. Navigate to Pipeline**
   - Click "Pipeline" from main menu

**2. Check Header Stats**
   - Look for automation quota display
   - **Pro users:** "⚡ 50/50 remaining"
   - **Free users:** "⚡ 3/3 remaining"

**3. Scroll Through Stages**
   - Check **Engage** stage prospects
   - High scores (≥70) should show: "✨ AI Suggests: Follow-Up"
   
   - Check **Qualify** stage prospects
   - High scores (≥75) should show: "✨ AI Suggests: Book Meeting"
   
   - Check **Any** stage prospects
   - Low scores (<50) should show: "✨ AI Suggests: Nurture"

**4. Run an Automation from AI Auto Panel**
   - Click lightning bolt icon (⚡)
   - Select any automation
   - Watch quota decrease after completion

---

## 🧪 TEST ROUTE 3: AI AUTO PANEL

### What to Look For:

```
┌─────────────────────────────────────────┐
│ ⚡ AI PIPELINE AUTOMATION                │
├─────────────────────────────────────────┤
│                                         │
│  ⚡ Automation Quota: 47/50 remaining   │
│  ├─ Free: 3/month                       │
│  └─ Pro: 50/month FREE!                 │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ 🎯 Smart Scan      [PREMIUM]     ║ │
│  ║ Quick prospect analysis           ║ │
│  ║                                   ║ │
│  ║ 💎 25E + 15C                      ║ │
│  ║ [Run Smart Scan →]               ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ 📧 Follow-Up       [PREMIUM]     ║ │
│  ║ AI-powered message                ║ │
│  ║                                   ║ │
│  ║ 💎 40E + 25C                      ║ │
│  ║ [Run Follow-Up →]                ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  ╔═══════════════════════════════════╗ │
│  ║ 🚀 Full Automation [PREMIUM]     ║ │
│  ║ Complete pipeline                 ║ │
│  ║                                   ║ │
│  ║ 💎 300E + 175C                    ║ │
│  ║ [Run Full Auto →]                ║ │
│  ╚═══════════════════════════════════╝ │
│                                         │
│  💡 Pro users: First 50/month FREE!    │
│                                         │
└─────────────────────────────────────────┘
```

### Test Flow:

**1. Open AI Auto Panel**
   - Click lightning bolt (⚡) button in Pipeline

**2. Check Updated Costs**
   - Smart Scan: **25E + 15C** (was 10E + 5C)
   - Follow-Up: **40E + 25C** (was 15E + 10C)
   - Qualify: **55E + 35C** (was 20E + 15C)
   - Full Automation: **300E + 175C** (was 100E + 75C)

**3. Check Premium Badge**
   - All cards should have **[PREMIUM]** badge

**4. Check Quota Display**
   - Should show: "⚡ 47/50 remaining" (or current count)

**5. Run an Automation**
   - Click any [Run] button
   - Should trigger preview → progress → toast flow

---

## 📋 QUICK CHECKLIST

### ✅ ProspectDetailPage
- [ ] Smart Recommendation Card displays
- [ ] Preview Modal opens on action click
- [ ] Preview shows generated content + quality score
- [ ] Progress Modal shows real-time steps
- [ ] Success Toast appears after completion
- [ ] Toast has "View Prospect" and "Run Next Action" buttons

### ✅ PipelinePage
- [ ] Automation Quota Display in header
- [ ] Quota shows correct numbers (Free: 3, Pro: 50)
- [ ] Smart recommendations in prospect cards
- [ ] Recommendations match score + stage logic
- [ ] Colors correct (purple for high, amber for low)

### ✅ AI Auto Panel
- [ ] Updated costs (2.5x original)
- [ ] Premium badges visible
- [ ] Quota display at top
- [ ] Footer mentions 50 free for Pro
- [ ] All buttons trigger automation flow

### ✅ Free vs Pro
- [ ] Free users: 3/month quota
- [ ] Pro users: 50/month quota
- [ ] Free users: Error after 3 automations
- [ ] Pro users: First 50 free, then costs apply

---

## 🐛 TROUBLESHOOTING

### Issue: Quota not displaying
**Fix:** Deploy SQL migrations first (see Setup Step 1)

### Issue: "Insufficient resources" error
**Fix:** Restart dev server after deploying migrations

### Issue: Blank page on automation click
**Fix:** Already fixed in code - should work after migrations deployed

### Issue: Toast not appearing
**Fix:** Check `App.tsx` has `<AutomationToastContainer />` component

### Issue: Preview modal crashes
**Fix:** Check console for errors, ensure all imports correct

---

## 🎯 SUCCESS INDICATORS

✅ **ALL GREEN means READY TO LAUNCH!**

| Feature | Location | Status |
|---------|----------|--------|
| Smart Recommendations | ProspectDetailPage | ✅ |
| Preview Before Send | ProspectDetailPage | ✅ |
| Progress Tracking | ProspectDetailPage | ✅ |
| Success Toasts | App-wide | ✅ |
| Automation Quota | PipelinePage Header | ✅ |
| Smart Cards | Pipeline Cards | ✅ |
| Updated Costs | AI Auto Panel | ✅ |
| Premium Badges | AI Auto Panel | ✅ |

---

## 📸 EXPECTED SCREENSHOTS

### 1️⃣ ProspectDetailPage
- Smart recommendation card at top
- Preview modal with quality score
- Progress modal with animated steps
- Success toast bottom-right

### 2️⃣ PipelinePage Header
- Quota display: "⚡ 47/50 remaining"
- Positioned after "Active" and "Won Rate" stats

### 3️⃣ Pipeline Prospect Cards
- Purple card for high-score engage
- Green card for high-score qualify
- Amber card for low-score any stage

### 4️⃣ AI Auto Panel
- All costs 2.5x higher
- Premium badges on cards
- Quota at top
- Footer about 50 free

---

## 🚀 NEXT STEPS AFTER TESTING

1. ✅ All tests pass → Deploy to production
2. ⚠️ Some tests fail → Check console errors, review code
3. 🐛 Bugs found → Document in GitHub Issues
4. 📊 Monitor analytics:
   - Automation usage rate
   - Quota exhaustion rate
   - Free → Pro conversion rate
   - User feedback on recommendations

---

**Happy Testing! 🎉**

*Every test that passes = One step closer to launch!* 🚀




