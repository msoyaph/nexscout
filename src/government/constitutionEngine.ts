/**
 * Constitution Engine
 * Dynamic rule system for Congress - allows live policy updates
 */

import { supabase } from '../lib/supabase';

const ruleCache: Record<string, any> = {};
let cacheExpiry: number = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Get a constitution rule by key
 */
export async function getConstitutionRule(ruleKey: string): Promise<any> {
  const now = Date.now();

  if (ruleCache[ruleKey] && now < cacheExpiry) {
    return ruleCache[ruleKey];
  }

  try {
    const { data, error } = await supabase
      .from('constitution_rules')
      .select('rule_value')
      .eq('rule_key', ruleKey)
      .maybeSingle();

    if (error) {
      console.error('[Constitution] Error fetching rule:', error);
      return null;
    }

    if (data) {
      ruleCache[ruleKey] = data.rule_value;
      cacheExpiry = now + CACHE_TTL;
      return data.rule_value;
    }

    return null;
  } catch (error) {
    console.error('[Constitution] Exception fetching rule:', error);
    return null;
  }
}

/**
 * Update a constitution rule (admin only)
 */
export async function updateConstitutionRule(
  ruleKey: string,
  ruleValue: any,
  updatedBy: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('constitution_rules')
      .update({
        rule_value: ruleValue,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq('rule_key', ruleKey);

    if (error) {
      console.error('[Constitution] Error updating rule:', error);
      return false;
    }

    delete ruleCache[ruleKey];
    cacheExpiry = 0;

    return true;
  } catch (error) {
    console.error('[Constitution] Exception updating rule:', error);
    return false;
  }
}

/**
 * Get all constitution rules
 */
export async function getAllConstitutionRules() {
  try {
    const { data, error } = await supabase
      .from('constitution_rules')
      .select('*')
      .order('rule_key');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[Constitution] Error fetching all rules:', error);
    return [];
  }
}

/**
 * Clear the rule cache (force refresh)
 */
export function clearConstitutionCache() {
  Object.keys(ruleCache).forEach((key) => delete ruleCache[key]);
  cacheExpiry = 0;
}
