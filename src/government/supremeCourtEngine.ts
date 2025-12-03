/**
 * Supreme Court Engine
 *
 * PURPOSE:
 * This is the judicial branch of NexScout Government. It reviews AI operations
 * before and after execution to ensure safety, quality, and compliance.
 *
 * ROLE:
 * - Pre-check: Review jobs BEFORE execution for safety and permissions
 * - Post-check: Review AI outputs AFTER execution for quality and safety
 * - Block unsafe, illegal, or harmful content
 * - Log all decisions for audit trails
 *
 * INTEGRATION:
 * - Master Orchestrator calls preCheckJob before executing engines
 * - Master Orchestrator calls postCheckJob after engines return results
 * - Blocked outputs are logged to database
 */

import { supabase } from '../lib/supabase';
import type {
  SupremeCourtPreCheckResult,
  SupremeCourtPostCheckResult,
  PreCheckContext,
  PostCheckContext,
  PIIDetectionResult,
  ContentSafetyResult,
} from './types/government';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PAYLOAD_SIZE = 100000; // 100KB
const MAX_RISK_SCORE = 100;
const BLOCK_THRESHOLD = 75;

// Patterns for PII detection
const PII_PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?63|0)?[0-9]{10,11}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  apiKey: /\b(sk-|SUPABASE_|pk_|sk_test_)[A-Za-z0-9_-]{20,}\b/g,
};

// Patterns for unsafe content
const UNSAFE_PATTERNS = {
  sqlInjection: /(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|;--)/gi,
  scriptInjection: /<script[^>]*>.*?<\/script>/gi,
  moneyPromises: /(guaranteed?\s+(income|money|profit|earnings)|100%\s+sure|no\s+risk)/gi,
  hateSpeech: /(kill|murder|rape|attack)\s+(all|every|the)\s+\w+/gi,
};

// ============================================================================
// PRE-CHECK FUNCTION
// ============================================================================

/**
 * PURPOSE: Review job BEFORE execution
 * INPUT: PreCheckContext with user, tier, jobType, payload
 * OUTPUT: SupremeCourtPreCheckResult with allowed status and risk score
 */
async function preCheckJob(
  ctx: PreCheckContext
): Promise<SupremeCourtPreCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  try {
    // Check 1: User is not banned
    const banCheck = await checkUserBanned(ctx.userId);
    if (banCheck.isBanned) {
      riskScore += 100;
      reasons.push(`User is banned: ${banCheck.reason}`);
      return { allowed: false, reasons, riskScore };
    }

    // Check 2: Payload size
    const payloadSize = JSON.stringify(ctx.payload || {}).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      riskScore += 50;
      reasons.push(`Payload too large: ${payloadSize} bytes (max: ${MAX_PAYLOAD_SIZE})`);
    }

    // Check 3: Suspicious behavior detection
    const suspiciousBehavior = await detectSuspiciousBehavior(ctx.userId, ctx.jobType);
    if (suspiciousBehavior.isSuspicious) {
      riskScore += 30;
      reasons.push(...suspiciousBehavior.reasons);
    }

    // Check 4: Check for SQL injection or XSS in payload
    if (ctx.payload && typeof ctx.payload === 'object') {
      const payloadStr = JSON.stringify(ctx.payload);
      if (UNSAFE_PATTERNS.sqlInjection.test(payloadStr)) {
        riskScore += 80;
        reasons.push('Potential SQL injection detected in payload');
      }
      if (UNSAFE_PATTERNS.scriptInjection.test(payloadStr)) {
        riskScore += 70;
        reasons.push('Potential XSS detected in payload');
      }
    }

    // Check 5: API key leakage in payload
    if (ctx.payload && typeof ctx.payload === 'object') {
      const payloadStr = JSON.stringify(ctx.payload);
      if (PII_PATTERNS.apiKey.test(payloadStr)) {
        riskScore += 90;
        reasons.push('API keys detected in payload');
      }
    }

    // Check 6: Rate abuse detection
    const rateAbuseCheck = await checkRateAbuse(ctx.userId, ctx.jobType);
    if (rateAbuseCheck.isAbusing) {
      riskScore += 40;
      reasons.push('Potential rate abuse detected');
    }

    // Log pre-check to audit table
    await logPreCheck(ctx, riskScore >= BLOCK_THRESHOLD ? false : true, reasons, riskScore);

    // Decision
    if (riskScore >= BLOCK_THRESHOLD) {
      return {
        allowed: false,
        reasons: reasons.length > 0 ? reasons : ['High risk score detected'],
        riskScore,
      };
    }

    return {
      allowed: true,
      reasons: reasons.length > 0 ? reasons : undefined,
      riskScore,
    };
  } catch (error: any) {
    console.error('[SupremeCourt] preCheckJob error:', error);
    return {
      allowed: true,
      reasons: ['Pre-check error - proceeding with caution'],
      riskScore: 20,
    };
  }
}

// ============================================================================
// POST-CHECK FUNCTION
// ============================================================================

/**
 * PURPOSE: Review AI output AFTER execution
 * INPUT: PostCheckContext with jobId, engine output, metadata
 * OUTPUT: SupremeCourtPostCheckResult with blocked status and sanitized output
 */
async function postCheckJob(
  ctx: PostCheckContext
): Promise<SupremeCourtPostCheckResult> {
  const auditId = crypto.randomUUID();
  const reasons: string[] = [];
  let riskScore = 0;
  let sanitizedOutput = ctx.engineOutput;
  let blocked = false;

  try {
    const outputStr = JSON.stringify(ctx.engineOutput || {});

    // Check 1: PII leakage detection
    const piiCheck = detectPII(outputStr);
    if (piiCheck.hasPII) {
      riskScore += 60;
      reasons.push(`PII detected: ${piiCheck.types.join(', ')}`);
      sanitizedOutput = sanitizePII(ctx.engineOutput, piiCheck);
    }

    // Check 2: API key or secret leakage
    if (PII_PATTERNS.apiKey.test(outputStr)) {
      riskScore += 100;
      reasons.push('API keys or secrets detected in output');
      blocked = true;
      sanitizedOutput = generateSafeFallbackResponse(ctx.jobType, ctx);
    }

    // Check 3: Money promises or guarantees
    if (UNSAFE_PATTERNS.moneyPromises.test(outputStr)) {
      riskScore += 40;
      reasons.push('Unrealistic money promises detected');
      sanitizedOutput = sanitizeMoneyPromises(ctx.engineOutput);
    }

    // Check 4: Hate speech or dangerous content
    if (UNSAFE_PATTERNS.hateSpeech.test(outputStr)) {
      riskScore += 100;
      reasons.push('Hate speech or dangerous content detected');
      blocked = true;
      sanitizedOutput = generateSafeFallbackResponse(ctx.jobType, ctx);
    }

    // Check 5: Content safety for sales
    const contentSafety = isContentSafeForSales(outputStr);
    if (!contentSafety.isSafe) {
      riskScore += 30;
      reasons.push(...contentSafety.issues);
    }

    // Check 6: Broken JSON structure
    if (ctx.jobType === 'ANALYTICS_QUERY' || ctx.jobType === 'COMPANY_INTELLIGENCE') {
      try {
        if (typeof ctx.engineOutput === 'string') {
          JSON.parse(ctx.engineOutput);
        }
      } catch {
        riskScore += 20;
        reasons.push('Malformed JSON detected');
      }
    }

    // Determine if we should block
    if (riskScore >= BLOCK_THRESHOLD) {
      blocked = true;
    }

    // Log post-check to audit table
    await logPostCheck(ctx, auditId, !blocked, blocked, reasons, riskScore);

    // Log blocked output if necessary
    if (blocked) {
      await logBlockedOutput(auditId, ctx, sanitizedOutput, reasons, riskScore);
    }

    return {
      allowed: !blocked,
      blocked,
      reasons: reasons.length > 0 ? reasons : undefined,
      sanitizedOutput: blocked || riskScore > 40 ? sanitizedOutput : undefined,
      auditId,
      riskScore,
    };
  } catch (error: any) {
    console.error('[SupremeCourt] postCheckJob error:', error);
    return {
      allowed: true,
      blocked: false,
      reasons: ['Post-check error - output allowed'],
      sanitizedOutput: undefined,
      auditId,
      riskScore: 0,
    };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * PURPOSE: Check if user is banned
 * INPUT: userId
 * OUTPUT: Ban status with reason
 */
async function checkUserBanned(
  userId: string
): Promise<{ isBanned: boolean; reason?: string }> {
  try {
    const { data } = await supabase
      .from('banned_users')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!data) {
      return { isBanned: false };
    }

    if (data.is_permanent) {
      return { isBanned: true, reason: data.reason };
    }

    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt > new Date()) {
        return { isBanned: true, reason: data.reason };
      }
    }

    return { isBanned: false };
  } catch (error) {
    console.error('[SupremeCourt] checkUserBanned error:', error);
    return { isBanned: false };
  }
}

/**
 * PURPOSE: Detect suspicious behavior patterns
 * INPUT: userId and jobType
 * OUTPUT: Suspicious behavior result
 */
async function detectSuspiciousBehavior(
  userId: string,
  jobType: string
): Promise<{ isSuspicious: boolean; reasons: string[] }> {
  try {
    const reasons: string[] = [];
    const last10Minutes = new Date(Date.now() - 10 * 60 * 1000);

    const { count } = await supabase
      .from('audit_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('job_type', jobType)
      .gte('created_at', last10Minutes.toISOString());

    if (count && count > 50) {
      reasons.push('Excessive requests in short time window');
      return { isSuspicious: true, reasons };
    }

    return { isSuspicious: false, reasons: [] };
  } catch (error) {
    return { isSuspicious: false, reasons: [] };
  }
}

/**
 * PURPOSE: Check for rate abuse patterns
 * INPUT: userId and jobType
 * OUTPUT: Abuse detection result
 */
async function checkRateAbuse(
  userId: string,
  jobType: string
): Promise<{ isAbusing: boolean }> {
  try {
    const last1Hour = new Date(Date.now() - 60 * 60 * 1000);

    const { count } = await supabase
      .from('audit_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', last1Hour.toISOString());

    if (count && count > 200) {
      return { isAbusing: true };
    }

    return { isAbusing: false };
  } catch (error) {
    return { isAbusing: false };
  }
}

/**
 * PURPOSE: Detect PII in text
 * INPUT: Text string
 * OUTPUT: PIIDetectionResult with types and locations
 */
function detectPII(text: string): PIIDetectionResult {
  const types: string[] = [];
  const locations: Array<{ type: string; text: string }> = [];

  Object.entries(PII_PATTERNS).forEach(([type, pattern]) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      types.push(type);
      matches.forEach(match => {
        locations.push({ type, text: match });
      });
    }
  });

  return {
    hasPII: types.length > 0,
    types,
    locations,
  };
}

/**
 * PURPOSE: Check if content is safe for sales context
 * INPUT: Text string
 * OUTPUT: ContentSafetyResult with issues
 */
function isContentSafeForSales(text: string): ContentSafetyResult {
  const issues: string[] = [];
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (UNSAFE_PATTERNS.moneyPromises.test(text)) {
    issues.push('Contains unrealistic money promises');
    severity = 'high';
  }

  if (text.toLowerCase().includes('scam') || text.toLowerCase().includes('ponzi')) {
    issues.push('Contains suspicious business terms');
    severity = 'critical';
  }

  if (text.length < 10 && text.includes('error')) {
    issues.push('Output too short or contains error');
    severity = 'medium';
  }

  return {
    isSafe: issues.length === 0,
    issues,
    severity,
  };
}

/**
 * PURPOSE: Sanitize PII from output
 * INPUT: Original output and PII detection result
 * OUTPUT: Sanitized output
 */
function sanitizePII(output: any, piiResult: PIIDetectionResult): any {
  let sanitized = JSON.stringify(output);

  piiResult.locations.forEach(location => {
    const replacement =
      location.type === 'email'
        ? '[EMAIL_REDACTED]'
        : location.type === 'phone'
        ? '[PHONE_REDACTED]'
        : location.type === 'apiKey'
        ? '[KEY_REDACTED]'
        : '[REDACTED]';

    sanitized = sanitized.replace(location.text, replacement);
  });

  try {
    return JSON.parse(sanitized);
  } catch {
    return sanitized;
  }
}

/**
 * PURPOSE: Sanitize money promises
 * INPUT: Original output
 * OUTPUT: Sanitized output
 */
function sanitizeMoneyPromises(output: any): any {
  let sanitized = JSON.stringify(output);

  sanitized = sanitized.replace(/100%\s+guaranteed/gi, 'highly likely');
  sanitized = sanitized.replace(/guaranteed?\s+income/gi, 'potential income');
  sanitized = sanitized.replace(/no\s+risk/gi, 'managed risk');

  try {
    return JSON.parse(sanitized);
  } catch {
    return sanitized;
  }
}

/**
 * PURPOSE: Generate safe fallback response
 * INPUT: jobType and context
 * OUTPUT: Safe generic response
 */
function generateSafeFallbackResponse(jobType: string, ctx: any): any {
  const fallbacks: Record<string, any> = {
    SCAN: {
      success: true,
      message: 'Scan completed. Results have been processed and stored.',
      prospects: [],
    },
    MESSAGE: {
      success: true,
      message: 'Thank you for your interest. We will review your information and get back to you soon.',
    },
    PITCH_DECK: {
      success: true,
      message: 'Pitch deck generated. Please review before sharing.',
      slides: [],
    },
    CHATBOT: {
      success: true,
      message: 'Thank you for your message. How can I help you today?',
    },
    COMPANY_INTELLIGENCE: {
      success: true,
      message: 'Company analysis in progress. Results will be available shortly.',
      data: {},
    },
  };

  return fallbacks[jobType] || { success: true, message: 'Request processed successfully.' };
}

/**
 * PURPOSE: Log pre-check to database
 */
async function logPreCheck(
  ctx: PreCheckContext,
  allowed: boolean,
  reasons: string[],
  riskScore: number
): Promise<void> {
  try {
    const payloadSummary = {
      size: JSON.stringify(ctx.payload || {}).length,
      type: typeof ctx.payload,
      hasData: !!ctx.payload,
    };

    await supabase.from('audit_jobs').insert({
      user_id: ctx.userId,
      job_type: ctx.jobType,
      tier: ctx.tier,
      source: ctx.source,
      precheck_allowed: allowed,
      precheck_reasons: JSON.stringify(reasons),
      precheck_risk_score: riskScore,
      payload_summary: JSON.stringify(payloadSummary),
    });
  } catch (error) {
    console.error('[SupremeCourt] logPreCheck error:', error);
  }
}

/**
 * PURPOSE: Log post-check to database
 */
async function logPostCheck(
  ctx: PostCheckContext,
  auditId: string,
  allowed: boolean,
  blocked: boolean,
  reasons: string[],
  riskScore: number
): Promise<void> {
  try {
    await supabase
      .from('audit_jobs')
      .update({
        postcheck_allowed: allowed,
        postcheck_blocked: blocked,
        postcheck_reasons: JSON.stringify(reasons),
        postcheck_risk_score: riskScore,
        execution_metadata: JSON.stringify(ctx.executionMetadata),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', ctx.userId)
      .eq('job_type', ctx.jobType)
      .order('created_at', { ascending: false })
      .limit(1);
  } catch (error) {
    console.error('[SupremeCourt] logPostCheck error:', error);
  }
}

/**
 * PURPOSE: Log blocked output to database
 */
async function logBlockedOutput(
  auditId: string,
  ctx: PostCheckContext,
  sanitizedOutput: any,
  reasons: string[],
  riskScore: number
): Promise<void> {
  try {
    const severity =
      riskScore >= 90 ? 'critical' : riskScore >= 70 ? 'high' : riskScore >= 50 ? 'medium' : 'low';

    await supabase.from('blocked_outputs').insert({
      audit_job_id: auditId,
      user_id: ctx.userId,
      engine_output: JSON.stringify(ctx.engineOutput),
      sanitized_output: JSON.stringify(sanitizedOutput),
      block_reason: reasons.join(', '),
      severity,
    });
  } catch (error) {
    console.error('[SupremeCourt] logBlockedOutput error:', error);
  }
}

// ============================================================================
// EXPORT SUPREME COURT API
// ============================================================================

export const SupremeCourt = {
  preCheckJob,
  postCheckJob,
  isContentSafeForSales,
  detectPII,
  generateSafeFallbackResponse,
};
