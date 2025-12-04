import { supabase } from '../lib/supabase';

export type NudgeVariant = 'control' | 'variant_a' | 'variant_b' | 'variant_c';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: NudgeVariant[];
  isActive: boolean;
  startDate: Date;
  endDate?: Date;
}

export interface VariantAssignment {
  userId: string;
  testId: string;
  variant: NudgeVariant;
  assignedAt: Date;
}

export interface ABTestResult {
  variant: NudgeVariant;
  shown: number;
  clicked: number;
  converted: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
}

export async function assignVariant(userId: string, testName: string): Promise<NudgeVariant> {
  const existingAssignment = await supabase
    .from('nudge_ab_assignments')
    .select('variant')
    .eq('user_id', userId)
    .eq('test_name', testName)
    .maybeSingle();

  if (existingAssignment.data) {
    return existingAssignment.data.variant as NudgeVariant;
  }

  const variants: NudgeVariant[] = ['control', 'variant_a', 'variant_b'];
  const randomVariant = variants[Math.floor(Math.random() * variants.length)];

  await supabase.from('nudge_ab_assignments').insert({
    user_id: userId,
    test_name: testName,
    variant: randomVariant,
  });

  return randomVariant;
}

export async function getVariantConfig(variant: NudgeVariant): Promise<any> {
  const configs = {
    control: {
      copyStyle: 'standard',
      urgency: 'medium',
      showROI: false,
      showDiscount: true,
      animation: 'fade',
    },
    variant_a: {
      copyStyle: 'emotional',
      urgency: 'high',
      showROI: true,
      showDiscount: true,
      animation: 'slide',
    },
    variant_b: {
      copyStyle: 'data_driven',
      urgency: 'critical',
      showROI: true,
      showDiscount: false,
      animation: 'scale',
    },
    variant_c: {
      copyStyle: 'conversational',
      urgency: 'low',
      showROI: false,
      showDiscount: true,
      animation: 'blur',
    },
  };

  return configs[variant];
}

export async function trackVariantEvent(params: {
  userId: string;
  testName: string;
  variant: NudgeVariant;
  eventType: 'shown' | 'clicked' | 'dismissed' | 'converted';
  metadata?: any;
}): Promise<void> {
  await supabase.from('nudge_ab_events').insert({
    user_id: params.userId,
    test_name: params.testName,
    variant: params.variant,
    event_type: params.eventType,
    metadata: params.metadata,
  });
}

export async function getTestResults(testName: string, days: number = 30): Promise<ABTestResult[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: events } = await supabase
    .from('nudge_ab_events')
    .select('*')
    .eq('test_name', testName)
    .gte('created_at', startDate.toISOString());

  if (!events) return [];

  const variantMap = new Map<
    NudgeVariant,
    { shown: number; clicked: number; converted: number }
  >();

  events.forEach((event) => {
    const variant = event.variant as NudgeVariant;
    const current = variantMap.get(variant) || { shown: 0, clicked: 0, converted: 0 };

    if (event.event_type === 'shown') current.shown++;
    if (event.event_type === 'clicked') current.clicked++;
    if (event.event_type === 'converted') current.converted++;

    variantMap.set(variant, current);
  });

  const results: ABTestResult[] = [];
  variantMap.forEach((data, variant) => {
    results.push({
      variant,
      shown: data.shown,
      clicked: data.clicked,
      converted: data.converted,
      ctr: data.shown > 0 ? (data.clicked / data.shown) * 100 : 0,
      conversionRate: data.shown > 0 ? (data.converted / data.shown) * 100 : 0,
      revenue: data.converted * 499,
    });
  });

  return results.sort((a, b) => b.conversionRate - a.conversionRate);
}

export async function calculateStatisticalSignificance(
  testName: string
): Promise<{ isSignificant: boolean; confidence: number; winner?: NudgeVariant }> {
  const results = await getTestResults(testName);

  if (results.length < 2) {
    return { isSignificant: false, confidence: 0 };
  }

  const [best, second] = results.sort((a, b) => b.conversionRate - a.conversionRate);

  const pooledP =
    (best.converted + second.converted) / (best.shown + second.shown);
  const pooledSE = Math.sqrt(
    pooledP * (1 - pooledP) * (1 / best.shown + 1 / second.shown)
  );

  const pDiff = best.conversionRate / 100 - second.conversionRate / 100;
  const zScore = pDiff / pooledSE;

  const confidence = 1 - 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    isSignificant: confidence >= 0.95 && best.shown >= 100,
    confidence,
    winner: confidence >= 0.95 ? best.variant : undefined,
  };
}

function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const probability =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - probability : probability;
}

export async function createTest(params: {
  name: string;
  description: string;
  variants: NudgeVariant[];
  durationDays: number;
}): Promise<string> {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + params.durationDays);

  const { data, error } = await supabase
    .from('nudge_ab_tests')
    .insert({
      name: params.name,
      description: params.description,
      variants: params.variants,
      is_active: true,
      end_date: endDate.toISOString(),
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function endTest(testId: string): Promise<void> {
  await supabase
    .from('nudge_ab_tests')
    .update({ is_active: false, end_date: new Date().toISOString() })
    .eq('id', testId);
}

export async function getActiveTests(): Promise<ABTest[]> {
  const { data } = await supabase
    .from('nudge_ab_tests')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return (data || []).map((test) => ({
    id: test.id,
    name: test.name,
    description: test.description,
    variants: test.variants,
    isActive: test.is_active,
    startDate: new Date(test.created_at),
    endDate: test.end_date ? new Date(test.end_date) : undefined,
  }));
}

export function shouldShowNudgeForVariant(
  variant: NudgeVariant,
  userContext: {
    scanCount: number;
    messageCount: number;
    daysSinceSignup: number;
  }
): boolean {
  switch (variant) {
    case 'control':
      return userContext.scanCount >= 5;

    case 'variant_a':
      return userContext.scanCount >= 3;

    case 'variant_b':
      return userContext.scanCount >= 7 || userContext.messageCount >= 10;

    case 'variant_c':
      return userContext.daysSinceSignup >= 2 && userContext.scanCount >= 2;

    default:
      return false;
  }
}

export function getNudgeCopyForVariant(
  variant: NudgeVariant,
  emotionalState: string
): string {
  const copies = {
    control: {
      excited: 'Upgrade to PRO for unlimited scans and features!',
      frustrated: 'Remove all limits with PRO membership.',
      curious: 'Discover what PRO can do for your business.',
    },
    variant_a: {
      excited: "🔥 You're on fire! Unlock PRO and 10x your results!",
      frustrated: '😤 No more limits. PRO sets you free.',
      curious: '🤔 Ready to see the full picture? Upgrade now!',
    },
    variant_b: {
      excited: 'Users who upgrade see 3.5x more deals closed. Join them!',
      frustrated: '87% of PRO users never hit limits. Upgrade today.',
      curious: 'PRO users earn ₱12,000 more monthly on average.',
    },
    variant_c: {
      excited: "Hey, you're doing great! Want to level up together?",
      frustrated: "I get it. Let's remove these roadblocks for you.",
      curious: "Curious about PRO? Let me show you what's inside!",
    },
  };

  const variantCopies = copies[variant] || copies.control;
  return variantCopies[emotionalState as keyof typeof variantCopies] || variantCopies.curious;
}
