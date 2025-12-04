import { supabase } from '../../lib/supabase';

export type Industry = 'mlm' | 'insurance' | 'real_estate' | 'direct_selling';

export interface ConversionPattern {
  id: string;
  industry?: string;
  persona?: string;
  sequenceSummary: string;
  steps: string[];
  successRate: number;
  avgTimeToCloseDays: number;
  bestDaysOfWeek: string[];
  bestTimesOfDay: string[];
}

export interface ConversionPatternResult {
  success: boolean;
  globalPatterns: ConversionPattern[];
  personaPatterns: Record<string, ConversionPattern[]>;
  industryPatterns: Record<string, ConversionPattern[]>;
  recommendations: string[];
}

const KNOWN_PERSONAS = ['ofw', 'young_professional', 'mompreneur', 'student', 'business_owner'];

const PH_MARKET_PATTERNS: ConversionPattern[] = [
  {
    id: 'taglish_messenger_quick',
    industry: 'mlm',
    persona: 'young_professional',
    sequenceSummary: 'Taglish Messenger sequence with quick follow-up',
    steps: [
      'Initial Taglish message highlighting sideline opportunity',
      'Prospect replies within 24hrs',
      'Send 3-slide visual pitch deck',
      'Follow-up within 48hrs with success stories',
      'Send booking link for virtual coffee',
      'Meeting scheduled within 3-5 days',
    ],
    successRate: 0.42,
    avgTimeToCloseDays: 7,
    bestDaysOfWeek: ['Sunday', 'Monday', 'Tuesday'],
    bestTimesOfDay: ['evening', 'late_night'],
  },
  {
    id: 'ofw_insurance_pain_point',
    industry: 'insurance',
    persona: 'ofw',
    sequenceSummary: 'OFW-focused pain point approach via Messenger',
    steps: [
      'Message acknowledging OFW challenges (hospital, emergency fund)',
      'Share relevant testimonial from another OFW',
      'Offer free financial planning session',
      'Prospect books call',
      'Discovery call with needs assessment',
      'Follow-up with personalized insurance proposal',
    ],
    successRate: 0.38,
    avgTimeToCloseDays: 14,
    bestDaysOfWeek: ['Saturday', 'Sunday'],
    bestTimesOfDay: ['evening', 'night'],
  },
  {
    id: 'mompreneur_community',
    industry: 'direct_selling',
    persona: 'mompreneur',
    sequenceSummary: 'Community-based approach for mompreneurs',
    steps: [
      'Invite to FB community/group',
      'Engage with content in group for 1 week',
      'Personal message after interaction',
      'Share success story of another mom',
      'Offer product trial or starter kit',
      'Follow-up call after trial period',
    ],
    successRate: 0.35,
    avgTimeToCloseDays: 21,
    bestDaysOfWeek: ['Wednesday', 'Thursday', 'Friday'],
    bestTimesOfDay: ['morning', 'afternoon'],
  },
  {
    id: 'professional_linkedin',
    industry: 'insurance',
    persona: 'business_owner',
    sequenceSummary: 'Professional LinkedIn approach for business owners',
    steps: [
      'LinkedIn connection with personalized note',
      'Wait 3-5 days for acceptance',
      'Share valuable business/finance article',
      'Engage with their posts',
      'Send InMail about business protection',
      'Schedule Zoom call for consultation',
    ],
    successRate: 0.48,
    avgTimeToCloseDays: 18,
    bestDaysOfWeek: ['Tuesday', 'Wednesday', 'Thursday'],
    bestTimesOfDay: ['morning', 'afternoon'],
  },
];

class ConversionPatternMapper {
  async analyzeConversionPatterns(input: {
    userId?: string;
    industry?: Industry;
    windowDays?: number;
  }): Promise<ConversionPatternResult> {
    const windowDays = input.windowDays || 180;

    try {
      const userPatterns = await this.loadUserSpecificPatterns(input.userId, windowDays);

      const globalPatterns = [...PH_MARKET_PATTERNS, ...userPatterns];

      const personaPatterns = this.groupByPersona(globalPatterns);
      const industryPatterns = this.groupByIndustry(globalPatterns);

      const recommendations = this.generateRecommendations(globalPatterns, input);

      return {
        success: true,
        globalPatterns,
        personaPatterns,
        industryPatterns,
        recommendations,
      };
    } catch (error) {
      console.error('Conversion pattern mapping error:', error);
      return {
        success: false,
        globalPatterns: PH_MARKET_PATTERNS,
        personaPatterns: this.groupByPersona(PH_MARKET_PATTERNS),
        industryPatterns: this.groupByIndustry(PH_MARKET_PATTERNS),
        recommendations: ['Using default PH market patterns'],
      };
    }
  }

  private async loadUserSpecificPatterns(userId?: string, windowDays?: number): Promise<ConversionPattern[]> {
    if (!userId) return [];

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (windowDays || 180));

      const { data: prospects } = await supabase
        .from('prospects')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .in('pipeline_stage', ['closed_won', 'customer']);

      if (!prospects || prospects.length === 0) {
        return [];
      }

      const patterns = this.extractPatternsFromProspects(prospects);

      return patterns;
    } catch (error) {
      console.error('Error loading user patterns:', error);
      return [];
    }
  }

  private extractPatternsFromProspects(prospects: any[]): ConversionPattern[] {
    const patterns: ConversionPattern[] = [];

    const personaGroups: Record<string, any[]> = {};

    prospects.forEach((prospect) => {
      const persona = this.inferPersona(prospect);
      if (!personaGroups[persona]) {
        personaGroups[persona] = [];
      }
      personaGroups[persona].push(prospect);
    });

    Object.entries(personaGroups).forEach(([persona, group]) => {
      if (group.length >= 3) {
        const avgDays = this.calculateAvgTimeToClose(group);
        const bestDays = this.identifyBestDays(group);

        patterns.push({
          id: `user_${persona}_pattern`,
          persona,
          sequenceSummary: `Custom ${persona} conversion pattern`,
          steps: [
            'Initial contact',
            'Follow-up engagement',
            'Value demonstration',
            'Proposal or offer',
            'Closing conversation',
          ],
          successRate: 1.0,
          avgTimeToCloseDays: avgDays,
          bestDaysOfWeek: bestDays,
          bestTimesOfDay: ['evening', 'night'],
        });
      }
    });

    return patterns;
  }

  private inferPersona(prospect: any): string {
    const notes = (prospect.notes || '').toLowerCase();
    const tags = prospect.tags || [];

    if (notes.includes('ofw') || tags.includes('ofw')) return 'ofw';
    if (notes.includes('mom') || notes.includes('mother')) return 'mompreneur';
    if (notes.includes('business owner')) return 'business_owner';
    if (notes.includes('student')) return 'student';

    return 'young_professional';
  }

  private calculateAvgTimeToClose(prospects: any[]): number {
    let totalDays = 0;

    prospects.forEach((prospect) => {
      const created = new Date(prospect.created_at);
      const updated = new Date(prospect.updated_at);
      const days = (updated.getTime() - created.getTime()) / (24 * 60 * 60 * 1000);
      totalDays += days;
    });

    return Math.round(totalDays / prospects.length);
  }

  private identifyBestDays(prospects: any[]): string[] {
    const dayCount: Record<string, number> = {};

    prospects.forEach((prospect) => {
      const day = new Date(prospect.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    return Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);
  }

  private groupByPersona(patterns: ConversionPattern[]): Record<string, ConversionPattern[]> {
    const grouped: Record<string, ConversionPattern[]> = {};

    patterns.forEach((pattern) => {
      const persona = pattern.persona || 'general';
      if (!grouped[persona]) {
        grouped[persona] = [];
      }
      grouped[persona].push(pattern);
    });

    return grouped;
  }

  private groupByIndustry(patterns: ConversionPattern[]): Record<string, ConversionPattern[]> {
    const grouped: Record<string, ConversionPattern[]> = {};

    patterns.forEach((pattern) => {
      const industry = pattern.industry || 'general';
      if (!grouped[industry]) {
        grouped[industry] = [];
      }
      grouped[industry].push(pattern);
    });

    return grouped;
  }

  private generateRecommendations(patterns: ConversionPattern[], input: any): string[] {
    const recommendations: string[] = [];

    const highSuccessPatterns = patterns.filter((p) => p.successRate >= 0.4);
    if (highSuccessPatterns.length > 0) {
      const topPattern = highSuccessPatterns.sort((a, b) => b.successRate - a.successRate)[0];
      recommendations.push(
        `Top performing approach: ${topPattern.sequenceSummary} (${Math.round(topPattern.successRate * 100)}% success rate)`
      );
    }

    const taglishPattern = patterns.find((p) => p.id.includes('taglish'));
    if (taglishPattern) {
      recommendations.push(
        'Taglish messaging on Messenger shows strong results in PH market - consider this for warm prospects'
      );
    }

    const quickPatterns = patterns.filter((p) => p.avgTimeToCloseDays <= 10);
    if (quickPatterns.length > 0) {
      recommendations.push(
        `${quickPatterns.length} patterns show quick conversions (≤10 days) - ideal for hot leads`
      );
    }

    const bestDays = this.getMostCommonDays(patterns);
    if (bestDays.length > 0) {
      recommendations.push(`Best days for outreach: ${bestDays.slice(0, 3).join(', ')}`);
    }

    if (input.industry) {
      const industrySpecific = patterns.filter((p) => p.industry === input.industry);
      if (industrySpecific.length > 0) {
        recommendations.push(
          `${industrySpecific.length} patterns available specifically for ${input.industry} industry`
        );
      }
    }

    recommendations.push('Personalize approaches based on persona and pain points for best results');

    return recommendations;
  }

  private getMostCommonDays(patterns: ConversionPattern[]): string[] {
    const dayCount: Record<string, number> = {};

    patterns.forEach((pattern) => {
      pattern.bestDaysOfWeek.forEach((day) => {
        dayCount[day] = (dayCount[day] || 0) + 1;
      });
    });

    return Object.entries(dayCount)
      .sort((a, b) => b[1] - a[1])
      .map(([day]) => day);
  }

  async getPatternForPersona(persona: string, industry?: Industry): Promise<ConversionPattern | null> {
    const result = await this.analyzeConversionPatterns({ industry });

    const personaPatterns = result.personaPatterns[persona] || [];

    if (personaPatterns.length === 0) return null;

    return personaPatterns.sort((a, b) => b.successRate - a.successRate)[0];
  }

  async getBestSequenceForProspect(
    prospectData: any,
    industry?: Industry
  ): Promise<ConversionPattern | null> {
    const persona = this.inferPersona(prospectData);
    return this.getPatternForPersona(persona, industry);
  }
}

export const conversionPatternMapper = new ConversionPatternMapper();
