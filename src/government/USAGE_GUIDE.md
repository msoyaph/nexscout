# NexScout Government System - Usage Guide

## Overview

The NexScout Government system provides a constitutional framework for managing 30+ AI engines, 18+ subsystems, and 50+ core features. It implements a three-branch government model with checks and balances.

## Architecture

### Three Branches of Government

1. **The President (Master Orchestrator)** - Routes and orchestrates all AI requests
2. **Congress (Rules & Economy Engine)** - Enforces permissions, rate limits, and economy
3. **Supreme Court (Audit & Security)** - Audits executions and enforces safety standards

### Eight Departments

- **Engineering** - AI engines, pipelines, ML systems
- **UI/UX** - Design consistency, user interactions
- **Database** - Data storage, integrity, performance
- **Security** - Threat detection, API protection
- **Optimization** - Token usage, cost monitoring
- **User Experience** - Onboarding, gamification, missions
- **Communication** - Chatbot, messaging, persona
- **Knowledge** - Company intelligence, product graphs

## Quick Start

### Basic Usage

```typescript
import { government } from '@/government';

// Execute a governed AI request
const response = await government.executeRequest({
  user_id: userId,
  feature: 'ai_messages',
  action: 'generate',
  payload: { prompt: 'Write a sales message' },
  context: { tier: 'pro' }
});

if (response.approved) {
  console.log('Result:', response.result);
  console.log('Energy used:', response.cost.energy);
} else {
  console.error('Request denied:', response.error);
}
```

### Using Middleware (Recommended)

```typescript
import { governedAIRequest } from '@/government/middleware/governmentMiddleware';

// Automatically handles feature checks, rate limits, and governance
const response = await governedAIRequest(
  userId,
  'ai_messages',
  'Write a sales message to John',
  { requireQuality: true }
);
```

### Checking Feature Access

```typescript
import { checkFeatureAccess } from '@/government/middleware/governmentMiddleware';

const access = await checkFeatureAccess(userId, 'elite_coaching');

if (!access.allowed) {
  // Show upgrade prompt
  console.log(access.upgrade_prompt);
}
```

### Managing Coins

```typescript
import { awardCoins, deductCoins, getCoinCost } from '@/government/middleware/governmentMiddleware';

// Award coins for completing a scan
await awardCoins(userId, 'scan_completion');

// Check cost before deduction
const cost = getCoinCost('ai_pitch_deck');
console.log(`This action costs ${cost} coins`);

// Deduct coins for using a feature
const success = await deductCoins(userId, 'ai_pitch_deck');
if (!success) {
  console.log('Insufficient coins');
}
```

### Scanning with Governance

```typescript
import { governedScanRequest } from '@/government/middleware/governmentMiddleware';

const response = await governedScanRequest(
  userId,
  'fb_friends',
  { screenshot: imageData },
  { source: 'mobile_app' }
);

if (response.approved) {
  console.log('Scan completed:', response.result);
} else {
  console.log('Scan blocked:', response.error);
}
```

### Company Intelligence

```typescript
import { governedCompanyIntelligenceRequest } from '@/government/middleware/governmentMiddleware';

const response = await governedCompanyIntelligenceRequest(
  userId,
  'https://example.com',
  { depth: 'full' }
);

if (response.approved) {
  console.log('Company data:', response.result);
}
```

## Permission Tiers

### Free Tier
- 2 scans per day
- 2 AI messages per day
- Basic quality AI models
- No company intelligence
- No elite coaching

### Pro Tier
- 20 scans per day
- Unlimited AI messages
- Standard quality AI models
- Company intelligence
- Pitch deck generation

### Elite Tier
- Unlimited scans
- Unlimited AI messages
- Premium quality AI models
- Elite coaching
- All features unlocked

### Enterprise Tier
- Highest rate limits
- Premium AI models
- All features unlocked
- Priority support

## System Health & Monitoring

### Get System Health

```typescript
import { getSystemHealth } from '@/government/middleware/governmentMiddleware';

const health = await getSystemHealth();
console.log('Overall health:', health.overall_health_score);
console.log('Branch health:', health.branch_health);
console.log('Active violations:', health.active_violations);
```

### Run System Audit

```typescript
import { runSystemAudit } from '@/government/middleware/governmentMiddleware';

const auditReport = await runSystemAudit();
console.log('Severity:', auditReport.severity);
console.log('Findings:', auditReport.findings);
console.log('Violations:', auditReport.violations);
```

### Get Compliance Score

```typescript
import { getComplianceScore } from '@/government/middleware/governmentMiddleware';

const score = await getComplianceScore();
console.log(`Compliance: ${score}%`);
```

## Department Coordination

```typescript
import { departmentCoordinator } from '@/government';

// Get department metrics
const metrics = await departmentCoordinator.getDepartmentMetrics('engineering');
console.log('Total engines:', metrics.total_engines);
console.log('Healthy:', metrics.healthy_engines);
console.log('Avg response time:', metrics.avg_response_time_ms);

// Get all departments
const allDepartments = departmentCoordinator.getAllDepartments();

// Register a new engine
await departmentCoordinator.registerEngine('my_new_engine', 'communication');
```

## Advanced Usage

### Direct Branch Access

```typescript
import { masterOrchestrator, congress, supremeCourt } from '@/government';

// President - Execute request
const result = await masterOrchestrator.executeRequest(executionRequest);

// Congress - Check permissions
const permission = await congress.checkFeaturePermission(userId, 'deep_scan');

// Supreme Court - Audit execution
const audit = await supremeCourt.auditExecution(result);
```

### Emergency Actions

```typescript
// Issue emergency order (admin only)
await government.issueEmergencyOrder(
  'surge_protection',
  'High system load detected',
  ['messaging_engine_v2', 'chatbot_engine'],
  30 // duration in minutes
);
```

### Conflict Resolution

```typescript
// Resolve conflict between engines
await government.resolveConflict(
  'messaging_engine_v2',
  'chatbot_engine',
  'resource_contention',
  'Both engines attempting simultaneous token-heavy operations'
);
```

## Integration Examples

### In a React Component

```typescript
import { useEffect, useState } from 'react';
import { governedAIRequest, checkFeatureAccess } from '@/government/middleware/governmentMiddleware';

function AIMessageGenerator({ userId }) {
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    checkFeatureAccess(userId, 'ai_messages').then(access => {
      setHasAccess(access.allowed);
    });
  }, [userId]);

  const generateMessage = async () => {
    const response = await governedAIRequest(
      userId,
      'ai_messages',
      'Generate a cold outreach message'
    );

    if (response.approved) {
      console.log('Message:', response.result);
    } else {
      alert(response.error);
    }
  };

  if (!hasAccess) {
    return <div>Upgrade to Pro to unlock AI messages</div>;
  }

  return <button onClick={generateMessage}>Generate Message</button>;
}
```

### In an Edge Function

```typescript
import { government } from '../../../src/government';

Deno.serve(async (req: Request) => {
  const { userId, feature, action, payload } = await req.json();

  const response = await government.executeRequest({
    user_id: userId,
    feature,
    action,
    payload,
  });

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

## Best Practices

1. **Always use middleware functions** - They handle checks automatically
2. **Check feature access before showing UI** - Prevent frustration
3. **Handle rate limit errors gracefully** - Show helpful messages
4. **Monitor system health regularly** - Set up dashboards
5. **Award coins for user actions** - Encourage engagement
6. **Use appropriate priority levels** - Critical operations first
7. **Check execution results** - Handle approval/denial properly
8. **Log important decisions** - Enable debugging

## Troubleshooting

### Request Denied

Check:
1. User's subscription tier
2. Feature access permissions
3. Rate limits (daily/hourly)
4. Energy/coin balance
5. System health status

### Poor Performance

Check:
1. Department health scores
2. Engine response times
3. Active violations
4. System load percentage
5. Token efficiency metrics

### High Costs

Check:
1. Token usage per request
2. Model selection (basic vs premium)
3. Prompt optimization opportunities
4. Caching strategies
5. Rate limiting effectiveness

## Database Tables

The government system uses these tables:

- `government_constitution_versions` - Constitutional history
- `government_decisions` - Presidential decisions
- `government_laws` - Congressional laws
- `government_law_rules` - Law enforcement rules
- `government_audits` - Supreme Court audits
- `government_violations` - Constitutional violations
- `government_engine_health` - Engine health metrics
- `government_department_metrics` - Department performance
- `government_conflicts` - Inter-engine conflicts
- `government_emergency_events` - Emergency actions
- `government_performance_metrics` - System-wide metrics

## Support

For questions or issues:
1. Check the CONSTITUTION.md for governance principles
2. Review department mandates in governmentConfig.ts
3. Examine audit reports for violations
4. Monitor system health dashboard
5. Contact the NexScout Architecture Team

---

**For the People, By the Code, With Intelligence**
