import { supabase } from '../../lib/supabase';

interface WeakStep {
  step_id: string;
  sequence_key: string;
  day_number: number;
  scenario_id: string;
  dropoff_rate: number;
  severity: string;
  triggered_count: number;
  completed_count: number;
}

interface AnalyticsData {
  steps: any[];
  ab: any[];
  funnel: any[];
  msgPerf: any[];
  weakSteps?: WeakStep[];
  sequenceHealth?: any[];
}

export const onboardingFunnelOptimizationEngine = {
  async loadAnalytics(): Promise<AnalyticsData> {
    const [steps, ab, funnel, msgs, weakSteps, health] = await Promise.all([
      supabase.from('onboarding_step_completion').select('*'),
      supabase.from('onboarding_ab_test_performance').select('*'),
      supabase.from('first_win_funnel').select('*'),
      supabase.from('messaging_performance_view').select('*'),
      supabase.rpc('get_weak_onboarding_steps', { p_limit: 10 }),
      supabase.from('sequence_health_score').select('*')
    ]);

    return {
      steps: steps.data ?? [],
      ab: ab.data ?? [],
      funnel: funnel.data ?? [],
      msgPerf: msgs.data ?? [],
      weakSteps: weakSteps.data ?? [],
      sequenceHealth: health.data ?? []
    };
  },

  detectWeakSteps(steps: any[]): WeakStep[] {
    return steps
      .map(s => {
        const dropoff = s.users_targeted > 0
          ? 1 - s.users_reached / s.users_targeted
          : 0;

        return {
          step_id: s.step_id,
          sequence_key: s.sequence_key,
          day_number: s.day_number,
          scenario_id: s.scenario_id,
          dropoff_rate: dropoff,
          severity:
            dropoff > 0.75
              ? 'critical'
              : dropoff > 0.5
              ? 'high'
              : dropoff > 0.3
              ? 'medium'
              : 'low',
          triggered_count: s.users_targeted || 0,
          completed_count: s.users_reached || 0
        };
      })
      .sort((a, b) => b.dropoff_rate - a.dropoff_rate);
  },

  async generateAISuggestions(analytics: AnalyticsData): Promise<string> {
    const weak = analytics.weakSteps || this.detectWeakSteps(analytics.steps).slice(0, 5);

    const systemPrompt = `You are NexScout's Product-Led Growth Onboarding Consultant and AI optimization expert.

Your role:
1. Analyze onboarding funnel data to identify dropoff points
2. Provide actionable recommendations in Taglish (Filipino + English)
3. Suggest improved messaging that's warm, reassuring, and action-oriented
4. Recommend sequence restructuring for faster first wins
5. Consider Filipino market context and MLM/insurance/real estate personas

Response format:
- Use bullet points and clear sections
- Be specific with numbers and percentages
- Provide 2-3 concrete action items per issue
- Use Taglish for emotional resonance
- Keep recommendations practical and implementable`;

    const userPrompt = `Analyze this onboarding funnel data and provide optimization recommendations:

# Top 5 Dropoff Points:
${JSON.stringify(weak, null, 2)}

# Sequence Health:
${JSON.stringify(analytics.sequenceHealth?.slice(0, 3), null, 2)}

# A/B Test Performance:
${JSON.stringify(analytics.ab, null, 2)}

Please provide:
1. **Biggest Issues** - What are the top 3 critical problems?
2. **Root Causes** - Why are users dropping off at these points?
3. **Quick Wins** - 3 changes we can implement today
4. **Message Rewrites** - Improved copy for the worst-performing steps
5. **Sequence Optimization** - Structural changes to accelerate first win
6. **Persona Variations** - Different approaches for MLM vs Insurance vs Real Estate
7. **Gamification Ideas** - Nudges to increase engagement

Focus on:
- Emotional reassurance (Taglish)
- Reducing friction
- Faster time-to-value
- Clear next steps
- Building confidence`;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: 'gpt-4o',
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        throw new Error('AI generation failed');
      }

      const data = await response.json();
      return data.content || 'No insights generated';
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return this.generateFallbackSuggestions(weak);
    }
  },

  generateFallbackSuggestions(weakSteps: WeakStep[]): string {
    let suggestions = '# 🎯 Onboarding Optimization Recommendations\n\n';

    suggestions += '## 📊 Top Dropoff Points\n\n';
    weakSteps.slice(0, 5).forEach((step, index) => {
      suggestions += `${index + 1}. **Day ${step.day_number}: ${step.scenario_id}**\n`;
      suggestions += `   - Dropoff Rate: ${(step.dropoff_rate * 100).toFixed(1)}%\n`;
      suggestions += `   - Severity: ${step.severity}\n`;
      suggestions += `   - Users Lost: ${step.triggered_count - step.completed_count}\n\n`;
    });

    suggestions += '## 🔥 Quick Wins\n\n';
    suggestions += '1. **Simplify Day 0-1 Tasks**\n';
    suggestions += '   - Reduce setup steps from 5 to 3\n';
    suggestions += '   - Auto-fill data where possible\n\n';

    suggestions += '2. **Add Emotional Reassurance**\n';
    suggestions += '   - Use Taglish copy: "Kaya mo \'to! I\'ll guide you step-by-step."\n';
    suggestions += '   - Show progress indicators\n\n';

    suggestions += '3. **Faster Time to First Win**\n';
    suggestions += '   - Move first scan to Day 1 instead of Day 3\n';
    suggestions += '   - Pre-populate with sample prospects\n\n';

    suggestions += '## 💬 Message Improvements\n\n';
    weakSteps.slice(0, 3).forEach(step => {
      suggestions += `**${step.scenario_id}:**\n`;
      suggestions += `Before: Generic message\n`;
      suggestions += `After: "Hi! Mabilis lang \'to — 2 minutes para sa first prospect mo. Ready? 💪"\n\n`;
    });

    return suggestions;
  },

  async draftNewSequence(analytics: AnalyticsData): Promise<string> {
    const systemPrompt = `You are a Product-Led Growth sequence designer specializing in Filipino market onboarding.

Create an optimized "onboarding_v3_dynamic" sequence that:
1. Gets users to first win in 72 hours
2. Uses behavioral triggers, not just time delays
3. Includes persona-specific variations
4. Uses Taglish for warmth and clarity
5. Has clear aha moments and reinforcement loops

Output valid JSON following the onboarding sequence schema.`;

    const userPrompt = `Based on this analytics data, create an improved v3 sequence:

${JSON.stringify(analytics.steps.slice(0, 10), null, 2)}

Requirements:
- 7 days maximum
- 3-4 scenarios per day
- Mix of email, push, and mentor messages
- Event-based triggers (not just time-based)
- Personas: MLM, Insurance, Real Estate, Online Seller
- Target: First sale or appointment within 72 hours
- PLG pattern: aha → action → reinforcement

Return complete JSON in this format:
{
  "sequence_id": "onboarding_v3_dynamic",
  "version": "1.0",
  "name": "Dynamic First Win v3",
  "ab_group": null,
  "days": [...]
}`;

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ai-content`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          prompt: userPrompt,
          system_prompt: systemPrompt,
          model: 'gpt-4o-mini',
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('AI generation failed');
      }

      const data = await response.json();
      return data.content || '{}';
    } catch (error) {
      console.error('Error drafting new sequence:', error);
      return this.generateFallbackSequence();
    }
  },

  generateFallbackSequence(): string {
    return JSON.stringify(
      {
        sequence_id: 'onboarding_v3_dynamic',
        version: '1.0',
        name: 'Dynamic First Win v3',
        description: 'AI-optimized sequence for 72-hour first win',
        ab_group: null,
        days: [
          {
            day: 0,
            scenarios: [
              {
                id: 'instant_welcome',
                trigger: 'signup_completed',
                messages: {
                  mentor: {
                    text: 'Welcome {{firstName}}! Target natin: 1 real result in 72 hours. Kaya mo \'to! 💪'
                  }
                }
              }
            ]
          }
        ]
      },
      null,
      2
    );
  },

  async getOptimizationReport(): Promise<{
    weakSteps: WeakStep[];
    criticalIssues: number;
    avgDropoffRate: number;
    recommendations: string[];
  }> {
    const analytics = await this.loadAnalytics();
    const weak = analytics.weakSteps || [];

    const criticalSteps = weak.filter(s => s.severity === 'critical');
    const avgDropoff =
      weak.reduce((sum, s) => sum + s.dropoff_rate, 0) / (weak.length || 1);

    const recommendations = [
      criticalSteps.length > 0 &&
        `Fix ${criticalSteps.length} critical dropoff points immediately`,
      avgDropoff > 0.5 && 'Overall funnel needs restructuring',
      weak.length > 5 && 'Consider consolidating or removing low-value steps'
    ].filter(Boolean) as string[];

    return {
      weakSteps: weak,
      criticalIssues: criticalSteps.length,
      avgDropoffRate: avgDropoff,
      recommendations
    };
  }
};
