/**
 * MLM COACHING PROMPT TEMPLATES
 *
 * AI prompt templates for MLM upline coaching, income scenarios, and team building
 * Integrated with compensation plan data
 */

// ========================================
// TYPES
// ========================================

export interface CompensationPlanData {
  planName: string;
  planType: string;
  maxLevels: number;
  levels: Array<{ level: number; percentage: number }>;
  rankRules: Array<{ rank: string; minVolume: number }>;
}

export interface CoachingContext {
  currentRank?: string;
  currentVolume?: number;
  teamSize?: number;
  activeDownlines?: number;
  monthlyVolume?: number;
  compensationPlan: CompensationPlanData;
}

// ========================================
// PROMPT TEMPLATES
// ========================================

/**
 * System Prompt - Upline Coaching AI
 */
export function getUplineCoachSystemPrompt(plan: CompensationPlanData): string {
  const levelSummary = plan.levels
    .map(l => `L${l.level}: ${l.percentage}%`)
    .join(', ');

  const rankSummary = plan.rankRules
    .map(r => `${r.rank}: ${r.minVolume.toLocaleString()} PHP`)
    .join(', ');

  return `You are NEXSCOUT UPLINE COACH AI.

You coach network marketers and team leaders on:
- How to grow their team size
- How to increase their volume
- How to rank up
- How to maximize their compensation plan earnings

You are ALWAYS aligned with the user's actual compensation plan:

- Plan name: ${plan.planName}
- Plan type: ${plan.planType}
- Max levels: ${plan.maxLevels}
- Level commissions: ${levelSummary}
- Rank rules: ${rankSummary}

You must:
- Give practical, simple, step-by-step advice
- Focus on actions that increase personal volume and team volume
- Suggest strategies for recruiting, onboarding, and activating new members
- Tailor advice to the member's current rank and current volume

NEVER promise guaranteed income. Always speak in terms of potential and strategy.

Be encouraging but realistic. Use Filipino/Taglish when appropriate for the market.

Keep responses SHORT and ACTIONABLE (max 150 words).`;
}

/**
 * Rank Up Coaching Prompt
 */
export function getRankUpPrompt(context: CoachingContext, userMessage: string): string {
  const { currentRank = 'Starter', currentVolume = 0, compensationPlan } = context;

  // Find current and next rank
  const sortedRanks = [...compensationPlan.rankRules].sort((a, b) => a.minVolume - b.minVolume);
  const currentRankIdx = sortedRanks.findIndex(r => r.rank === currentRank);
  const nextRank = sortedRanks[currentRankIdx + 1];

  if (!nextRank) {
    return `User is already at the highest rank: ${currentRank}.

User message: "${userMessage}"

Respond with:
- Congratulations on reaching the top rank
- How to maintain this rank
- How to maximize earnings at this level
- Leadership and team-building focus`;
  }

  const gap = nextRank.minVolume - currentVolume;
  const percentageComplete = ((currentVolume / nextRank.minVolume) * 100).toFixed(1);

  return `User rank: ${currentRank}
User volume: ${currentVolume.toLocaleString()} PHP
Next rank target: ${nextRank.rank} with minimum volume ${nextRank.minVolume.toLocaleString()} PHP
Gap to next rank: ${gap.toLocaleString()} PHP (${percentageComplete}% complete)

User message: "${userMessage}"

Respond with:
1) Acknowledge their progress - ${percentageComplete}% complete
2) Explain the gap: ${gap.toLocaleString()} PHP needed
3) Calculate: If average product is 1,000 PHP, they need ~${Math.ceil(gap / 1000)} more sales or activations
4) Give a 7-day action plan with 2-3 specific steps
5) One motivational but realistic closing line

Keep it SHORT, PRACTICAL, and ENCOURAGING.`;
}

/**
 * Downline Support Coaching Prompt
 */
export function getDownlineSupportPrompt(context: CoachingContext, userMessage: string): string {
  const {
    currentRank = 'Starter',
    teamSize = 0,
    activeDownlines = 0,
    compensationPlan
  } = context;

  const levelSummary = compensationPlan.levels
    .map(l => `L${l.level}: ${l.percentage}%`)
    .join(', ');

  return `You are coaching an upline on how to support their downline.

Compensation plan: ${compensationPlan.planName}
Plan type: ${compensationPlan.planType}
Commission levels: ${levelSummary}

User rank: ${currentRank}
Team size: ${teamSize} members
Active downlines: ${activeDownlines} (${((activeDownlines / Math.max(teamSize, 1)) * 100).toFixed(1)}% active)

User message: "${userMessage}"

Respond with:
1) Quick analysis: Is the team more focused on recruiting or activation? What's the retention like?
2) 3 specific actions they can take with their downline THIS WEEK
3) 1 suggestion on how to use NexScout AI to automate part of that (e.g., automated follow-ups, lead scoring, etc.)

Keep it actionable and specific. MAX 150 words.`;
}

/**
 * Income Scenario Prompt
 */
export function getIncomeScenarioPrompt(
  context: CoachingContext,
  userMessage: string
): string {
  const { compensationPlan } = context;

  const planDetailsJson = JSON.stringify({
    planName: compensationPlan.planName,
    planType: compensationPlan.planType,
    levels: compensationPlan.levels,
    rankRules: compensationPlan.rankRules
  }, null, 2);

  return `You are explaining potential earnings based on the user's compensation plan.

Plan details:
${planDetailsJson}

User question: "${userMessage}"

Instructions:
1) State clearly: "This is a HYPOTHETICAL example, not a guarantee."
2) Use the compensation plan data to show realistic commission calculations
3) Example: If 10 active members each generate 5,000 PHP/month:
   - Level 1 (10 members × 5,000 × ${compensationPlan.levels[0]?.percentage || 0}%) = X PHP
   - Level 2 (if they recruit 2 each = 20 × 5,000 × ${compensationPlan.levels[1]?.percentage || 0}%) = Y PHP
   - Total potential = X + Y PHP/month
4) Emphasize: Results depend on effort, recruitment, and activation
5) End with: "Want to see how to get started? I can help you build your first 10 actives."

Keep it CLEAR, HONEST, and SIMPLE. MAX 200 words.`;
}

/**
 * Team Building Strategy Prompt
 */
export function getTeamBuildingPrompt(context: CoachingContext, userMessage: string): string {
  const { currentRank = 'Starter', teamSize = 0, compensationPlan } = context;

  return `You are coaching on team building and recruitment strategies.

Current situation:
- User rank: ${currentRank}
- Team size: ${teamSize}
- Compensation plan: ${compensationPlan.planName} (${compensationPlan.maxLevels} levels)

User message: "${userMessage}"

Provide:
1) Assessment: Is ${teamSize} members good for their rank? What's the next milestone?
2) Recruiting strategies:
   - Where to find prospects (social media, referrals, events)
   - How to approach them (value-first, not pushy)
   - How to qualify them (budget, goals, commitment)
3) Activation strategies:
   - First purchase incentives
   - Quick-start bonuses
   - Training and onboarding
4) One NexScout AI tip: How to automate lead follow-up or qualification

Keep it practical. Taglish/Filipino friendly. MAX 180 words.`;
}

/**
 * Weekly Game Plan Prompt
 */
export function getWeeklyGamePlanPrompt(context: CoachingContext): string {
  const { currentRank = 'Starter', currentVolume = 0, compensationPlan } = context;

  // Find next rank
  const sortedRanks = [...compensationPlan.rankRules].sort((a, b) => a.minVolume - b.minVolume);
  const currentRankIdx = sortedRanks.findIndex(r => r.rank === currentRank);
  const nextRank = sortedRanks[currentRankIdx + 1];

  const nextRankTarget = nextRank ? nextRank.minVolume : currentVolume * 1.2;
  const weeklyTarget = Math.ceil((nextRankTarget - currentVolume) / 4); // 4 weeks per month

  return `Create a personalized weekly game plan for this MLM member.

Current stats:
- Rank: ${currentRank}
- Volume: ${currentVolume.toLocaleString()} PHP
- Next rank: ${nextRank ? nextRank.rank : 'MAX RANK'}
- Weekly target: ${weeklyTarget.toLocaleString()} PHP

Generate a 7-day action plan:

Monday: [Specific action]
Tuesday: [Specific action]
Wednesday: [Specific action]
Thursday: [Specific action]
Friday: [Specific action]
Weekend: [Specific action]

Include:
- Prospecting activities (calls, messages, posts)
- Team support activities (check-ins, training)
- Personal development (learning, skill-building)
- Admin/follow-up tasks

Make it REALISTIC and ACHIEVABLE. 10-15 minutes per day minimum.`;
}

/**
 * Objection Handler - MLM Specific
 */
export function getMLMObjectionPrompt(objection: string): string {
  return `Handle this common MLM objection with empathy and facts:

Objection: "${objection}"

Provide a response that:
1) Acknowledges the concern (show empathy)
2) Addresses the core issue with facts
3) Reframes it positively
4) Offers proof or testimonial concept
5) Ends with a soft CTA

Common objections:
- "Is this a pyramid scheme?"
- "I don't have money to start"
- "I don't have time"
- "I'm not a salesperson"
- "I don't want to bother my friends"

Keep it SHORT (max 100 words), HONEST, and RESPECTFUL.
Use Filipino/Taglish if appropriate.`;
}

// ========================================
// PROMPT BUILDER
// ========================================

export class MLMCoachingPromptBuilder {
  private plan: CompensationPlanData;

  constructor(plan: CompensationPlanData) {
    this.plan = plan;
  }

  /**
   * Build system prompt
   */
  getSystemPrompt(): string {
    return getUplineCoachSystemPrompt(this.plan);
  }

  /**
   * Build coaching prompt based on intent
   */
  buildPrompt(
    intent: 'rankUp' | 'downlineSupport' | 'incomeScenario' | 'teamBuilding' | 'weeklyPlan' | 'objection',
    context: CoachingContext,
    userMessage: string
  ): string {
    const fullContext = { ...context, compensationPlan: this.plan };

    switch (intent) {
      case 'rankUp':
        return getRankUpPrompt(fullContext, userMessage);

      case 'downlineSupport':
        return getDownlineSupportPrompt(fullContext, userMessage);

      case 'incomeScenario':
        return getIncomeScenarioPrompt(fullContext, userMessage);

      case 'teamBuilding':
        return getTeamBuildingPrompt(fullContext, userMessage);

      case 'weeklyPlan':
        return getWeeklyGamePlanPrompt(fullContext);

      case 'objection':
        return getMLMObjectionPrompt(userMessage);

      default:
        return getUplineCoachSystemPrompt(this.plan);
    }
  }
}

// ========================================
// EXAMPLE USAGE
// ========================================

export function createMLMCoachingPrompt(
  compensationPlan: CompensationPlanData,
  coachingType: 'rankUp' | 'downlineSupport' | 'incomeScenario' | 'teamBuilding' | 'weeklyPlan' | 'objection',
  context: Omit<CoachingContext, 'compensationPlan'>,
  userMessage: string
): { systemPrompt: string; userPrompt: string } {
  const builder = new MLMCoachingPromptBuilder(compensationPlan);

  return {
    systemPrompt: builder.getSystemPrompt(),
    userPrompt: builder.buildPrompt(coachingType, { ...context, compensationPlan }, userMessage)
  };
}
