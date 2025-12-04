import { supabase } from '../../lib/supabase';

export interface SafetyFlag {
  type: 'misleading' | 'overpromise' | 'compliance_risk' | 'spammy' | 'off_brand';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  suggestion: string;
}

export interface SafetyReview {
  safeContent: string;
  flags: SafetyFlag[];
  modified: boolean;
}

const RISKY_PHRASES = [
  'guaranteed income',
  'no work required',
  'get rich quick',
  'instant wealth',
  'guaranteed returns',
  'risk-free investment',
  'unlimited income',
  'make money while you sleep',
];

const SPAMMY_PATTERNS = [
  /[!]{3,}/g,
  /[A-Z\s]{20,}/g,
  /\$\$\$/g,
];

export async function reviewAndAdjustContent(input: {
  userId: string;
  companyId?: string;
  contentType: string;
  contentId?: string;
  rawContent: string;
}): Promise<SafetyReview> {
  try {
    const flags: SafetyFlag[] = [];
    let safeContent = input.rawContent;
    let modified = false;

    for (const phrase of RISKY_PHRASES) {
      if (safeContent.toLowerCase().includes(phrase)) {
        flags.push({
          type: 'overpromise',
          severity: 'high',
          reason: `Contains risky phrase: "${phrase}"`,
          suggestion: 'Remove or soften promise language',
        });

        safeContent = safeContent.replace(new RegExp(phrase, 'gi'), '[potential opportunity]');
        modified = true;
      }
    }

    for (const pattern of SPAMMY_PATTERNS) {
      if (pattern.test(safeContent)) {
        flags.push({
          type: 'spammy',
          severity: 'medium',
          reason: 'Contains spammy patterns (excessive caps/punctuation)',
          suggestion: 'Tone down emphasis',
        });

        safeContent = safeContent.replace(pattern, '');
        modified = true;
      }
    }

    if (flags.length > 0) {
      await supabase.from('company_ai_safety_flags').insert(
        flags.map((flag) => ({
          user_id: input.userId,
          company_id: input.companyId || null,
          content_type: input.contentType,
          content_id: input.contentId || null,
          flag_type: flag.type,
          severity: flag.severity,
          notes: flag.reason,
        }))
      );
    }

    return {
      safeContent: modified ? safeContent : input.rawContent,
      flags,
      modified,
    };
  } catch (error) {
    console.error('Review and adjust content error:', error);
    return {
      safeContent: input.rawContent,
      flags: [],
      modified: false,
    };
  }
}

export async function getSafetyFlags(userId: string, companyId?: string): Promise<SafetyFlag[]> {
  try {
    let query = supabase
      .from('company_ai_safety_flags')
      .select('*')
      .eq('user_id', userId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error || !data) return [];

    return data.map((row) => ({
      type: row.flag_type,
      severity: row.severity,
      reason: row.notes || 'No reason provided',
      suggestion: 'Review and adjust content',
    }));
  } catch (error) {
    console.error('Get safety flags error:', error);
    return [];
  }
}
