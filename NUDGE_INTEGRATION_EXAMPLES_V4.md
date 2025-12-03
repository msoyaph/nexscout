# Nudge System v4.0 Integration Examples

This guide shows how to integrate the Dynamic Nudge System v4.0 into existing pages across the NexScout platform.

## 1. Scanner/Upload Pages Integration

### Example: ScanUploadPage.tsx

```tsx
import { useDynamicNudges } from '../hooks/useDynamicNudges';
import { InChatUpgradeNudge } from '../components/InChatUpgradeNudge';
import { SurgeNudgeModal } from '../components/SurgeNudgeModal';
import { useSubscription } from '../hooks/useSubscription';

function ScanUploadPage() {
  const { tier } = useSubscription();
  const {
    activeOffer,
    activeSurge,
    trackMetric,
    checkSurge,
    generateOffer,
    clearSurge,
  } = useDynamicNudges();

  const [scanCount, setScanCount] = useState(0);
  const [showNudge, setShowNudge] = useState(false);
  const [showSurgeModal, setShowSurgeModal] = useState(false);

  const handleFileUpload = async (file: File) => {
    // Process file...

    // Track activity
    const newCount = scanCount + 1;
    setScanCount(newCount);
    await trackMetric('file_scan', newCount);

    // Check for surge (free users only)
    if (tier === 'FREE' && newCount >= 5) {
      const surge = await checkSurge('scans', newCount, 10);
      if (surge) {
        await generateOffer(499, 'PRO', { hasSurge: true });
        setShowSurgeModal(true);
      }
    }

    // Show nudge after 3 scans for free users
    if (tier === 'FREE' && newCount >= 3 && !showNudge) {
      await generateOffer(499, 'PRO');
      setShowNudge(true);
    }
  };

  return (
    <div>
      {/* Existing UI */}

      {/* In-page nudge banner */}
      {tier === 'FREE' && showNudge && activeOffer && (
        <InChatUpgradeNudge
          offer={activeOffer}
          variant="minimal"
          onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
          onDismiss={() => setShowNudge(false)}
        />
      )}

      {/* Surge modal */}
      {activeSurge && activeOffer && (
        <SurgeNudgeModal
          isOpen={showSurgeModal}
          onClose={() => {
            setShowSurgeModal(false);
            clearSurge();
          }}
          surge={activeSurge}
          offer={activeOffer}
          onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
        />
      )}
    </div>
  );
}
```

## 2. Chatbot Integration

### Example: AIChatbotPage.tsx

```tsx
import { useDynamicNudges } from '../hooks/useDynamicNudges';
import { InChatUpgradeNudge } from '../components/InChatUpgradeNudge';

function AIChatbotPage() {
  const { tier } = useSubscription();
  const {
    activeOffer,
    trackMetric,
    generateOffer,
    updateEmotionalState,
  } = useDynamicNudges();

  const [messages, setMessages] = useState([]);
  const [showNudge, setShowNudge] = useState(false);

  const handleSendMessage = async (message: string) => {
    // Send message...

    const newMessages = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    // Track activity
    await trackMetric('chatbot_message', newMessages.length);

    // Analyze sentiment and update emotional state
    const sentiment = analyzeSentiment(message);
    if (sentiment) {
      updateEmotionalState(sentiment);
    }

    // Show nudge after 5 messages for free users
    if (tier === 'FREE' && newMessages.length >= 5 && !showNudge) {
      await generateOffer(499, 'PRO');
      setShowNudge(true);
    }
  };

  const analyzeSentiment = (text: string): EmotionalState | null => {
    // Simple sentiment detection
    if (text.includes('frustrated') || text.includes('annoying')) return 'frustrated';
    if (text.includes('excited') || text.includes('amazing')) return 'excited';
    if (text.includes('help') || text.includes('confused')) return 'overwhelmed';
    return null;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* In-chat nudge */}
        {tier === 'FREE' && showNudge && activeOffer && (
          <InChatUpgradeNudge
            offer={activeOffer}
            variant="expanded"
            onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
            onDismiss={() => setShowNudge(false)}
          />
        )}
      </div>

      {/* Input area */}
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}
```

## 3. Energy System Integration

### Example: EnergyBar Component

```tsx
import { useDynamicNudges } from '../hooks/useDynamicNudges';
import { SurgeNudgeModal } from '../components/SurgeNudgeModal';

function EnergyBar() {
  const { energy } = useEnergy();
  const { tier } = useSubscription();
  const {
    activeOffer,
    activeSurge,
    checkSurge,
    generateOffer,
    updateEmotionalState,
    clearSurge,
  } = useDynamicNudges();

  const [showSurgeModal, setShowSurgeModal] = useState(false);

  useEffect(() => {
    // Track low energy state
    if (energy < 20) {
      updateEmotionalState('frustrated');
      trackEnergyDepletion();
    }
  }, [energy]);

  const trackEnergyDepletion = async () => {
    if (tier !== 'FREE') return;

    const usage = 100 - energy;
    const surge = await checkSurge('energy', usage, 60);

    if (surge) {
      await generateOffer(499, 'PRO', { hasSurge: true });
      setShowSurgeModal(true);
    }
  };

  return (
    <>
      <div className="energy-bar-component">
        {/* Energy UI */}

        {energy < 20 && tier === 'FREE' && (
          <button
            onClick={() => navigate('/energy-refill')}
            className="text-xs text-red-600 hover:text-red-700"
          >
            🔥 Upgrade for 200 energy daily
          </button>
        )}
      </div>

      {activeSurge && activeOffer && (
        <SurgeNudgeModal
          isOpen={showSurgeModal}
          onClose={() => {
            setShowSurgeModal(false);
            clearSurge();
          }}
          surge={activeSurge}
          offer={activeOffer}
          onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
        />
      )}
    </>
  );
}
```

## 4. Messaging/Follow-up Integration

### Example: MessagingHubPage.tsx

```tsx
function MessagingHubPage() {
  const { tier } = useSubscription();
  const {
    activeOffer,
    activeSurge,
    trackMetric,
    checkSurge,
    generateOffer,
  } = useDynamicNudges();

  const [messageCount, setMessageCount] = useState(0);

  const handleSendMessage = async () => {
    // Send message...

    const newCount = messageCount + 1;
    setMessageCount(newCount);
    await trackMetric('manual_message_sent', newCount);

    // Check surge after 10 messages
    if (tier === 'FREE' && newCount >= 10) {
      await checkSurge('messages', newCount, 15);
    }
  };

  return (
    <div>
      {/* Messaging UI */}

      {tier === 'FREE' && messageCount >= 5 && activeOffer && (
        <div className="sticky top-0 z-10">
          <InChatUpgradeNudge
            offer={activeOffer}
            variant="urgent"
            onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
            onDismiss={() => {/* track dismissal */}}
          />
        </div>
      )}
    </div>
  );
}
```

## 5. Pipeline/Deals Integration

### Example: PipelinePage.tsx

```tsx
function PipelinePage() {
  const { tier } = useSubscription();
  const { activeOffer, trackMetric, generateOffer, updateEmotionalState } = useDynamicNudges();
  const [deals, setDeals] = useState([]);

  useEffect(() => {
    const hotLeads = deals.filter(d => d.stage === 'hot' && d.scoutScore > 80);

    if (tier === 'FREE' && hotLeads.length >= 3) {
      updateEmotionalState('momentum');
      trackMetric('hot_leads_detected', hotLeads.length);
      generateOffer(499, 'PRO');
    }
  }, [deals]);

  const handleDealClose = async (dealId: string) => {
    // Close deal...

    updateEmotionalState('confident');
    await trackMetric('deal_closed', 1);

    // Show ROI-focused nudge
    if (tier === 'FREE') {
      await generateOffer(499, 'PRO', { emotionalStateOverride: 'confident' });
    }
  };

  return (
    <div>
      {/* Pipeline UI */}

      {tier === 'FREE' && activeOffer && deals.length >= 5 && (
        <div className="mb-4">
          <ROICalculatorCard
            userId={user.id}
            currentTier="FREE"
            targetTier="PRO"
            onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
          />
        </div>
      )}
    </div>
  );
}
```

## 6. Library/Saved Content Integration

```tsx
function LibraryPage() {
  const { tier } = useSubscription();
  const { trackMetric, generateOffer } = useDynamicNudges();
  const [savedCount, setSavedCount] = useState(0);

  const handleSaveItem = async () => {
    const newCount = savedCount + 1;
    setSavedCount(newCount);
    await trackMetric('library_save', newCount);

    // Nudge when reaching limit
    if (tier === 'FREE' && newCount >= 10) {
      await generateOffer(499, 'PRO');
    }
  };

  return (
    <div>
      {tier === 'FREE' && savedCount >= 8 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-gray-700">
            📚 You have {savedCount}/10 items saved. Upgrade to PRO for unlimited storage!
          </p>
        </div>
      )}

      {/* Library content */}
    </div>
  );
}
```

## 7. Calendar/Appointments Integration

```tsx
function CalendarPage() {
  const { tier } = useSubscription();
  const { trackMetric, generateOffer, updateEmotionalState } = useDynamicNudges();

  const handleBookAppointment = async () => {
    await trackMetric('appointment_booked', 1);
    updateEmotionalState('optimistic');

    if (tier === 'FREE') {
      await generateOffer(499, 'PRO');
    }
  };

  return (
    <div>
      {/* Calendar UI */}

      {tier === 'FREE' && (
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700 mb-2">
            🗓️ PRO unlocks Smart Appointment Scheduling with AI Follow-ups
          </p>
          <button className="text-blue-600 font-semibold text-sm">
            Learn More →
          </button>
        </div>
      )}
    </div>
  );
}
```

## 8. Social Connect Integration

```tsx
function SocialConnectPage() {
  const { tier } = useSubscription();
  const { trackMetric, checkSurge, generateOffer } = useDynamicNudges();
  const [connectionsScanned, setConnectionsScanned] = useState(0);

  const handleScanFriends = async (friendsList: any[]) => {
    const count = friendsList.length;
    setConnectionsScanned(count);
    await trackMetric('social_connections_scanned', count);

    if (tier === 'FREE' && count >= 100) {
      await checkSurge('scans', count, 50);
      await generateOffer(499, 'PRO');
    }
  };

  return (
    <div>
      {/* Social connect UI */}

      {tier === 'FREE' && connectionsScanned >= 50 && (
        <InChatUpgradeNudge
          offer={activeOffer}
          variant="expanded"
          onUpgrade={() => navigate('/subscription-checkout?tier=PRO')}
          onDismiss={() => {}}
        />
      )}
    </div>
  );
}
```

## Best Practices

### 1. Timing Nudges
```tsx
// ❌ Bad - Too aggressive
if (scanCount === 1) {
  showNudge();
}

// ✅ Good - Give value first
if (scanCount >= 3 && tier === 'FREE') {
  showNudge();
}
```

### 2. Respecting Dismissals
```tsx
const [dismissedAt, setDismissedAt] = useState<Date | null>(null);

const shouldShowNudge = () => {
  if (!dismissedAt) return true;

  // Don't show again for 24 hours after dismissal
  const hoursSinceDismissal = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceDismissal >= 24;
};
```

### 3. Tracking Metrics Consistently
```tsx
// Track all user actions
await trackMetric('feature_used', { feature: 'deepscan', count: 1 });
await trackMetric('limit_hit', { limit: 'daily_energy', value: 0 });
await trackMetric('success_event', { type: 'deal_closed', value: 5000 });
```

### 4. Emotional State Updates
```tsx
// Update based on user behavior
if (consecutiveFailures >= 3) {
  updateEmotionalState('frustrated');
}

if (dealsClosed >= 2 && timeframe === 'today') {
  updateEmotionalState('momentum');
}

if (exploringSeveralFeatures) {
  updateEmotionalState('curious');
}
```

### 5. Cooldown Periods
```tsx
const NUDGE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const [lastNudgeShown, setLastNudgeShown] = useState<Date | null>(null);

const canShowNudge = () => {
  if (!lastNudgeShown) return true;
  return Date.now() - lastNudgeShown.getTime() > NUDGE_COOLDOWN_MS;
};
```

## Testing Checklist

- [ ] Nudges only show for FREE tier users
- [ ] Surge detection triggers correctly
- [ ] Emotional states update based on behavior
- [ ] ROI calculations are accurate
- [ ] Dismissal persists for reasonable time
- [ ] Cooldown periods are respected
- [ ] Metrics track correctly
- [ ] Animations are smooth
- [ ] Mobile responsive
- [ ] Analytics capture all events

## Conversion Tracking

When user upgrades, mark the active offer as converted:

```tsx
const handleUpgradeSuccess = async (offerId: string) => {
  await supabase
    .from('upgrade_offer_events')
    .update({ upgraded: true, upgraded_at: new Date().toISOString() })
    .eq('id', offerId);
};
```

## A/B Testing Setup

```tsx
// Assign variant on first nudge shown
const [variant, setVariant] = useState<'control' | 'variant_a' | 'variant_b'>();

useEffect(() => {
  const assignedVariant = ['control', 'variant_a', 'variant_b'][
    Math.floor(Math.random() * 3)
  ];
  setVariant(assignedVariant);
}, []);

// Track which variant was shown
await trackDynamicOffer({
  ...offerData,
  offerVariant: `PRO_${variant}`,
});
```

---

This integration guide ensures consistent, effective nudge placement across the entire NexScout platform while maintaining a non-intrusive, value-first approach to upgrade conversions.
