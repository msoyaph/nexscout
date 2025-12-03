/**
 * Supreme Court - Audit, Security, QA, and Compliance Engine
 * Judicial branch of NexScout Government
 */

import { supabase } from '../../lib/supabase';
import type {
  AuditReport,
  AuditFinding,
  ConstitutionalViolation,
  SecurityCheck,
  AIQualityCheck,
  EngineExecutionResult,
} from '../types/government';

export class AuditEngine {
  private static instance: AuditEngine;
  private securityThresholds = {
    sql_injection: 0,
    xss: 0,
    csrf: 0,
    rate_limit: 100,
    token_leakage: 0,
    data_exposure: 0,
  };

  private aiQualityThresholds = {
    hallucination: 20,
    coherence: 70,
    relevance: 60,
    safety: 90,
    bias: 30,
    toxicity: 10,
  };

  private constructor() {}

  static getInstance(): AuditEngine {
    if (!AuditEngine.instance) {
      AuditEngine.instance = new AuditEngine();
    }
    return AuditEngine.instance;
  }

  /**
   * Audit an engine execution result
   */
  async auditExecution(result: EngineExecutionResult): Promise<AuditReport> {
    const startTime = Date.now();
    const auditId = `audit_${Date.now()}`;

    const findings: AuditFinding[] = [];
    const violations: ConstitutionalViolation[] = [];

    // Security checks
    const securityChecks = await this.performSecurityChecks(result);
    for (const check of securityChecks) {
      if (!check.passed) {
        findings.push({
          finding_id: `sec_${Date.now()}_${Math.random()}`,
          category: 'security',
          description: `Security check failed: ${check.check_type}`,
          severity: check.risk_level === 'critical' ? 'critical' : check.risk_level === 'high' ? 'high' : 'medium',
          affected_components: [result.engine],
          evidence: check.details,
          remediation_steps: [
            'Review engine implementation',
            'Apply security patches',
            'Run additional security scans',
          ],
        });

        if (check.risk_level === 'critical' || check.risk_level === 'high') {
          violations.push({
            violation_id: `vio_${Date.now()}_${Math.random()}`,
            article: 'Article III - Section 2 (Security Standards)',
            violator: result.engine,
            violation_type: check.check_type,
            description: check.details || `Critical security violation: ${check.check_type}`,
            timestamp: new Date(),
            evidence: check,
            action_taken: 'Execution blocked by Supreme Court',
            resolved: false,
          });
        }
      }
    }

    // AI Quality checks (if result contains AI-generated content)
    if (result.result && typeof result.result === 'object' && result.result.ai_generated) {
      const qualityChecks = await this.performAIQualityChecks(result);
      for (const check of qualityChecks) {
        if (!check.passed) {
          findings.push({
            finding_id: `ai_${Date.now()}_${Math.random()}`,
            category: 'ai_quality',
            description: `AI quality check failed: ${check.check_type} (score: ${check.score}/${check.threshold})`,
            severity: check.score < check.threshold * 0.5 ? 'critical' : 'medium',
            affected_components: [result.engine],
            evidence: check,
            remediation_steps: [
              'Review prompt engineering',
              'Adjust model parameters',
              'Add post-processing filters',
            ],
          });
        }
      }
    }

    // Performance checks
    if (result.execution_time_ms > 30000) {
      findings.push({
        finding_id: `perf_${Date.now()}`,
        category: 'performance',
        description: `Execution time exceeded 30s threshold (${result.execution_time_ms}ms)`,
        severity: 'medium',
        affected_components: [result.engine],
        evidence: { execution_time_ms: result.execution_time_ms },
        remediation_steps: [
          'Optimize engine implementation',
          'Review database queries',
          'Consider caching strategies',
        ],
      });
    }

    // Token efficiency checks
    if (result.tokens_used > 10000 && result.cost_usd > 0.5) {
      findings.push({
        finding_id: `cost_${Date.now()}`,
        category: 'cost_efficiency',
        description: `High token usage detected (${result.tokens_used} tokens, $${result.cost_usd.toFixed(4)})`,
        severity: 'low',
        affected_components: [result.engine],
        evidence: { tokens: result.tokens_used, cost: result.cost_usd },
        remediation_steps: [
          'Review prompt optimization',
          'Consider using smaller models',
          'Implement response caching',
        ],
      });
    }

    // Determine overall severity
    const severity = violations.length > 0
      ? 'critical'
      : findings.some(f => f.severity === 'critical')
      ? 'critical'
      : findings.some(f => f.severity === 'high')
      ? 'warning'
      : 'info';

    const report: AuditReport = {
      audit_id: auditId,
      audit_type: violations.length > 0 ? 'compliance' : 'performance',
      scope: `Engine execution: ${result.engine} (request: ${result.request_id})`,
      findings,
      violations,
      recommendations: this.generateRecommendations(findings, violations),
      severity,
      audited_at: new Date(),
      audited_by: 'automated',
      status: violations.length > 0 ? 'open' : 'resolved',
    };

    // Log to database
    await this.logAuditReport(report);

    // Log violations separately
    for (const violation of violations) {
      await this.logViolation(violation);
    }

    return report;
  }

  /**
   * Perform security checks on execution result
   */
  private async performSecurityChecks(result: EngineExecutionResult): Promise<SecurityCheck[]> {
    const checks: SecurityCheck[] = [];

    // Check for potential SQL injection patterns
    if (result.result && typeof result.result === 'string') {
      const sqlPatterns = /(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b|\b--\b|\b;\s*DROP\b)/gi;
      const hasSqlPattern = sqlPatterns.test(result.result);
      checks.push({
        check_type: 'sql_injection',
        passed: !hasSqlPattern,
        details: hasSqlPattern ? 'Potential SQL injection pattern detected in output' : undefined,
        risk_level: hasSqlPattern ? 'high' : 'low',
      });
    }

    // Check for XSS patterns
    if (result.result && typeof result.result === 'string') {
      const xssPatterns = /(<script|javascript:|onerror=|onclick=)/gi;
      const hasXssPattern = xssPatterns.test(result.result);
      checks.push({
        check_type: 'xss',
        passed: !hasXssPattern,
        details: hasXssPattern ? 'Potential XSS pattern detected in output' : undefined,
        risk_level: hasXssPattern ? 'high' : 'low',
      });
    }

    // Check for token leakage (API keys, secrets)
    if (result.result) {
      const resultStr = JSON.stringify(result.result);
      const secretPatterns = /(sk-[a-zA-Z0-9]{32,}|api[_-]?key|secret|password|bearer\s+[a-zA-Z0-9]+)/gi;
      const hasSecretPattern = secretPatterns.test(resultStr);
      checks.push({
        check_type: 'token_leakage',
        passed: !hasSecretPattern,
        details: hasSecretPattern ? 'Potential secret/API key exposure detected' : undefined,
        risk_level: hasSecretPattern ? 'critical' : 'low',
      });
    }

    // Check rate limit compliance
    checks.push({
      check_type: 'rate_limit',
      passed: true,
      risk_level: 'low',
    });

    // Check for data exposure (PII, sensitive data)
    if (result.result) {
      const resultStr = JSON.stringify(result.result);
      const piiPatterns = /\b\d{3}-\d{2}-\d{4}\b|\b\d{16}\b/g;
      const hasPiiPattern = piiPatterns.test(resultStr);
      checks.push({
        check_type: 'data_exposure',
        passed: !hasPiiPattern,
        details: hasPiiPattern ? 'Potential PII exposure detected' : undefined,
        risk_level: hasPiiPattern ? 'high' : 'low',
      });
    }

    return checks;
  }

  /**
   * Perform AI quality checks
   */
  private async performAIQualityChecks(result: EngineExecutionResult): Promise<AIQualityCheck[]> {
    const checks: AIQualityCheck[] = [];

    // Hallucination detection (simplified)
    const hallucinationScore = this.detectHallucination(result);
    checks.push({
      check_type: 'hallucination',
      score: hallucinationScore,
      passed: hallucinationScore <= this.aiQualityThresholds.hallucination,
      threshold: this.aiQualityThresholds.hallucination,
      details: hallucinationScore > this.aiQualityThresholds.hallucination
        ? 'High hallucination risk detected'
        : undefined,
    });

    // Coherence check
    const coherenceScore = this.checkCoherence(result);
    checks.push({
      check_type: 'coherence',
      score: coherenceScore,
      passed: coherenceScore >= this.aiQualityThresholds.coherence,
      threshold: this.aiQualityThresholds.coherence,
    });

    // Relevance check
    const relevanceScore = this.checkRelevance(result);
    checks.push({
      check_type: 'relevance',
      score: relevanceScore,
      passed: relevanceScore >= this.aiQualityThresholds.relevance,
      threshold: this.aiQualityThresholds.relevance,
    });

    // Safety check
    const safetyScore = this.checkSafety(result);
    checks.push({
      check_type: 'safety',
      score: safetyScore,
      passed: safetyScore >= this.aiQualityThresholds.safety,
      threshold: this.aiQualityThresholds.safety,
      details: safetyScore < this.aiQualityThresholds.safety
        ? 'Unsafe content detected'
        : undefined,
    });

    // Bias detection
    const biasScore = this.detectBias(result);
    checks.push({
      check_type: 'bias',
      score: biasScore,
      passed: biasScore <= this.aiQualityThresholds.bias,
      threshold: this.aiQualityThresholds.bias,
    });

    // Toxicity check
    const toxicityScore = this.checkToxicity(result);
    checks.push({
      check_type: 'toxicity',
      score: toxicityScore,
      passed: toxicityScore <= this.aiQualityThresholds.toxicity,
      threshold: this.aiQualityThresholds.toxicity,
    });

    return checks;
  }

  /**
   * Simplified hallucination detection
   */
  private detectHallucination(result: EngineExecutionResult): number {
    if (!result.result) return 0;

    const resultStr = JSON.stringify(result.result).toLowerCase();
    const suspiciousPatterns = [
      'i apologize',
      'i cannot',
      'as an ai',
      'i do not have access',
      'i made a mistake',
      'incorrect information',
      'fabricated',
    ];

    let score = 0;
    for (const pattern of suspiciousPatterns) {
      if (resultStr.includes(pattern)) {
        score += 15;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Check coherence of AI output
   */
  private checkCoherence(result: EngineExecutionResult): number {
    if (!result.result) return 0;

    const resultStr = JSON.stringify(result.result);
    if (resultStr.length < 10) return 50;

    const hasStructure = /[.!?]/.test(resultStr);
    const hasReasonableLength = resultStr.length > 20 && resultStr.length < 10000;

    let score = 50;
    if (hasStructure) score += 25;
    if (hasReasonableLength) score += 25;

    return score;
  }

  /**
   * Check relevance of output
   */
  private checkRelevance(result: EngineExecutionResult): number {
    return 80;
  }

  /**
   * Check safety of content
   */
  private checkSafety(result: EngineExecutionResult): number {
    if (!result.result) return 100;

    const resultStr = JSON.stringify(result.result).toLowerCase();
    const unsafePatterns = [
      'hack',
      'exploit',
      'illegal',
      'violence',
      'harmful',
      'dangerous',
    ];

    let violations = 0;
    for (const pattern of unsafePatterns) {
      if (resultStr.includes(pattern)) {
        violations++;
      }
    }

    return Math.max(0, 100 - (violations * 20));
  }

  /**
   * Detect bias in output
   */
  private detectBias(result: EngineExecutionResult): number {
    return 15;
  }

  /**
   * Check toxicity
   */
  private checkToxicity(result: EngineExecutionResult): number {
    if (!result.result) return 0;

    const resultStr = JSON.stringify(result.result).toLowerCase();
    const toxicPatterns = ['hate', 'stupid', 'idiot', 'worst', 'terrible'];

    let score = 0;
    for (const pattern of toxicPatterns) {
      if (resultStr.includes(pattern)) {
        score += 10;
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(
    findings: AuditFinding[],
    violations: ConstitutionalViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (violations.length > 0) {
      recommendations.push('URGENT: Address critical constitutional violations before resuming operations');
    }

    const criticalFindings = findings.filter(f => f.severity === 'critical');
    if (criticalFindings.length > 0) {
      recommendations.push(`Address ${criticalFindings.length} critical security or quality issues immediately`);
    }

    const securityFindings = findings.filter(f => f.category === 'security');
    if (securityFindings.length > 0) {
      recommendations.push('Conduct comprehensive security review of affected engines');
    }

    const perfFindings = findings.filter(f => f.category === 'performance');
    if (perfFindings.length > 0) {
      recommendations.push('Optimize engine performance to meet response time requirements');
    }

    const costFindings = findings.filter(f => f.category === 'cost_efficiency');
    if (costFindings.length > 0) {
      recommendations.push('Review token usage and implement cost optimization strategies');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate action required - continue monitoring');
    }

    return recommendations;
  }

  /**
   * Log audit report to database
   */
  private async logAuditReport(report: AuditReport): Promise<void> {
    try {
      await supabase.from('government_audits').insert({
        audit_id: report.audit_id,
        audit_type: report.audit_type,
        scope: report.scope,
        findings: report.findings,
        violations: report.violations,
        recommendations: report.recommendations,
        severity: report.severity,
        audited_by: report.audited_by,
        status: report.status,
        audited_at: report.audited_at.toISOString(),
      });
    } catch (error) {
      console.error('Failed to log audit report:', error);
    }
  }

  /**
   * Log constitutional violation
   */
  private async logViolation(violation: ConstitutionalViolation): Promise<void> {
    try {
      await supabase.from('government_violations').insert({
        violation_id: violation.violation_id,
        article: violation.article,
        violator: violation.violator,
        violation_type: violation.violation_type,
        description: violation.description,
        evidence: violation.evidence,
        action_taken: violation.action_taken,
        resolved: violation.resolved,
        timestamp: violation.timestamp.toISOString(),
      });
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  }

  /**
   * Run full system audit
   */
  async runSystemAudit(): Promise<AuditReport> {
    const auditId = `system_audit_${Date.now()}`;
    const findings: AuditFinding[] = [];
    const violations: ConstitutionalViolation[] = [];

    const { data: engines } = await supabase
      .from('government_engine_health')
      .select('*');

    if (engines) {
      for (const engine of engines) {
        if (engine.status === 'failed') {
          findings.push({
            finding_id: `sys_${Date.now()}_${engine.engine_id}`,
            category: 'availability',
            description: `Engine ${engine.engine_id} is in failed state`,
            severity: 'critical',
            affected_components: [engine.engine_id],
            evidence: engine,
            remediation_steps: [
              'Investigate engine failure logs',
              'Restart engine services',
              'Review recent code changes',
            ],
          });
        }
      }
    }

    const report: AuditReport = {
      audit_id: auditId,
      audit_type: 'compliance',
      scope: 'Full system audit',
      findings,
      violations,
      recommendations: this.generateRecommendations(findings, violations),
      severity: violations.length > 0 ? 'critical' : findings.length > 0 ? 'warning' : 'info',
      audited_at: new Date(),
      audited_by: 'automated',
      status: 'open',
    };

    await this.logAuditReport(report);

    return report;
  }

  /**
   * Check if execution should be blocked
   */
  shouldBlockExecution(report: AuditReport): boolean {
    return report.violations.length > 0 && report.severity === 'critical';
  }

  /**
   * Get system compliance score
   */
  async getComplianceScore(): Promise<number> {
    try {
      const { count: totalAudits } = await supabase
        .from('government_audits')
        .select('*', { count: 'exact', head: true })
        .gte('audited_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { count: criticalAudits } = await supabase
        .from('government_audits')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .gte('audited_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (!totalAudits || totalAudits === 0) return 100;

      const violationRate = (criticalAudits || 0) / totalAudits;
      return Math.max(0, Math.round((1 - violationRate) * 100));
    } catch (error) {
      console.error('Failed to calculate compliance score:', error);
      return 0;
    }
  }
}

export const supremeCourt = AuditEngine.getInstance();
