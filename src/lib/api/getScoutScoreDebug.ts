/**
 * Client-side function to generate ScoutScore debug data
 * Uses existing ScoutScore engines to compute v1-v8 breakdown
 */
import { supabase } from '../supabase';
import type { ScoutScoreDebug, ScoutIndustry } from '../types/scoutScoreDebug';
import { scoutScoreUnifiedEngine } from '../../engines/scoring/scoutScoreUnified';
import { scoutScoringV2 } from '../../services/scoutScoringV2';
import { scoutScoringV3Engine } from '../../services/scoutScoringV3';
import { scoutScoreV4Engine } from '../../services/intelligence/scoutScoreV4';
import { scoutScoreV5Engine } from '../../services/intelligence/scoutScoreV5';
import { scoutScoringV6Engine } from '../../services/scoutScoringV6';
import { scoutScoringV7Engine } from '../../services/scoutScoringV7';
import { scoutScoringV8Engine } from '../../services/scoutScoringV8';
import type { BaseScoutScore } from '../../types/scoutScore';

interface ProspectData {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  metadata?: any;
  bio_text?: string;
}

export async function getScoutScoreDebug(
  leadId: string
): Promise<ScoutScoreDebug> {
  // Try Edge Function first
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      // Get Supabase URL from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!supabaseUrl) {
        throw new Error('VITE_SUPABASE_URL not configured');
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/scoutscore-debug?leadId=${encodeURIComponent(leadId)}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Transform Edge Function response to match ScoutScoreDebug interface
        return transformEdgeFunctionResponse(data);
      }
      // If Edge Function fails, fall through to client-side computation
    }
  } catch (edgeError) {
    console.warn('[getScoutScoreDebug] Edge Function failed, using client-side computation:', edgeError);
  }

  // Fallback: Client-side computation
  try {
    // Fetch prospect data
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', leadId)
      .maybeSingle();

    if (prospectError || !prospect) {
      throw new Error(`Prospect not found: ${leadId}`);
    }

    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get user's industry from company_intelligence or default to 'mlm'
    let industry: ScoutIndustry = 'mlm';
    try {
      const { data: companyIntel } = await supabase
        .from('company_intelligence')
        .select('industry')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (companyIntel?.industry) {
        industry = companyIntel.industry as ScoutIndustry;
      }
    } catch (e) {
      console.warn('[getScoutScoreDebug] Could not fetch industry, using default');
    }

    // Fetch chat session data for context
    let chatMessages: string[] = [];
    let lastCTAType: string | null = null;
    try {
      const { data: sessions } = await supabase
        .from('public_chat_sessions')
        .select('id, visitor_name, visitor_email, visitor_phone')
        .or(`visitor_name.eq.${prospect.full_name || ''},visitor_email.eq.${prospect.email || ''},visitor_phone.eq.${prospect.phone || ''}`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('content, role, metadata')
          .eq('session_id', sessions[0].id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (messages) {
          chatMessages = messages
            .filter(m => m.role === 'user')
            .map(m => m.content || '')
            .reverse();
          
          // Try to extract last CTA from metadata
          const lastUserMessage = messages.find(m => m.role === 'user');
          if (lastUserMessage?.metadata?.cta_type) {
            lastCTAType = lastUserMessage.metadata.cta_type;
          }
        }
      }
    } catch (e) {
      console.warn('[getScoutScoreDebug] Could not fetch chat messages:', e);
    }

    // Prepare input data
    const textContent = [
      prospect.bio_text || '',
      ...(prospect.metadata?.pain_points || []),
      ...(prospect.metadata?.tags || []),
      ...chatMessages
    ].join(' ').trim() || 'No content available';

    // Calculate scores for each version using unified engine with overlays
    const input = {
      prospectId: leadId,
      userId,
      textContent,
      industry: industry as any,
    };

    // Run unified engine with all overlays enabled
    // Note: We'll calculate each version separately to get individual breakdowns
    const finalResult = await scoutScoreUnifiedEngine.computeScoutScoreFinal(
      {
        prospectId: leadId,
        userId,
        textContent,
        industry: industry as any,
      },
      {
        baseVersion: 'v5', // Use v5 as base
        enableV6: true,
        enableV7: true,
        enableV8: true,
        industry: industry as any,
        activeIndustry: industry as any,
        debug: true,
      }
    );

    // Extract individual version scores from final result
    const base = finalResult.base;

    // V1 - Basic reply scoring (calculate via unified engine with v1 mode)
    const v1Input = {
      prospectId: leadId,
      userId,
      textContent,
      config: { mode: 'v1_simple' as const },
    };
    const v1Result = await scoutScoreUnifiedEngine.calculateScoutScore(v1Input);

    // V2 - Objection sensitivity
    let v2Score = 50;
    let v2Objections: string[] = [];
    let v2Sensitivity = 'low';
    try {
      const v2Result = await scoutScoringV2.calculateScoutScore(leadId, userId, textContent);
      v2Score = v2Result.score;
      v2Objections = v2Result.objectionSignals ? [
        ...(v2Result.objectionSignals.hasBudgetObjection ? ['budget'] : []),
        ...(v2Result.objectionSignals.hasTimingObjection ? ['timing'] : []),
        ...(v2Result.objectionSignals.hasSpouseObjection ? ['spouse'] : []),
      ] : [];
      v2Sensitivity = v2Score < 40 ? 'high' : v2Score < 60 ? 'medium' : 'low';
    } catch (e) {
      console.warn('[getScoutScoreDebug] V2 calculation failed:', e);
    }

    // V3 - CTA/Click signals
    let v3Score = 50;
    let v3Interactions: string[] = [];
    let v3ClickHeat = 0;
    try {
      const v3Result = await scoutScoringV3Engine.calculateCTAHeatScore({
        prospectId: leadId,
        userId,
      });
      v3Score = v3Result.conversionHeatScore;
      v3Interactions = v3Result.insights?.slice(0, 5) || [];
      v3ClickHeat = v3Result.conversionHeatScore;
    } catch (e) {
      console.warn('[getScoutScoreDebug] V3 calculation failed:', e);
    }

    // V4 - Lead maturity (from base if available, or calculate separately)
    let v4Score = base.score;
    let v4TimelineStrength = 50;
    let v4Momentum: "warming" | "cooling" | "stable" | "volatile" = "stable";
    let v4DaysSilent = 0;
    try {
      const v4Result = await scoutScoreV4Engine.calculateScoutScoreV4({
        prospectId: leadId,
        userId,
        textContent,
      });
      v4Score = v4Result.score;
      v4TimelineStrength = v4Result.timelineStrength || 50;
      v4Momentum = v4Result.momentum || "stable";
      v4DaysSilent = v4Result.lastInteractionDaysAgo || 0;
    } catch (e) {
      console.warn('[getScoutScoreDebug] V4 calculation failed:', e);
    }

    // V5 - Industry logic (from base)
    const v5Score = base.score;
    const v5IndustryMatch = industry || 'Unknown';
    const v5WeightProfile = `${industry}_default`;

    // V6 - Persona fit (from overlay)
    const v6Score = finalResult.v6?.personaFitScore || 50;
    const v6PersonaFit = finalResult.v6?.personaProfile || 'generic';
    const v6MismatchReasons = finalResult.v6?.personaNotes?.filter(n => n.includes('mismatch') || n.includes('low')) || [];

    // V7 - CTA fit (from overlay)
    const v7Score = finalResult.v7?.ctaFitScore || 50;
    const v7CTARecommendation = finalResult.v7?.suggestedCTAType || finalResult.finalRecommendedCTA || 'No recommendation';
    const v7CTAFitScore = finalResult.v7?.ctaFitScore || 50;

    // V8 - Emotional intelligence (from overlay)
    const v8Score = finalResult.v8?.confidence || 50;
    const v8EmotionalTone = finalResult.v8?.emotionalState || 'neutral';
    const v8Confidence = finalResult.v8?.confidence || 50;
    const v8DominantSignal = finalResult.v8?.riskFlags?.[0] || 'none';

    // Determine lead temperature from final score
    const leadTemperature: 'hot' | 'warm' | 'cold' = 
      finalResult.finalScore >= 75 ? 'hot' :
      finalResult.finalScore >= 50 ? 'warm' : 'cold';

    // Build debug response
    const debugData: ScoutScoreDebug = {
      leadId,
      leadName: prospect.full_name,
      finalScore: finalResult.finalScore,
      leadTemperature,
      industry,
      intentSignal: finalResult.finalIntentSignal || base.intentSignal || 'unknown',
      conversionLikelihood: base.conversionLikelihood || Math.round(finalResult.finalScore),
      recommendedCTA: finalResult.finalRecommendedCTA || base.recommendedCTA || 'No CTA available',
      versions: {
        v1: {
          score: v1Result.score || 50,
          signals: v1Result.intentSignal ? [v1Result.intentSignal] : (v1Result.breakdown ? Object.keys(v1Result.breakdown).slice(0, 3) : ['No signals detected']),
          explanation: v1Result.intentSignal || 'Basic text analysis shows minimal interest signals.',
        },
        v2: {
          score: v2Score,
          objections: v2Objections,
          sensitivityLevel: v2Sensitivity,
          explanation: v2Objections.length > 0 
            ? `Detected ${v2Objections.length} objection${v2Objections.length > 1 ? 's' : ''}: ${v2Objections.join(', ')}`
            : 'No major objections detected in conversation.',
        },
        v3: {
          score: v3Score,
          interactions: v3Interactions,
          clickHeat: v3ClickHeat,
          explanation: v3Interactions.length > 0
            ? `Strong engagement detected: ${v3Interactions.length} interaction${v3Interactions.length > 1 ? 's' : ''} tracked.`
            : 'Limited click/CTA engagement detected.',
        },
        v4: {
          score: v4Score,
          timelineStrength: v4TimelineStrength,
          momentum: v4Momentum,
          daysSilent: v4DaysSilent,
          explanation: v4DaysSilent > 7
            ? `Lead has been silent for ${v4DaysSilent} days. Momentum: ${v4Momentum}.`
            : `Recent engagement detected. Momentum: ${v4Momentum}.`,
        },
        v5: {
          score: v5Score,
          industryMatch: v5IndustryMatch.charAt(0).toUpperCase() + v5IndustryMatch.slice(1).replace('_', ' '),
          weightProfile: v5WeightProfile,
          explanation: `Industry-specific scoring applied for ${v5IndustryMatch}.`,
        },
        v6: {
          score: v6Score,
          personaFit: v6PersonaFit,
          mismatchReasons: v6MismatchReasons,
          explanation: finalResult.v6?.personaNotes?.join(' ') || `Persona fit: ${v6PersonaFit}`,
        },
        v7: {
          score: v7Score,
          ctaRecommendation: v7CTARecommendation,
          ctaFitScore: v7CTAFitScore,
          explanation: finalResult.v7?.ctaNotes?.join(' ') || `CTA fit score: ${v7CTAFitScore}/100`,
        },
        v8: {
          score: v8Score,
          emotionalTone: v8EmotionalTone,
          confidence: v8Confidence,
          dominantSignal: finalResult.v8?.riskFlags?.[0] || v8DominantSignal,
          explanation: finalResult.v8?.riskFlags && finalResult.v8.riskFlags.length > 0
            ? `Emotional state: ${v8EmotionalTone}. Risk flags: ${finalResult.v8.riskFlags.join(', ')}`
            : `Emotional state: ${v8EmotionalTone}. Trust score: ${v8Confidence}/100`,
        },
      },
    };

    return debugData;
  } catch (error: any) {
    console.error('[getScoutScoreDebug] Error generating debug data:', error);
    throw new Error(`Failed to generate ScoutScore debug data: ${error.message}`);
  }
}

/**
 * Transform Edge Function response to match ScoutScoreDebug interface
 */
function transformEdgeFunctionResponse(data: any): ScoutScoreDebug {
  return {
    leadId: data.leadId,
    leadName: data.leadName,
    finalScore: data.finalScore,
    leadTemperature: data.leadTemperature,
    industry: data.industry,
    intentSignal: data.intentSignal || 'unknown',
    conversionLikelihood: data.conversionLikelihood || data.finalScore,
    recommendedCTA: data.recommendedCTA || 'No CTA available',
    versions: {
      v1: {
        score: data.versions.v1?.score || 50,
        signals: data.versions.v1?.signals || [],
        explanation: data.versions.v1?.explanation || '',
      },
      v2: {
        score: data.versions.v2?.score || 50,
        objections: data.versions.v2?.objections || [],
        sensitivityLevel: data.versions.v2?.sensitivityLevel || 'low',
        explanation: data.versions.v2?.explanation,
      },
      v3: {
        score: data.versions.v3?.score || 50,
        interactions: data.versions.v3?.interactions || [],
        clickHeat: data.versions.v3?.clickHeat || 0,
        explanation: data.versions.v3?.explanation,
      },
      v4: {
        score: data.versions.v4?.score || 50,
        timelineStrength: data.versions.v4?.timelineStrength || 50,
        momentum: data.versions.v4?.momentum || 'stable',
        daysSilent: data.versions.v4?.daysSilent || 0,
        explanation: data.versions.v4?.explanation,
      },
      v5: {
        score: data.versions.v5?.score || 50,
        industryMatch: data.versions.v5?.industryMatch || 'Unknown',
        weightProfile: data.versions.v5?.weightProfile || 'default',
        explanation: data.versions.v5?.explanation,
      },
      v6: {
        score: data.versions.v6?.score || 50,
        personaFit: data.versions.v6?.personaFit || 'generic',
        mismatchReasons: data.versions.v6?.mismatchReasons || [],
        explanation: data.versions.v6?.explanation,
      },
      v7: {
        score: data.versions.v7?.score || 50,
        ctaRecommendation: data.versions.v7?.ctaRecommendation || 'No recommendation',
        ctaFitScore: data.versions.v7?.ctaFitScore || 50,
        explanation: data.versions.v7?.explanation,
      },
      v8: {
        score: data.versions.v8?.score || 50,
        emotionalTone: data.versions.v8?.emotionalTone || 'neutral',
        confidence: data.versions.v8?.confidence || 50,
        dominantSignal: data.versions.v8?.dominantSignal || 'none',
        explanation: data.versions.v8?.explanation,
      },
    },
  };
}


