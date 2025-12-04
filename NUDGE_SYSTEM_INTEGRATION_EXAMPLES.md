# Nudge System v2 - Integration Examples

Quick copy-paste examples for integrating the upgrade nudge system into your pages.

## 1. Basic Feature Check

### Scenario: Button that requires PRO

```tsx
import { FeaturePaywall } from '@/components/upgrade';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MyPage() {
  const { canAccess } = useFeatureAccess();

  return (
    <div>
      {canAccess('deep-scan') ? (
        <button onClick={handleDeepScan}>Run DeepScan</button>
      ) : (
        <FeaturePaywall
          featureName="DeepScan v3"
          targetTier="PRO"
          onUpgrade={() => navigate('/pricing')}
          variant="button"
        />
      )}
    </div>
  );
}
```

## 2. Usage Limit Tracking

### Scenario: Track daily scans and show nudge at limit

```tsx
import { useNudge } from '@/contexts/NudgeContext';
import { useState, useEffect } from 'react';

function ScannerPage() {
  const { checkNudge } = useNudge();
  const { tier } = useFeatureAccess();
  const [scansToday, setScansToday] = useState(0);

  const handleScan = async () => {
    const newCount = scansToday + 1;

    // Check nudge before scanning
    if (tier === 'FREE' && newCount > 3) {
      checkNudge({ scansToday: newCount });
      return;
    }

    // Proceed with scan
    await performScan();
    setScansToday(newCount);
  };

  return (
    <div>
      <h2>Prospect Scanner</h2>
      {tier === 'FREE' && (
        <p className="text-sm text-gray-600">
          {scansToday}/3 scans used today
        </p>
      )}
      <button onClick={handleScan}>Scan Prospects</button>
    </div>
  );
}
```

## 3. Full Page Paywall

### Scenario: Entire page requires PRO

```tsx
import { PaywallScreen } from '@/components/upgrade';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function DeepScanPage() {
  const { canAccess } = useFeatureAccess();

  if (!canAccess('deep-scan')) {
    return (
      <PaywallScreen
        title="DeepScan v3 - Advanced Intelligence"
        message="Unlock buying intent, personality analysis, emotional triggers, and more."
        benefits={[
          'Buying intent score (0-100)',
          'Personality profiling (DISC)',
          'Emotional trigger detection',
          'Financial capability assessment',
          'Timeline prediction',
          'Objection mapping',
        ]}
        ctaText="Upgrade to PRO — ₱1,299/mo"
        targetTier="PRO"
        onUpgrade={() => navigate('/pricing')}
        onBack={() => navigate('/home')}
      />
    );
  }

  return <DeepScanContent />;
}
```

## 4. Blurred Locked Content

### Scenario: Show preview but blur detailed data

```tsx
import { BlurredContent } from '@/components/upgrade';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function ProspectDetailPage() {
  const { canAccess } = useFeatureAccess();

  return (
    <div>
      <h2>Prospect Analysis</h2>

      {/* Basic info - always visible */}
      <div>
        <p>Name: John Doe</p>
        <p>Email: john@example.com</p>
      </div>

      {/* Advanced analysis - PRO only */}
      {canAccess('deep-scan') ? (
        <div>
          <p>Buying Intent: 87/100</p>
          <p>Personality: Driver</p>
          <p>Emotional Triggers: Success, Recognition</p>
        </div>
      ) : (
        <BlurredContent
          featureName="DeepScan Analysis"
          targetTier="PRO"
          onUpgrade={() => navigate('/pricing')}
        >
          <div>
            <p>Buying Intent: 87/100</p>
            <p>Personality: Driver</p>
            <p>Emotional Triggers: Success, Recognition</p>
          </div>
        </BlurredContent>
      )}
    </div>
  );
}
```

## 5. Feature Wrapper Function

### Scenario: Wrap action with automatic feature check

```tsx
import { useFeatureAccess } from '@/hooks/useFeatureAccess';

function MessagingPage() {
  const { withFeatureCheck } = useFeatureAccess();

  // Automatically checks and shows nudge if needed
  const handleAutoFollowUp = withFeatureCheck(
    'auto-followup',
    () => {
      console.log('Setting up auto follow-up...');
      setupAutoFollowUpSequence();
    }
  );

  return (
    <button onClick={handleAutoFollowUp}>
      Enable Auto Follow-Ups
    </button>
  );
}
```

## 6. Energy/Coin Tracking

### Scenario: Check low resources and trigger nudges

```tsx
import { useNudge } from '@/contexts/NudgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

function EnergyDisplay() {
  const { profile } = useAuth();
  const { checkNudge } = useNudge();

  useEffect(() => {
    // Auto-check when energy is low
    if (profile && profile.energy_balance < 2) {
      checkNudge({
        energy: profile.energy_balance,
      });
    }
  }, [profile?.energy_balance]);

  return (
    <div>
      <p>Energy: {profile?.energy_balance || 0}</p>
    </div>
  );
}
```

## 7. Locked Feature Card

### Scenario: Card-style locked feature

```tsx
import { FeaturePaywall } from '@/components/upgrade';

function FeaturesGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Unlocked feature */}
      <div className="p-4 bg-white rounded-xl">
        <h3>Basic Scan</h3>
        <p>Scan prospects quickly</p>
        <button>Use Now</button>
      </div>

      {/* Locked feature */}
      <FeaturePaywall
        featureName="Auto Follow-Up"
        description="AI automatically follows up at optimal times"
        targetTier="PRO"
        onUpgrade={() => navigate('/pricing')}
        variant="card"
      />
    </div>
  );
}
```

## 8. Team Upsell Detection

### Scenario: Detect when user needs team features

```tsx
import { useNudge } from '@/contexts/NudgeContext';
import { useEffect } from 'react';

function PipelinePage() {
  const { checkNudge } = useNudge();
  const { tier } = useFeatureAccess();
  const prospectCount = 150; // from your state

  useEffect(() => {
    // Suggest team upgrade when managing many prospects
    if (tier === 'PRO' && prospectCount > 100) {
      checkNudge({
        prospectCount,
      });
    }
  }, [prospectCount, tier]);

  return (
    <div>
      <h2>Pipeline ({prospectCount} prospects)</h2>
      {/* Pipeline content */}
    </div>
  );
}
```

## 9. High Engagement Detection

### Scenario: User is very active, show upgrade opportunity

```tsx
import { useNudge } from '@/contexts/NudgeContext';
import { useEffect } from 'react';

function HomePage() {
  const { checkNudge } = useNudge();
  const { tier } = useFeatureAccess();

  // Track user activity
  const scansToday = 3;
  const messagesToday = 3;
  const energy = 3;

  useEffect(() => {
    // Detect high engagement
    if (tier === 'FREE' && scansToday >= 2 && messagesToday >= 2) {
      checkNudge({
        scansToday,
        messagesToday,
        energy,
      });
    }
  }, [scansToday, messagesToday, energy]);

  return <div>{/* Home content */}</div>;
}
```

## 10. Manual Trigger

### Scenario: Show upgrade modal on specific button click

```tsx
import { useNudge } from '@/contexts/NudgeContext';

function SettingsPage() {
  const { triggerFeatureNudge } = useNudge();

  const handleUpgradeClick = () => {
    // Manually trigger feature nudge
    triggerFeatureNudge('product-intelligence');
  };

  return (
    <button onClick={handleUpgradeClick}>
      Learn About PRO Features
    </button>
  );
}
```

## Quick Reference

### Importing Components

```tsx
import { UpgradeBanner } from '@/components/upgrade';
import { UpgradeModal } from '@/components/upgrade';
import { PaywallScreen } from '@/components/upgrade';
import { FeaturePaywall, BlurredContent } from '@/components/upgrade';
```

### Importing Hooks

```tsx
import { useNudge } from '@/contexts/NudgeContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
```

### Feature Names (for checkFeature)

```typescript
'omni-chatbot'
'deep-scan'
'auto-followup'
'appointment-scheduler'
'emotional-selling'
'product-intelligence'
'company-intelligence'
'team-dashboard'
'recruiting-ai'
'lead-distribution'
'team-analytics'
'shared-pipelines'
```

### Target Tiers

```typescript
'PRO'   // For Free → Pro upgrades
'TEAM'  // For Pro → Team upgrades
```

## Common Patterns

### Pattern 1: Simple Lock

```tsx
{canAccess('feature') ? (
  <UnlockedComponent />
) : (
  <FeaturePaywall feature="name" tier="PRO" />
)}
```

### Pattern 2: Usage Counter

```tsx
const [used, setUsed] = useState(0);
const limit = tier === 'FREE' ? 3 : Infinity;

if (used >= limit) {
  checkNudge({ scansToday: used });
  return;
}
```

### Pattern 3: Blur Preview

```tsx
{canAccess('feature') ? (
  <FullContent />
) : (
  <BlurredContent feature="name" tier="PRO">
    <FullContent />
  </BlurredContent>
)}
```

### Pattern 4: Wrapped Action

```tsx
const handleAction = withFeatureCheck('feature', () => {
  // Only runs if user has access
  doAction();
});
```

## Testing Tips

1. **Test Free Tier:**
   - Set profile tier to 'FREE'
   - Attempt locked features
   - Hit daily limits
   - Verify nudges appear

2. **Test PRO Tier:**
   - Set profile tier to 'PRO'
   - Verify all PRO features unlocked
   - Test Team feature locks
   - Check Team upsell triggers

3. **Test Dismissal:**
   - Dismiss a nudge
   - Verify it doesn't reappear for 5 minutes
   - Check cooldown works

4. **Test Mobile:**
   - All nudges responsive
   - Modals fit screen
   - Banners don't overflow
   - Touch interactions work

## Troubleshooting

**Nudge not showing:**
- Check if NudgeProvider is wrapped in App.tsx
- Verify NudgeRenderer is rendered
- Check if nudge was recently dismissed
- Confirm trigger condition is met

**Feature check not working:**
- Verify profile.subscription_tier is set
- Check feature name spelling
- Ensure FEATURE_TIER_MAP has the feature

**Animations not smooth:**
- Check Tailwind config includes animations
- Verify CSS is loaded
- Test on different browsers

Ready to integrate! Pick the pattern that fits your use case and copy-paste! 🚀
