# Upgrade Nudge System v2 - Complete Implementation

## Overview

A comprehensive, intelligent upgrade nudge system that gently guides users from FREE → PRO → TEAM tiers without being annoying. Uses smart triggers, beautiful UI components, and contextual messaging.

## Implementation Date

December 1, 2025

## System Architecture

### Core Components

1. **Nudge Engine** (`src/utils/nudgeEngine.ts`)
   - Trigger detection logic
   - Feature access control
   - Nudge configuration management

2. **UI Components** (`src/components/upgrade/`)
   - `UpgradeBanner` - Floating top banner
   - `UpgradeModal` - Full modal popup
   - `PaywallScreen` - Full-screen paywall
   - `FeaturePaywall` - Inline locked features
   - `BlurredContent` - Content fog overlay

3. **Context Provider** (`src/contexts/NudgeContext.tsx`)
   - Global nudge state management
   - Dismissal tracking with cooldowns
   - Auto-detection based on user behavior

4. **Integration Hooks**
   - `useNudge()` - Access nudge system
   - `useFeatureAccess()` - Check and gate features

## Trigger Types

### 1. Feature-Gated Triggers

Features that require specific tiers:

**PRO Features (from FREE):**
- Omni-Channel Chatbot
- DeepScan v3
- Auto Follow-Ups
- Appointment Scheduler
- Emotional Selling Layer
- Product Intelligence
- Company Intelligence

**TEAM Features (from PRO):**
- Team Dashboard
- Recruiting AI
- Lead Distribution
- Team Analytics
- Shared Pipelines

### 2. Usage-Based Triggers

**FREE → PRO:**
- Scan limit: 3/day
- Message limit: 3/day
- Pitch deck limit: 1/week
- Pipeline full: 3 stages
- Energy < 2
- Coins < 10

**PRO → TEAM:**
- Prospect count > 100
- Active conversations > 20
- Pipeline count > 100
- Sharing attempts

### 3. Intelligence Triggers

Smart, contextual nudges:
- "You've scanned 20 prospects this week"
- "Your inbox is getting full"
- "You're on fire! 🔥"

## UI Components

### UpgradeBanner

Floating banner at top of screen.

**Features:**
- Auto-dismisses after 8 seconds
- Countdown progress bar
- Sparkle icon animation
- Gradient background
- Smooth slide-in animation

**Usage:**
```tsx
import { UpgradeBanner } from '@/components/upgrade';

<UpgradeBanner
  message="You've reached your 3 free scans today"
  ctaText="Get Unlimited Scans"
  onUpgrade={() => navigate('/pricing')}
  onDismiss={() => console.log('dismissed')}
  autoDismiss={true}
  autoDismissDelay={8000}
/>
```

### UpgradeModal

Full modal popup with benefits list.

**Features:**
- Animated entry (scale + fade)
- Tier-specific colors (PRO = blue, TEAM = purple)
- Staggered benefit animations
- Backdrop blur
- Optional dismiss

**Usage:**
```tsx
import { UpgradeModal } from '@/components/upgrade';

<UpgradeModal
  isOpen={showModal}
  title="Unlock Your AI Sales Partner"
  message="You're using NexScout like a pro closer!"
  benefits={[
    'Unlimited AI Scanning',
    'Omni-channel Chatbot',
    'Auto Follow-Ups',
  ]}
  ctaText="Upgrade to PRO — ₱1,299/mo"
  targetTier="PRO"
  onClose={() => setShowModal(false)}
  onUpgrade={() => navigate('/pricing')}
  dismissible={true}
/>
```

### PaywallScreen

Full-screen paywall for major features.

**Features:**
- Gradient header
- Benefits list with animations
- Pricing display
- Trust signals
- Back button option

**Usage:**
```tsx
import { PaywallScreen } from '@/components/upgrade';

<PaywallScreen
  title="DeepScan v3 - Advanced Intelligence"
  message="Unlock buying intent, personality analysis, and more"
  benefits={[
    'Buying intent score (0-100)',
    'Personality profiling (DISC)',
    'Emotional trigger detection',
  ]}
  ctaText="Upgrade to PRO — ₱1,299/mo"
  targetTier="PRO"
  onUpgrade={() => navigate('/pricing')}
  onBack={() => navigate('/home')}
/>
```

### FeaturePaywall

Inline locked feature indicator.

**Variants:**
- `button` - Locked button style
- `card` - Full card with gradient
- `inline` - Small inline badge

**Features:**
- Shake animation on click
- Lock icon
- Tier badge (PRO/TEAM)
- Hover effects

**Usage:**
```tsx
import { FeaturePaywall } from '@/components/upgrade';

// Button variant
<FeaturePaywall
  featureName="Auto Follow-Up"
  targetTier="PRO"
  onUpgrade={() => navigate('/pricing')}
  variant="button"
/>

// Card variant
<FeaturePaywall
  featureName="Team Dashboard"
  description="Monitor your entire team in one place"
  targetTier="TEAM"
  onUpgrade={() => navigate('/pricing')}
  variant="card"
/>

// Inline variant
<FeaturePaywall
  featureName="Emotional Selling"
  targetTier="PRO"
  onUpgrade={() => navigate('/pricing')}
  variant="inline"
/>
```

### BlurredContent

Blur overlay for locked content.

**Usage:**
```tsx
import { BlurredContent } from '@/components/upgrade';

<BlurredContent
  featureName="DeepScan Results"
  targetTier="PRO"
  onUpgrade={() => navigate('/pricing')}
>
  <div>
    {/* Content that will be blurred */}
    <p>Intent Score: 87</p>
    <p>Personality: Driver</p>
  </div>
</BlurredContent>
```

## Integration Guide

### 1. Global Integration (Already Done)

The NudgeProvider is wrapped around the app in `App.tsx`:

```tsx
<AuthProvider>
  <EnergyProvider>
    <NudgeProvider>
      <NudgeRenderer />  {/* Auto-renders nudges */}
      <AppContent />
    </NudgeProvider>
  </EnergyProvider>
</AuthProvider>
```

### 2. Feature Access Check

Use the `useFeatureAccess` hook:

```tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MyComponent() {
  const { checkFeature, withFeatureCheck } = useFeatureAccess();

  const handleDeepScan = () => {
    if (!checkFeature('deep-scan')) {
      // Nudge automatically shown
      return;
    }

    // User has access, proceed
    runDeepScan();
  };

  // Or wrap the function
  const handleAutoFollowUp = withFeatureCheck(
    'auto-followup',
    () => {
      setupAutoFollowUp();
    }
  );

  return (
    <button onClick={handleDeepScan}>
      Run DeepScan
    </button>
  );
}
```

### 3. Manual Nudge Trigger

Trigger nudges based on custom conditions:

```tsx
import { useNudge } from '@/contexts/NudgeContext';

function ProspectScanner() {
  const { checkNudge } = useNudge();

  useEffect(() => {
    // Check if user hit daily limit
    if (scansToday >= 3) {
      checkNudge({ scansToday });
    }
  }, [scansToday]);
}
```

### 4. Usage Tracking

Track usage and trigger nudges:

```tsx
import { useNudge } from '@/contexts/NudgeContext';

function MessagingPage() {
  const { checkNudge } = useNudge();
  const [messagesSent, setMessagesSent] = useState(0);

  const sendMessage = async (message: string) => {
    const newCount = messagesSent + 1;
    setMessagesSent(newCount);

    // Check for limit
    checkNudge({
      messagesToday: newCount,
    });

    if (newCount < 3 || tier !== 'FREE') {
      await actualSendMessage(message);
    }
  };
}
```

### 5. Paywall Pages

For major locked features, use full paywall:

```tsx
import { PaywallScreen } from '@/components/upgrade';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function DeepScanPage() {
  const { canAccess } = useFeatureAccess();

  if (!canAccess('deep-scan')) {
    return (
      <PaywallScreen
        title="DeepScan v3"
        message="Advanced AI intelligence for better conversions"
        benefits={[
          'Buying intent score',
          'Personality profiling',
          'Emotional triggers',
        ]}
        ctaText="Upgrade to PRO"
        targetTier="PRO"
        onUpgrade={() => navigate('/pricing')}
        onBack={() => navigate('/home')}
      />
    );
  }

  return <DeepScanContent />;
}
```

## Nudge Cooldown System

To prevent annoyance, dismissed nudges have a 5-minute cooldown before showing again.

The system tracks dismissals in `NudgeContext`:
```typescript
const wasRecentlyDismissed = (trigger: NudgeTrigger): boolean => {
  const dismissTime = lastDismissed[trigger];
  if (!dismissTime) return false;

  const timeSince = Date.now() - dismissTime;
  const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  return timeSince < cooldownPeriod;
};
```

## Micro-UX Features

### Shake Animation

When users click locked features, they shake:
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
```

### Blur Effect

Locked content is blurred with overlay:
```tsx
<div className="filter blur-sm pointer-events-none" />
```

### Staggered Animations

Benefits list items animate in sequence:
```tsx
style={{ animationDelay: `${index * 50}ms` }}
```

### Progress Countdown

Banners show visual countdown:
```css
animation: countdown 8000ms linear forwards;
```

## Feature Map

All gated features and their required tiers:

```typescript
const FEATURE_TIER_MAP = {
  'omni-chatbot': 'PRO',
  'deep-scan': 'PRO',
  'auto-followup': 'PRO',
  'appointment-scheduler': 'PRO',
  'emotional-selling': 'PRO',
  'product-intelligence': 'PRO',
  'company-intelligence': 'PRO',
  'team-dashboard': 'TEAM',
  'recruiting-ai': 'TEAM',
  'lead-distribution': 'TEAM',
  'team-analytics': 'TEAM',
  'shared-pipelines': 'TEAM',
};
```

## Nudge Messages

Pre-configured messages for each trigger:

**Scan Limit:**
"You've reached your 3 free scans today. Upgrade to PRO for unlimited scanning."

**Message Limit:**
"You've used your 3 daily AI messages. PRO unlocks unlimited messaging."

**Low Energy:**
"Running low on energy. PRO gives you 200 energy/day!"

**High Engagement:**
"You're on fire! 🔥 You're using NexScout like a pro closer. Ready to unlock full power?"

**Team Upsell:**
"Managing 100+ prospects? Time to build a team and distribute leads."

## Pricing Display

**PRO:**
- ₱1,299/month
- Blue theme (#2563EB)

**TEAM:**
- ₱4,990/month
- Purple theme (#9333EA)
- Includes 5 seats

## Best Practices

### 1. Don't Over-Nudge

✅ **Good:**
- Show nudge when user attempts locked feature
- Show nudge when hitting daily limit
- Show nudge when high engagement detected

❌ **Bad:**
- Show nudge on every page load
- Show same nudge repeatedly
- Block basic navigation with nudges

### 2. Make Nudges Contextual

✅ **Good:**
- "Your inbox is full. Team mode helps distribute chats."
- "DeepScan reveals buying intent. Upgrade to unlock."

❌ **Bad:**
- Generic "Upgrade now!" everywhere
- No explanation of benefits

### 3. Respect Dismissals

The system automatically:
- Tracks dismissals
- Applies 5-minute cooldown
- Doesn't show again until cooldown expires

### 4. Use Appropriate UI Type

**Banner:** Usage limits, low energy/coins
**Modal:** Feature attempts, high engagement
**Paywall:** Major feature pages
**Inline:** Locked buttons/features

## Testing Checklist

### Trigger Detection
- [x] Feature-gated triggers fire correctly
- [x] Usage-based triggers respect limits
- [x] Intelligence triggers activate appropriately
- [x] Cooldown system works

### UI Components
- [x] UpgradeBanner displays and dismisses
- [x] UpgradeModal opens/closes properly
- [x] PaywallScreen shows all content
- [x] FeaturePaywall has shake animation
- [x] BlurredContent overlays correctly

### Integration
- [x] NudgeProvider wraps app
- [x] NudgeRenderer shows nudges
- [x] useFeatureAccess hooks work
- [x] useNudge context accessible

### User Experience
- [x] Animations smooth
- [x] No performance issues
- [x] Mobile responsive
- [x] Dismissals tracked
- [x] Navigation to pricing works

## Performance Considerations

### Optimizations
- Nudge state managed globally (no prop drilling)
- Dismissals stored in memory (not localStorage yet)
- Cooldown prevents spam
- Lazy rendering (only active nudge rendered)

### Future Improvements
- [ ] Persist dismissals to localStorage
- [ ] A/B test nudge messages
- [ ] Track conversion rates
- [ ] Add telemetry for nudge effectiveness

## Analytics Events

Track these events:

```typescript
// Nudge shown
analytics.track('nudge_shown', {
  trigger: 'LIMIT_REACHED_SCAN',
  tier: 'FREE',
  targetTier: 'PRO',
});

// Nudge dismissed
analytics.track('nudge_dismissed', {
  trigger: 'LIMIT_REACHED_SCAN',
});

// Nudge converted
analytics.track('nudge_converted', {
  trigger: 'DEEP_SCAN_LOCKED',
  tier: 'FREE',
  targetTier: 'PRO',
});
```

## Examples

### Example 1: Prospect Scanner

```tsx
function ProspectScanner() {
  const { checkNudge } = useNudge();
  const { checkFeature } = useFeatureAccess();
  const [scansToday, setScansToday] = useState(0);

  const handleScan = async () => {
    // Check if can scan
    if (tier === 'FREE' && scansToday >= 3) {
      checkNudge({ scansToday });
      return;
    }

    // Proceed with scan
    await performScan();
    setScansToday(prev => prev + 1);
  };

  return (
    <button onClick={handleScan}>
      Scan Prospects ({tier === 'FREE' ? `${scansToday}/3` : '∞'})
    </button>
  );
}
```

### Example 2: DeepScan Feature

```tsx
function DeepScanButton() {
  const { checkFeature } = useFeatureAccess();

  if (!checkFeature('deep-scan')) {
    return (
      <FeaturePaywall
        featureName="DeepScan v3"
        targetTier="PRO"
        onUpgrade={() => navigate('/pricing')}
        variant="button"
      />
    );
  }

  return (
    <button onClick={runDeepScan}>
      Run DeepScan
    </button>
  );
}
```

### Example 3: Team Dashboard

```tsx
function TeamDashboardPage() {
  const { canAccess } = useFeatureAccess();

  if (!canAccess('team-dashboard')) {
    return (
      <PaywallScreen
        title="Team Dashboard"
        message="Monitor and manage your entire sales team"
        benefits={[
          'Real-time performance',
          'Lead distribution',
          'Team training AI',
        ]}
        ctaText="Upgrade to Team — ₱4,990/mo"
        targetTier="TEAM"
        onUpgrade={() => navigate('/pricing')}
      />
    );
  }

  return <TeamDashboardContent />;
}
```

## Conclusion

The Upgrade Nudge System v2 is fully operational and provides a beautiful, non-intrusive way to guide users toward upgrading. All components are production-ready, mobile-responsive, and follow best practices for user experience.

**Status:** ✅ Complete and Production-Ready
