export interface PainPoint {
  category: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  keywords: string[];
}

export interface PainPointAnalysis {
  pain_points: PainPoint[];
  urgency_score: number;
  total_pain_signals: number;
  opportunity_score: number;
}

export class PainPointAnalyzer {
  private static readonly PAIN_CATEGORIES = {
    'time_management': {
      keywords: ['no time', 'too busy', 'overwhelmed', 'behind schedule', 'deadline', 'time-consuming', 'slow process', 'taking forever'],
      severity: 'high' as const,
    },
    'cost_efficiency': {
      keywords: ['expensive', 'costly', 'budget', 'afford', 'pricing', 'too much money', 'waste', 'roi'],
      severity: 'high' as const,
    },
    'productivity': {
      keywords: ['inefficient', 'manual', 'tedious', 'repetitive', 'bottleneck', 'slow down', 'productivity'],
      severity: 'medium' as const,
    },
    'technology': {
      keywords: ['outdated', 'legacy', 'technical issue', 'bug', 'broken', 'not working', 'integration', 'compatibility'],
      severity: 'medium' as const,
    },
    'growth': {
      keywords: ['stagnant', 'not growing', 'plateau', 'scale', 'expansion', 'limited', 'capacity'],
      severity: 'high' as const,
    },
    'customer_acquisition': {
      keywords: ['lead generation', 'finding customers', 'no sales', 'conversion', 'traffic', 'visibility', 'reach'],
      severity: 'high' as const,
    },
    'team_collaboration': {
      keywords: ['miscommunication', 'silos', 'coordination', 'remote work', 'alignment', 'team issues'],
      severity: 'medium' as const,
    },
    'data_management': {
      keywords: ['data loss', 'organization', 'tracking', 'reporting', 'analytics', 'insights', 'metrics'],
      severity: 'medium' as const,
    },
    'customer_retention': {
      keywords: ['churn', 'losing customers', 'retention', 'satisfaction', 'complaints', 'support'],
      severity: 'high' as const,
    },
    'competition': {
      keywords: ['competitor', 'losing market share', 'differentiation', 'competitive advantage', 'falling behind'],
      severity: 'high' as const,
    },
  };

  private static readonly URGENCY_INDICATORS = [
    'urgent', 'asap', 'immediately', 'critical', 'emergency', 'now',
    'must', 'need to', 'have to', 'deadline', 'running out',
  ];

  private static readonly FRUSTRATION_INDICATORS = [
    'frustrated', 'annoying', 'terrible', 'awful', 'hate', 'sick of',
    'tired of', 'disappointed', 'struggling', 'difficult', 'hard',
  ];

  static analyzePainPoints(text: string): PainPointAnalysis {
    const lowerText = text.toLowerCase();
    const pain_points: PainPoint[] = [];

    for (const [category, config] of Object.entries(this.PAIN_CATEGORIES)) {
      const foundKeywords = config.keywords.filter(keyword =>
        lowerText.includes(keyword)
      );

      if (foundKeywords.length > 0) {
        const severity = foundKeywords.length >= 3 ? 'high' :
                        foundKeywords.length >= 2 ? 'medium' : 'low';

        pain_points.push({
          category: this.formatCategoryName(category),
          severity,
          description: this.generateDescription(category, foundKeywords),
          keywords: foundKeywords,
        });
      }
    }

    const urgency_score = this.calculateUrgencyScore(lowerText);
    const total_pain_signals = pain_points.reduce((sum, p) => sum + p.keywords.length, 0);
    const opportunity_score = this.calculateOpportunityScore(pain_points, urgency_score);

    return {
      pain_points: pain_points.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      urgency_score,
      total_pain_signals,
      opportunity_score,
    };
  }

  private static formatCategoryName(category: string): string {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private static generateDescription(category: string, keywords: string[]): string {
    const descriptions: Record<string, string> = {
      time_management: 'Struggling with time management and meeting deadlines',
      cost_efficiency: 'Looking for more cost-effective solutions',
      productivity: 'Seeking ways to improve efficiency and productivity',
      technology: 'Experiencing technical challenges or outdated systems',
      growth: 'Facing growth and scaling challenges',
      customer_acquisition: 'Need help with lead generation and customer acquisition',
      team_collaboration: 'Dealing with team coordination and communication issues',
      data_management: 'Struggling with data organization and insights',
      customer_retention: 'Concerned about customer satisfaction and retention',
      competition: 'Facing competitive pressure in the market',
    };

    return descriptions[category] || `Issues related to ${this.formatCategoryName(category)}`;
  }

  private static calculateUrgencyScore(text: string): number {
    let score = 0;

    this.URGENCY_INDICATORS.forEach(indicator => {
      if (text.includes(indicator)) score += 10;
    });

    this.FRUSTRATION_INDICATORS.forEach(indicator => {
      if (text.includes(indicator)) score += 5;
    });

    return Math.min(score, 100);
  }

  private static calculateOpportunityScore(pain_points: PainPoint[], urgency_score: number): number {
    let score = 0;

    const highSeverityCount = pain_points.filter(p => p.severity === 'high').length;
    const mediumSeverityCount = pain_points.filter(p => p.severity === 'medium').length;

    score += highSeverityCount * 20;
    score += mediumSeverityCount * 10;

    score += urgency_score * 0.3;

    score += pain_points.length * 5;

    return Math.min(Math.round(score), 100);
  }

  static identifyBuyingReadiness(analysis: PainPointAnalysis): {
    readiness_level: 'hot' | 'warm' | 'cold';
    reasons: string[];
  } {
    const reasons: string[] = [];
    let readiness_level: 'hot' | 'warm' | 'cold' = 'cold';

    if (analysis.urgency_score >= 50) {
      reasons.push('High urgency signals detected');
      readiness_level = 'hot';
    }

    if (analysis.pain_points.filter(p => p.severity === 'high').length >= 2) {
      reasons.push('Multiple high-severity pain points');
      if (readiness_level === 'cold') readiness_level = 'warm';
    }

    if (analysis.opportunity_score >= 70) {
      reasons.push('Strong opportunity score');
      readiness_level = 'hot';
    } else if (analysis.opportunity_score >= 40) {
      reasons.push('Moderate opportunity detected');
      if (readiness_level === 'cold') readiness_level = 'warm';
    }

    if (analysis.total_pain_signals >= 5) {
      reasons.push('Multiple pain signals across content');
      if (readiness_level === 'cold') readiness_level = 'warm';
    }

    if (reasons.length === 0) {
      reasons.push('Limited pain signals detected');
    }

    return { readiness_level, reasons };
  }

  static generateOutreachStrategy(analysis: PainPointAnalysis): {
    approach: string;
    talking_points: string[];
    timing: string;
  } {
    const buyingReadiness = this.identifyBuyingReadiness(analysis);

    let approach = '';
    let timing = '';

    switch (buyingReadiness.readiness_level) {
      case 'hot':
        approach = 'Direct solution-focused outreach';
        timing = 'Reach out immediately';
        break;
      case 'warm':
        approach = 'Educational content with soft pitch';
        timing = 'Reach out within 24-48 hours';
        break;
      case 'cold':
        approach = 'Value-first relationship building';
        timing = 'Nurture with content over 1-2 weeks';
        break;
    }

    const talking_points = analysis.pain_points
      .slice(0, 3)
      .map(p => `Address ${p.category.toLowerCase()}: ${p.description}`);

    return {
      approach,
      talking_points,
      timing,
    };
  }
}
