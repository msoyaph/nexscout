# NexScout Quick Start Guide 🚀

## You're Ready to Launch! Here's What Works

---

## ✅ Core Automation is LIVE

### The Complete Flow
```
1. Visitor chats on your website
   ↓
2. NexScout automatically detects buying intent
   ↓
3. When visitor shares email/phone → Prospect created
   ↓
4. AI scores prospect (ScoutScore 0-100)
   ↓
5. Prospect placed in pipeline at appropriate stage
   ↓
6. Pipeline stage triggers → AI jobs queued
   ↓
7. Background processor executes jobs every minute
   ↓
8. Follow-ups sent, meetings booked, deals closed
   ↓
9. You get notified at every step
```

**Zero manual data entry required!**

---

## 🎮 Operating Modes (Choose Your Level)

### 1. Autopilot Mode (Full Automation)
**For**: Hands-off operators who trust AI
```
✓ All automation enabled
✓ Auto follow-ups (5 min delay)
✓ Auto nurture sequences
✓ Auto book meetings
✓ Auto close deals (if score ≥ 70)
✓ No approval required
```

### 2. Manual Mode (Full Control)
**For**: Traditional salespeople who want AI help but human control
```
✓ Prospects still auto-created from chat
✓ Notifications for all actions
✓ AI suggests what to do next (coming soon)
✓ You manually execute everything
✗ No automation triggered
```

### 3. Hybrid Mode (Balanced)
**For**: Most users - best of both worlds
```
✓ Low-risk automation (follow-ups, nurturing)
✓ High-value actions require approval
✓ Auto book meetings if pipeline automation enabled
✗ Always requires approval to close deals
✓ You control the important stuff
```

**Set your mode**: Settings → Operating Mode Selector

---

## 🔋 Energy & Coins System

### How It Works
- Every AI action costs Energy + Coins
- Energy regenerates over time (or buy refills)
- Coins earned through missions/purchases
- Jobs won't run if you can't afford them

### Costs Per Action
```
smart_scan:     10 energy + 5 coins
follow_up:      15 energy + 8 coins
qualify:        20 energy + 10 coins
nurture:        25 energy + 12 coins
book_meeting:   30 energy + 15 coins
close_deal:     50 energy + 25 coins
full_pipeline:  100 energy + 50 coins
```

**Track your balance**: Header shows current energy/coins

---

## 📊 What Qualifies a Chat as a Prospect?

### Requirements (Must meet ALL)
1. ✅ Has email OR phone number
2. ✅ Qualification score ≥ 50
3. ✅ At least 2 of these:
   - Buying intent score ≥ 50
   - Lead temperature is hot/readyToBuy
   - Conversation ≥ 5 messages
   - Buying signals detected (price, demo, purchase)
   - Session duration ≥ 2 minutes

### How Scoring Works
```
Buying Intent (0-40 pts):  From conversation analysis
Lead Temperature (0-25):   cold:0, warm:10, hot:20, readyToBuy:25
Contact Info (0-15):       email:5, phone:5, company:3, name:2
Engagement (0-15):         Message count + duration
Buying Signals (0-5):      High-value keywords detected
```

### What Gets Extracted
- **Email**: any@email.com format
- **Phone**: Philippine and international formats
- **Name**: "I'm John Doe", "My name is..."
- **Company**: "from Acme Corp", "work at..."

---

## 🎯 Pipeline Stage → Actions

### What Happens Automatically

| Stage | Actions Triggered | Mode |
|-------|-------------------|------|
| **new** | smart_scan | All modes (if enabled) |
| **contacted** | follow_up | Hybrid/Autopilot |
| **qualified** | qualify + nurture | Hybrid/Autopilot |
| **interested** | book_meeting | Autopilot or Hybrid (if automation on) |
| **ready_to_close** | close_deal | Autopilot ONLY (score ≥ 70) |
| **won** | Revenue tracking | All modes |

**Manual mode**: Nothing triggers automatically (you're in control)

---

## 🔔 Notifications You'll Receive

### Automatic Alerts
- 🆕 New prospect created from chat
- 📈 Prospect moved to higher stage
- ✅ AI job completed
- ⚡ Energy low (need refill)
- 💰 Coins low (need purchase)
- 🎉 Deal closed
- ⚠️ Approval needed (Hybrid mode)
- ❌ Job failed (insufficient resources)

**Check**: Click bell icon in header

---

## 🛠️ How to Test It Works

### Quick Test (5 minutes)
1. Go to Settings → Operating Mode → Select "Autopilot"
2. Open your chatbot link in incognito window
3. Have a conversation:
   ```
   You: Hi, I'm interested in your product
   Bot: Great! What would you like to know?
   You: How much does it cost?
   Bot: [explains pricing]
   You: Can we schedule a demo? My email is test@example.com
   ```
4. Go to Prospects page → See new prospect appear
5. Check Notifications → See "New Lead from Website Chat"
6. Wait 5 minutes → AI follow-up job executes
7. Check AI Pipeline page → See job completed

**That's it!** Full automation is working.

---

## 📝 Important Settings

### Must Configure Before Launch
1. **Operating Mode** (Settings → Operating Mode)
   - Choose: Autopilot, Manual, or Hybrid
   - Set preferences for your mode

2. **AI Pipeline Settings** (AI Settings page)
   - Enable/disable specific automations
   - Set thresholds
   - Configure working hours

3. **Chatbot Settings** (Chatbot Settings page)
   - Add custom instructions
   - Set personality
   - Configure integrations

4. **Company Profile** (About My Company)
   - Fill in company details
   - Add products/services
   - Upload materials

---

## 🐛 Troubleshooting

### "Jobs are queued but not executing"
- ✅ Solution: Cron job runs every minute, check logs
- Check: Do you have enough energy/coins?
- Check: Is operating mode blocking it?

### "Prospects not being created from chat"
- Check: Did visitor share email or phone?
- Check: Was qualification score ≥ 50?
- Check: Was conversation ≥ 2 qualifying conditions?
- View: Chat session logs for details

### "Automation not triggering on stage change"
- Check: Operating mode (Manual blocks all automation)
- Check: AI pipeline settings (automations enabled?)
- Check: Mode preferences (hybrid might block some)

### "Out of energy/coins"
- Go to: Wallet page → Purchase coins
- Go to: Energy Refill page → Buy energy
- Complete: Missions to earn free resources

---

## 📊 Where to Find Things

### Main Pages
- **Home**: Overview, quick stats
- **Prospects**: All your leads
- **Pipeline**: Visual pipeline board
- **Chatbot Sessions**: All conversations
- **AI Pipeline**: Job queue and history
- **Library**: AI-generated content
- **Wallet**: Energy & coins management
- **Settings**: Operating mode, preferences

### Admin (if enabled)
- **Dashboard**: System metrics
- **Analytics**: Deep insights
- **User Management**: Team members
- **Data Feeder**: Bulk operations

---

## 🎉 What's Different About NexScout

### Before NexScout
1. Visitor chats → conversation ends
2. Manual data entry into CRM
3. Manual follow-ups
4. Manual pipeline management
5. Manual closing attempts

### After NexScout
1. Visitor chats → **automatic prospect**
2. **AI scores and categorizes**
3. **AI sends follow-ups**
4. **Pipeline auto-progresses**
5. **AI attempts closing**

**Time saved**: 80% of manual work
**Response time**: Minutes vs. hours/days
**Conversion rate**: Higher (no leads slip through)

---

## 🚀 Ready to Scale

### Day 1-7: Foundation
- Set operating mode
- Configure chatbot
- Add company info
- Test the flow
- Monitor results

### Week 2-4: Optimization
- Adjust qualification thresholds
- Refine AI instructions
- A/B test messages
- Optimize pipeline stages
- Track ROI

### Month 2+: Growth
- Add team members
- Connect Facebook ads
- Build custom sequences
- Advanced analytics
- Scale automation

---

## 💡 Pro Tips

### Maximize Conversions
1. **Use Autopilot** if you can trust the AI
2. **Add products** to company profile (better recommendations)
3. **Custom instructions** in chatbot (brand voice)
4. **Monitor ScoutScore** (adjust thresholds)
5. **Check notifications** (stay informed)

### Save Energy/Coins
1. **Disable unused automations** (don't waste resources)
2. **Use Manual mode** when learning (no costs)
3. **Complete missions** (free coins)
4. **Upgrade tier** (better rates)

### Better Lead Quality
1. **Improve chatbot** (better conversations = better leads)
2. **Add training data** (teach AI your best responses)
3. **Adjust thresholds** (higher = quality, lower = quantity)
4. **Use stage triggers** (right action at right time)

---

## 📞 Need Help?

### Resources
- **Documentation**: All MD files in project root
- **Support**: Support page in app
- **Logs**: Check browser console for errors
- **Status**: System Health page (admin)

### Common Questions
**Q**: How often do jobs process?
**A**: Every 1 minute via background cron job

**Q**: Can I edit AI-generated messages before sending?
**A**: Yes, in Library page (coming soon: inline editing)

**Q**: What happens if I run out of energy?
**A**: Jobs fail, you get notification, buy refill

**Q**: Can I change operating mode anytime?
**A**: Yes! Settings → Operating Mode → One click

**Q**: Do I lose prospects if I switch to Manual?
**A**: No, prospects stay. Automation just stops.

---

## ✅ Launch Checklist

Before going live:
- [ ] Set operating mode
- [ ] Configure chatbot personality
- [ ] Add company information
- [ ] Add at least 1 product
- [ ] Test chat → prospect flow
- [ ] Verify notifications work
- [ ] Check energy/coin balance
- [ ] Share chatbot link
- [ ] Monitor first prospects
- [ ] Celebrate! 🎉

---

## 🎯 Success Metrics to Watch

### Key Numbers
- **Prospects per week**: Track growth
- **Conversion rate**: Chat → Prospect %
- **Average ScoutScore**: Lead quality
- **Jobs executed**: Automation activity
- **Response time**: AI vs. Manual
- **Deals closed**: Revenue!

**Dashboard**: See real-time metrics on homepage

---

**You're all set!** 🚀

NexScout is now your autonomous sales assistant. It captures leads, nurtures them, and moves them toward closing - all automatically based on your chosen operating mode.

Start with a test conversation, watch the magic happen, then scale from there.

**Welcome to the future of sales automation!**

---

*For detailed technical documentation, see:*
- `LAUNCH_READY_STATUS.md` - Complete system status
- `IMPLEMENTATION_SESSION_SUMMARY.md` - What was built
- `TESLA_INTEGRATION_AUDIT_COMPLETE.md` - Full feature audit
- `PRIORITY_1_CHATBOT_PROSPECTS_COMPLETE.md` - Chatbot details
