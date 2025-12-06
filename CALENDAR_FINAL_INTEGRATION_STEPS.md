# 📅 SMART CALENDAR - FINAL INTEGRATION STEPS

**Time:** 10 minutes  
**Status:** ✅ **95% COMPLETE - JUST WIRE TO HOMEPAGE**

---

## ✅ COMPLETED FILES

All code is ready! Just needs wiring:

```
✅ Database:
   └─ supabase/migrations/20251203220000_create_smart_calendar_system.sql

✅ Services:
   ├─ src/services/calendar/calendarService.ts
   ├─ src/services/calendar/types.ts
   ├─ src/services/calendar/icsGenerator.ts
   └─ src/services/ai/chatbotMeetingDetector.ts

✅ Pages:
   ├─ src/pages/CalendarPage.tsx
   └─ src/pages/PublicBookingPage.tsx

✅ Navigation:
   └─ src/components/SlideInMenu.tsx (Calendar already in menu!)
```

---

## 🔌 FINAL WIRING (Copy-Paste These)

### **STEP 1: Add Calendar Route to HomePage.tsx**

**Find this section** (around line 30-40):
```typescript
import NotificationCenter from '../components/NotificationCenter';
import ProspectAvatar from '../components/ProspectAvatar';
// ... other imports
```

**Add this import:**
```typescript
import CalendarPage from './CalendarPage';
import PublicBookingPage from './PublicBookingPage';
```

---

**Find this section** (around line 700-800, where other page routes are):
```typescript
if (currentPage === 'wallet') {
  return (
    <WalletPage
      onBack={() => setCurrentPage('home')}
      ...
    />
  );
}
```

**Add this route after wallet:**
```typescript
if (currentPage === 'calendar') {
  return (
    <CalendarPage
      onBack={() => setCurrentPage('home')}
      onNavigate={handleNavigate}
    />
  );
}

if (currentPage.startsWith('book-')) {
  const slug = currentPage.replace('book-', '');
  return <PublicBookingPage slug={slug} />;
}
```

---

### **STEP 2: Update Today's Schedule Card**

**Find the "Today's Schedule" card** (around line 850-900):

**Replace the entire card** with this:

```typescript
{/* Today's Schedule Card - UPDATED WITH CALENDAR */}
<div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
      <Calendar className="w-5 h-5 text-blue-600" />
      Today's Schedule
    </h3>
    <button
      onClick={() => setCurrentPage('calendar')}
      className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
    >
      View Calendar
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>

  {scheduleLoading ? (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p className="text-sm text-gray-600">Loading schedule...</p>
    </div>
  ) : scheduleEvents.length === 0 ? (
    <div className="text-center py-8">
      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="font-bold text-gray-900 mb-1">No events today</p>
      <p className="text-sm text-gray-600 mb-4">Your schedule is clear!</p>
      <button
        onClick={() => setCurrentPage('calendar')}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
      >
        📅 Open Calendar
      </button>
    </div>
  ) : (
    <div className="space-y-3">
      {scheduleEvents.map((event: any) => (
        <div
          key={event.id}
          className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setCurrentPage('calendar')}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{event.guest_name}</h4>
              <p className="text-sm text-gray-600 mb-2">{event.guest_email}</p>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(event.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                  {event.meeting_type?.duration_minutes || 30} min
                </span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

**Update the `loadSchedule()` function:**
```typescript
async function loadSchedule() {
  try {
    setScheduleLoading(true);
    
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Load from calendar_bookings
    const { data, error } = await supabase
      .from('calendar_bookings')
      .select(`
        *,
        meeting_type:meeting_types(name, duration_minutes, color)
      `)
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    setScheduleEvents(data || []);
  } catch (error) {
    console.error('Error loading schedule:', error);
    setScheduleEvents([]);
  } finally {
    setScheduleLoading(false);
  }
}
```

---

### **STEP 3: Update AI Alerts Card**

**Find the "AI Alerts & Reminders" card** and **update the `loadAlerts()` function:**

```typescript
async function loadAlerts() {
  try {
    setAlertsLoading(true);
    
    if (!user) return;
    
    const alerts = [];
    
    // 1. CALENDAR ALERTS - Check for upcoming meetings (next 24 hours)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: upcomingMeetings } = await supabase
      .from('calendar_bookings')
      .select('*, meeting_type:meeting_types(name)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });
    
    if (upcomingMeetings && upcomingMeetings.length > 0) {
      upcomingMeetings.forEach((meeting: any) => {
        const meetingTime = new Date(meeting.start_time);
        const hoursUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60 * 60));
        const minutesUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60));
        
        alerts.push({
          id: `meeting-${meeting.id}`,
          icon: hoursUntil <= 1 ? '🔥' : '📅',
          title: `Meeting with ${meeting.guest_name}`,
          message: hoursUntil < 1 
            ? `Starting in ${minutesUntil} minutes!` 
            : `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} - ${meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          priority: hoursUntil <= 1 ? 'high' : minutesUntil <= 60 ? 'medium' : 'low',
          action: () => setCurrentPage('calendar'),
          actionLabel: 'View Details',
        });
      });
    }
    
    // 2. AI SALES ALERTS - Prospects needing follow-up (existing logic)
    // ... your existing alert logic ...
    
    setAiAlerts(alerts);
  } catch (error) {
    console.error('Error loading alerts:', error);
    setAiAlerts([]);
  } finally {
    setAlertsLoading(false);
  }
}
```

---

## 🤖 AI CHATBOT INTEGRATION

### **Find Your Chatbot Message Handler**

Common locations:
- `src/services/ai/chatbotService.ts`
- `src/services/ai/publicChatbotService.ts`
- `supabase/functions/public-chatbot-chat/index.ts`

### **Add This Code BEFORE OpenAI Call:**

```typescript
import { chatbotMeetingDetector } from '../services/ai/chatbotMeetingDetector';

// In your message processing function:
async function processMessage(userMessage: string, userId: string, prospectName: string) {
  // === CHECK FOR MEETING REQUEST ===
  const isMeetingRequest = chatbotMeetingDetector.detectMeetingRequest(userMessage);
  
  if (isMeetingRequest) {
    console.log('🗓️ Meeting request detected!');
    
    // Check if user has calendar enabled
    const hasCalendar = await chatbotMeetingDetector.isCalendarEnabled(userId);
    
    if (hasCalendar) {
      // Generate smart meeting response with booking link
      const meetingResponse = await chatbotMeetingDetector.generateMeetingResponse(
        userId,
        userMessage,
        prospectName
      );
      
      if (meetingResponse) {
        console.log('✅ Sending booking link!');
        return {
          success: true,
          response: meetingResponse, // Contains booking link!
          type: 'meeting_link',
        };
      }
    }
  }
  
  // === NORMAL OPENAI FLOW ===
  const openaiResponse = await openai.chat.completions.create({...});
  return {
    success: true,
    response: openaiResponse.choices[0].message.content,
    type: 'ai_response',
  };
}
```

---

## 🧪 FULL TESTING CHECKLIST

### **Test 1: Deploy Database**
- [ ] Copy migration file
- [ ] Paste in Supabase SQL Editor
- [ ] Run migration
- [ ] See success message

### **Test 2: Calendar Page Works**
- [ ] Navigate to Calendar from menu
- [ ] See your booking link
- [ ] Copy booking link
- [ ] No errors in console

### **Test 3: Today's Schedule Shows Bookings**
- [ ] Create a test booking
- [ ] Check home page "Today's Schedule" card
- [ ] Booking should appear
- [ ] Click "View Calendar" → Opens calendar page

### **Test 4: AI Alerts Shows Meeting Reminders**
- [ ] Create booking for later today
- [ ] Check "AI Alerts & Reminders" card
- [ ] Should show "Meeting with [guest] in X hours"
- [ ] Click "View Details" → Opens calendar

### **Test 5: Public Booking Page**
- [ ] Copy your booking link
- [ ] Open in incognito/private browser
- [ ] Should see beautiful booking page
- [ ] Select meeting type
- [ ] Select date
- [ ] Select time
- [ ] Fill guest details
- [ ] Confirm booking
- [ ] See confirmation page

### **Test 6: Native Calendar Integration**
- [ ] After booking confirmed
- [ ] Click "Add to Calendar (ICS)"
- [ ] ICS file downloads
- [ ] Open ICS file
- [ ] Should add to Apple/Outlook/etc calendar
- [ ] OR: Click "Google Calendar"
- [ ] Should open Google Calendar with event

### **Test 7: AI Chatbot Auto-Sends Link**
- [ ] Go to chatbot page
- [ ] Send: "Pwede ba tayong mag-meet?"
- [ ] Chatbot should respond with booking link
- [ ] Link format: /book/[your-slug]
- [ ] Click link → Opens booking page

---

## 📋 QUICK COPY-PASTE INTEGRATION

### **HomePage.tsx - Add These Lines:**

**Line ~40 (Imports):**
```typescript
import CalendarPage from './CalendarPage';
import PublicBookingPage from './PublicBookingPage';
```

**Line ~750 (After wallet route):**
```typescript
if (currentPage === 'calendar') {
  return (
    <CalendarPage
      onBack={() => setCurrentPage('home')}
      onNavigate={handleNavigate}
    />
  );
}

if (currentPage.startsWith('book-')) {
  const slug = currentPage.replace('book-', '');
  return <PublicBookingPage slug={slug} />;
}
```

**Line ~120 (Update loadSchedule function):**
```typescript
async function loadSchedule() {
  try {
    setScheduleLoading(true);
    if (!user) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data, error } = await supabase
      .from('calendar_bookings')
      .select('*, meeting_type:meeting_types(name, duration_minutes, color)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;
    setScheduleEvents(data || []);
  } catch (error) {
    console.error('Error loading schedule:', error);
    setScheduleEvents([]);
  } finally {
    setScheduleLoading(false);
  }
}
```

**Line ~275 (Update loadAlerts function - ADD THIS):**
```typescript
async function loadAlerts() {
  try {
    setAlertsLoading(true);
    if (!user) return;
    
    const alerts = [];
    
    // CALENDAR ALERTS - Upcoming meetings
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: upcomingMeetings } = await supabase
      .from('calendar_bookings')
      .select('*, meeting_type:meeting_types(name)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', tomorrow.toISOString())
      .order('start_time', { ascending: true });
    
    if (upcomingMeetings && upcomingMeetings.length > 0) {
      upcomingMeetings.forEach((meeting: any) => {
        const meetingTime = new Date(meeting.start_time);
        const hoursUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60 * 60));
        const minutesUntil = Math.round((meetingTime.getTime() - Date.now()) / (1000 * 60));
        
        alerts.push({
          id: `meeting-${meeting.id}`,
          icon: hoursUntil <= 1 ? '🔥' : '📅',
          title: `Meeting with ${meeting.guest_name}`,
          message: hoursUntil < 1 
            ? `Starting in ${minutesUntil} minutes!` 
            : `In ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''} - ${meetingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          priority: hoursUntil <= 1 ? 'high' : minutesUntil <= 60 ? 'medium' : 'low',
          action: () => setCurrentPage('calendar'),
          actionLabel: 'View Details',
        });
      });
    }
    
    // YOUR EXISTING ALERTS LOGIC HERE
    // ... (keep your existing code)
    
    setAiAlerts(alerts);
  } catch (error) {
    console.error('Error loading alerts:', error);
    setAiAlerts([]);
  } finally {
    setAlertsLoading(false);
  }
}
```

---

## 🎉 THAT'S IT!

After these 3 edits to `HomePage.tsx`:
- ✅ Calendar accessible from menu
- ✅ Today's Schedule shows real bookings
- ✅ AI Alerts shows meeting reminders
- ✅ Public booking pages work
- ✅ Native calendar integration (ICS files)

---

## 🚀 DEPLOYMENT ORDER

1. **Deploy database** (5 min)
   - Run SQL migration in Supabase

2. **Edit HomePage.tsx** (5 min)
   - Add imports
   - Add routes
   - Update loadSchedule()
   - Update loadAlerts()

3. **Test** (5 min)
   - Navigate to /calendar
   - Create test booking
   - Check Today's Schedule
   - Check AI Alerts
   - Test public booking page

4. **Deploy!** 🚀

---

## 📖 FULL DOCUMENTATION

- **Deployment:** `DEPLOY_CALENDAR_NOW.md`
- **AI Integration:** `AI_CHATBOT_CALENDAR_INTEGRATION.md`
- **Complete System:** `SMART_CALENDAR_SYSTEM_COMPLETE.md`
- **Final Steps:** `CALENDAR_FINAL_INTEGRATION_STEPS.md` (this file)

---

**Everything is ready! Just 3 edits to HomePage.tsx and you're done!** ✅🚀




