import { getCompanyBrain } from './companyBrainEngine';
import { supabase } from '../../lib/supabase';

export interface StyleTransformation {
  original: string;
  transformed: string;
  rulesApplied: string[];
}

export async function transformToCompanyVoice(
  userId: string,
  rawContent: string,
  companyId?: string
): Promise<StyleTransformation> {
  try {
    const brain = await getCompanyBrain(userId, companyId);
    const rules = await getActiveStyleRules(userId, companyId);

    let transformed = rawContent;
    const rulesApplied: string[] = [];

    for (const rule of rules) {
      const result = applyStyleRule(transformed, rule, brain);
      transformed = result.content;
      if (result.applied) {
        rulesApplied.push(rule.rule_category);
      }
    }

    transformed = applyBrainPatterns(transformed, brain, rulesApplied);

    return {
      original: rawContent,
      transformed,
      rulesApplied,
    };
  } catch (error) {
    console.error('Transform to company voice error:', error);
    return {
      original: rawContent,
      transformed: rawContent,
      rulesApplied: [],
    };
  }
}

async function getActiveStyleRules(userId: string, companyId?: string) {
  try {
    let query = supabase
      .from('company_ai_style_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get style rules error:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Get style rules error:', error);
    return [];
  }
}

function applyStyleRule(
  content: string,
  rule: any,
  brain: any
): { content: string; applied: boolean } {
  let modified = content;
  let applied = false;

  const ruleData = rule.rule;

  if (rule.rule_category === 'phrase_replacement' && ruleData.replacements) {
    Object.entries(ruleData.replacements).forEach(([from, to]) => {
      const regex = new RegExp(from, 'gi');
      if (regex.test(modified)) {
        modified = modified.replace(regex, to as string);
        applied = true;
      }
    });
  }

  if (rule.rule_category === 'tone_enforcement' && ruleData.tone) {
    if (ruleData.tone === 'taglish' && !hasTaglish(modified)) {
      modified = injectTaglish(modified);
      applied = true;
    }
  }

  if (rule.rule_category === 'structure_template' && ruleData.structure) {
    if (ruleData.structure === 'short' && countWords(modified) > 100) {
      modified = shortenContent(modified);
      applied = true;
    }
  }

  return { content: modified, applied };
}

function applyBrainPatterns(content: string, brain: any, rulesApplied: string[]): string {
  let result = content;

  if (brain.winningPatterns.includes('short') && countWords(result) > 150) {
    result = shortenContent(result);
  }

  if (brain.brandIdentity.keywords.length > 0 && !rulesApplied.includes('keyword_injection')) {
    const keyword = brain.brandIdentity.keywords[0];
    if (!result.toLowerCase().includes(keyword.toLowerCase())) {
      result = injectKeyword(result, keyword);
    }
  }

  return result;
}

function hasTaglish(text: string): boolean {
  const tagalogWords = ['po', 'kasi', 'naman', 'lang', 'ba', 'ako', 'ikaw', 'siya'];
  return tagalogWords.some((word) => text.toLowerCase().includes(word));
}

function injectTaglish(text: string): string {
  const sentences = text.split('. ');
  if (sentences.length > 1) {
    sentences[0] += ' po';
  }
  return sentences.join('. ');
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function shortenContent(text: string): string {
  const sentences = text.split('. ').filter((s) => s.trim().length > 0);
  if (sentences.length <= 3) return text;
  return sentences.slice(0, 3).join('. ') + '.';
}

function injectKeyword(text: string, keyword: string): string {
  const sentences = text.split('. ');
  if (sentences.length > 1) {
    sentences[1] = `${sentences[1]} ${keyword}`;
  }
  return sentences.join('. ');
}

export async function createStyleRule(
  userId: string,
  companyId: string | undefined,
  category: string,
  rule: any,
  priority: number = 0
): Promise<boolean> {
  try {
    const { error } = await supabase.from('company_ai_style_rules').insert({
      user_id: userId,
      company_id: companyId || null,
      rule_category: category,
      rule: rule,
      priority: priority,
      is_active: true,
    });

    return !error;
  } catch (error) {
    console.error('Create style rule error:', error);
    return false;
  }
}
