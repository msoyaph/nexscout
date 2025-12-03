import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Issue {
  category: 'environment' | 'service' | 'third_party' | 'database';
  item: string;
  message: string;
  fix: string;
}

interface DiagnosticResult {
  ready: boolean;
  env: Record<string, boolean>;
  services: Record<string, string>;
  thirdParty: Record<string, string>;
  database: Record<string, string>;
  issues: Issue[];
  timestamp: string;
}

interface UseScanReadinessReturn {
  ready: boolean;
  loading: boolean;
  issues: Issue[];
  envIssues: Issue[];
  serviceIssues: Issue[];
  dbIssues: Issue[];
  thirdPartyIssues: Issue[];
  diagnostics: DiagnosticResult | null;
  refresh: () => Promise<void>;
  error: string | null;
}

export function useScanReadiness(autoCheck = true): UseScanReadinessReturn {
  const [ready, setReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        throw new Error('User not authenticated');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-diagnostics`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Diagnostics check failed: ${response.status}`);
      }

      const result: DiagnosticResult = await response.json();

      setDiagnostics(result);
      setReady(result.ready);
    } catch (err: any) {
      console.error('Scan readiness check error:', err);
      setError(err.message || 'Failed to check scan readiness');
      setReady(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoCheck) {
      fetchDiagnostics();
    }
  }, [autoCheck, fetchDiagnostics]);

  const issues = diagnostics?.issues || [];
  const envIssues = issues.filter((i) => i.category === 'environment');
  const serviceIssues = issues.filter((i) => i.category === 'service');
  const dbIssues = issues.filter((i) => i.category === 'database');
  const thirdPartyIssues = issues.filter((i) => i.category === 'third_party');

  return {
    ready,
    loading,
    issues,
    envIssues,
    serviceIssues,
    dbIssues,
    thirdPartyIssues,
    diagnostics,
    refresh: fetchDiagnostics,
    error,
  };
}
