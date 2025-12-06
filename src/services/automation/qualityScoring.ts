/**
 * AI Quality Scoring Service
 * 
 * Analyzes AI-generated content and assigns quality scores
 * Used in Preview Before Send to show users output quality
 */

interface QualityAnalysis {
  score: number; // 0-100
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  tags: string[];
}

export class QualityScoringService {
  /**
   * Analyze AI-generated message quality
   */
  static analyzeMessage(message: string, prospect: any): QualityAnalysis {
    let score = 0;
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];
    const tags: string[] = [];

    // Check 1: Length (15 points)
    const wordCount = message.split(/\s+/).length;
    if (wordCount >= 50 && wordCount <= 200) {
      score += 15;
      strengths.push('Optimal length');
      tags.push('Well-structured');
    } else if (wordCount < 50) {
      score += 5;
      weaknesses.push('Too short');
      suggestions.push('Add more context or value');
    } else {
      score += 10;
      weaknesses.push('Too long');
      suggestions.push('Be more concise');
    }

    // Check 2: Personalization (20 points)
    if (prospect?.name && message.includes(prospect.name)) {
      score += 10;
      strengths.push('Uses prospect name');
      tags.push('Personalized');
    }
    
    const personalizedWords = ['you', 'your', 'you\'re'];
    const personalizedCount = personalizedWords.filter(word => 
      message.toLowerCase().includes(word)
    ).length;
    
    if (personalizedCount >= 3) {
      score += 10;
      strengths.push('Highly personalized');
    } else {
      score += personalizedCount * 3;
      if (personalizedCount === 0) {
        weaknesses.push('Not personalized');
        suggestions.push('Use "you" and "your" more');
      }
    }

    // Check 3: Filipino Touch (15 points)
    const filipinoWords = ['kamusta', 'po', 'salamat', 'kasi', 'kaya', 'para', 'gusto'];
    const hasFilipino = filipinoWords.some(word => 
      message.toLowerCase().includes(word)
    );
    
    if (hasFilipino) {
      score += 15;
      strengths.push('Filipino-friendly tone');
      tags.push('Taglish');
    } else {
      score += 5;
      tags.push('English');
    }

    // Check 4: Call-to-Action (15 points)
    const ctaPatterns = [
      /interested\?/i,
      /want to/i,
      /let me know/i,
      /book a call/i,
      /schedule/i,
      /reply/i,
      /game ka ba/i,
      /ready ba/i
    ];
    
    const hasCTA = ctaPatterns.some(pattern => pattern.test(message));
    if (hasCTA) {
      score += 15;
      strengths.push('Clear call-to-action');
      tags.push('Action-oriented');
    } else {
      weaknesses.push('No clear CTA');
      suggestions.push('Add a question or next step');
    }

    // Check 5: Professional Tone (10 points)
    const hasExcessive = /!!!|!!!!/i.test(message);
    const hasAllCaps = /[A-Z]{10,}/.test(message);
    const hasProfanity = /fuck|shit|damn/i.test(message);
    
    if (!hasExcessive && !hasAllCaps && !hasProfanity) {
      score += 10;
      strengths.push('Professional tone');
      tags.push('Professional');
    } else {
      if (hasExcessive) weaknesses.push('Too many exclamations');
      if (hasAllCaps) weaknesses.push('Excessive caps');
      if (hasProfanity) weaknesses.push('Unprofessional language');
    }

    // Check 6: Emojis (10 points)
    const emojiCount = (message.match(/[\p{Emoji}]/gu) || []).length;
    if (emojiCount >= 1 && emojiCount <= 4) {
      score += 10;
      strengths.push('Good emoji usage');
      tags.push('Friendly');
    } else if (emojiCount === 0) {
      score += 5;
      suggestions.push('Add 1-2 emojis for warmth');
    } else {
      score += 3;
      weaknesses.push('Too many emojis');
    }

    // Check 7: Grammar & Spelling (10 points)
    // Simple check - no obvious errors
    const hasBasicErrors = /\s{2,}|\.{2,}|,,/.test(message);
    if (!hasBasicErrors) {
      score += 10;
      tags.push('No errors');
    } else {
      score += 5;
      weaknesses.push('Formatting issues');
    }

    // Check 8: Value Proposition (5 points)
    const valueWords = ['save', 'earn', 'benefit', 'help', 'improve', 'grow', 'success'];
    const hasValue = valueWords.some(word => message.toLowerCase().includes(word));
    if (hasValue) {
      score += 5;
      strengths.push('Includes value prop');
    }

    // Determine rating
    let rating: QualityAnalysis['rating'];
    if (score >= 90) rating = 'excellent';
    else if (score >= 75) rating = 'good';
    else if (score >= 60) rating = 'fair';
    else rating = 'poor';

    // Add auto-suggestions for improvement
    if (score < 90 && suggestions.length === 0) {
      suggestions.push('Content is good but could be optimized further');
    }

    return {
      score: Math.min(100, score),
      rating,
      strengths,
      weaknesses,
      suggestions,
      tags,
    };
  }

  /**
   * Analyze Smart Scan analysis quality
   */
  static analyzeAnalysis(analysis: any): QualityAnalysis {
    let score = 0;
    const strengths: string[] = [];
    const tags: string[] = [];

    // Check completeness
    if (analysis.painPoints && analysis.painPoints.length > 0) {
      score += 30;
      strengths.push(`${analysis.painPoints.length} pain points identified`);
    }

    if (analysis.buyingSignals && analysis.buyingSignals.length > 0) {
      score += 30;
      strengths.push(`${analysis.buyingSignals.length} buying signals detected`);
    }

    if (analysis.scoutScore && analysis.scoutScore > 0) {
      score += 20;
      strengths.push('ScoutScore calculated');
    }

    if (analysis.recommendations && analysis.recommendations.length > 0) {
      score += 20;
      strengths.push('Next steps recommended');
    }

    tags.push('Complete analysis');

    return {
      score: Math.min(100, score),
      rating: score >= 90 ? 'excellent' : score >= 70 ? 'good' : 'fair',
      strengths,
      weaknesses: [],
      suggestions: [],
      tags,
    };
  }

  /**
   * Get quality display color
   */
  static getQualityColor(score: number): string {
    if (score >= 90) return 'green';
    if (score >= 75) return 'blue';
    if (score >= 60) return 'yellow';
    return 'red';
  }

  /**
   * Get star rating from score
   */
  static getStarRating(score: number): string {
    if (score >= 90) return '⭐⭐⭐⭐⭐';
    if (score >= 80) return '⭐⭐⭐⭐';
    if (score >= 70) return '⭐⭐⭐';
    if (score >= 60) return '⭐⭐';
    return '⭐';
  }
}




