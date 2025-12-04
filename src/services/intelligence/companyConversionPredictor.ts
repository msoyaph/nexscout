import { supabase } from '../../lib/supabase';
import { getCompanyBrain } from './companyBrainEngine';
import { getContentPerformance } from './aiEventLogger';

export interface ConversionPrediction {
  score: number;
  replyRate: number;
  meetingRate: number;
  confidence: number;
  redFlags: string[];
  suggestions: string[];
}

export async function predictConversion(
  userId: string,
  contentType: string,
  content: string,
  prospectContext?: any,
  companyId?: string
): Promise<ConversionPrediction> {
  try {
    const brain = await getCompanyBrain(userId, companyId);
    const historicalPerf = await getContentPerformance(userId, contentType);

    let score = 0.5;
    let replyRate = historicalPerf.replyRate || 20;
    let meetingRate = historicalPerf.openRate || 5;
    const redFlags: string[] = [];
    const suggestions: string[] = [];

    if (brain.winningPatterns.some((p) => content.toLowerCase().includes(p))) {
      score += 0.2;
      replyRate += 10;
    }

    if (brain.failingPatterns.some((p) => content.toLowerCase().includes(p))) {
      score -= 0.2;
      replyRate -= 10;
      redFlags.push(`Contains underperforming pattern: ${brain.failingPatterns[0]}`);
    }

    const wordCount = content.split(/\s+/).length;
    if (brain.contentStrategies.preferredLength === 'short' && wordCount > 100) {
      score -= 0.1;
      suggestions.push('Consider shortening the message. Your audience responds better to concise content.');
    }

    if (wordCount < 20) {
      score -= 0.15;
      redFlags.push('Message is too short and may lack context');
      suggestions.push('Add more context or value proposition.');
    }

    if (prospectContext?.painPoint) {
      const hasPainPointMatch = brain.personaProfile.painPoints?.some((p: string) =>
        content.toLowerCase().includes(p.toLowerCase())
      );
      if (hasPainPointMatch) {
        score += 0.15;
        replyRate += 8;
      } else {
        suggestions.push(`Address prospect's pain point: ${prospectContext.painPoint}`);
      }
    }

    if (!hasCallToAction(content)) {
      score -= 0.1;
      suggestions.push('Add a clear call-to-action.');
    }

    const spamScore = calculateSpamScore(content);
    if (spamScore > 0.3) {
      score -= spamScore;
      redFlags.push('Content may trigger spam filters');
      suggestions.push('Reduce excessive punctuation and caps');
    }

    score = Math.max(0, Math.min(1, score));
    replyRate = Math.max(0, Math.min(100, replyRate));
    meetingRate = Math.max(0, Math.min(50, meetingRate));

    const prediction: ConversionPrediction = {
      score: Math.round(score * 100) / 100,
      replyRate: Math.round(replyRate * 10) / 10,
      meetingRate: Math.round(meetingRate * 10) / 10,
      confidence: 0.75,
      redFlags,
      suggestions,
    };

    await savePrediction(userId, companyId, contentType, content, prediction);

    return prediction;
  } catch (error) {
    console.error('Predict conversion error:', error);
    return {
      score: 0.5,
      replyRate: 20,
      meetingRate: 5,
      confidence: 0,
      redFlags: ['Prediction unavailable'],
      suggestions: [],
    };
  }
}

function hasCallToAction(content: string): boolean {
  const ctaPatterns = [
    /book a call/i,
    /schedule a meeting/i,
    /let's chat/i,
    /reply/i,
    /get started/i,
    /learn more/i,
    /interested/i,
  ];
  return ctaPatterns.some((pattern) => pattern.test(content));
}

function calculateSpamScore(content: string): number {
  let score = 0;

  const exclamationCount = (content.match(/!/g) || []).length;
  if (exclamationCount > 3) score += 0.1;

  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.3) score += 0.2;

  const spamWords = ['free money', 'act now', 'limited time', 'guaranteed', 'no risk'];
  const hasSpamWords = spamWords.some((word) => content.toLowerCase().includes(word));
  if (hasSpamWords) score += 0.2;

  return Math.min(score, 1);
}

async function savePrediction(
  userId: string,
  companyId: string | undefined,
  contentType: string,
  content: string,
  prediction: ConversionPrediction
): Promise<void> {
  try {
    await supabase.from('company_conversion_predictions').insert({
      user_id: userId,
      company_id: companyId || null,
      content_type: contentType,
      content_preview: content.substring(0, 200),
      predicted_score: prediction.score,
      predicted_reply_rate: prediction.replyRate,
      predicted_meeting_rate: prediction.meetingRate,
      red_flags: prediction.redFlags,
      suggestions: prediction.suggestions,
    });
  } catch (error) {
    console.error('Save prediction error:', error);
  }
}

export async function getPredictionHistory(
  userId: string,
  companyId?: string,
  limit: number = 20
): Promise<any[]> {
  try {
    let query = supabase
      .from('company_conversion_predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get prediction history error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get prediction history error:', error);
    return [];
  }
}
