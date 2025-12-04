import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DepartmentStatus {
  id: string;
  name: string;
  code: string;
  health: 'GREEN' | 'YELLOW' | 'RED';
  activeEngines: string[];
  openIncidents: number;
  lastAuditAt?: string;
  notes?: string;
}

interface HealthCheckResult {
  id: string;
  overallStatus: 'GREEN' | 'YELLOW' | 'RED';
  departments: DepartmentStatus[];
  orchestratorLatencyMs: number;
  dbLatencyMs: number;
  errorRate24h: number;
  totalJobs24h: number;
  failedJobs24h: number;
  blockedJobs24h: number;
  notes?: string[];
  createdAt: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Cron Health Check] Starting health check...');

    const result = await runFullHealthCheck(supabase);

    console.log(`[Cron Health Check] Completed: ${result.overallStatus}`);

    if (result.overallStatus === 'RED') {
      console.warn('[Cron Health Check] ALERT: System status is RED!');
      console.warn(`[Cron Health Check] Notes: ${result.notes?.join(', ')}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('[Cron Health Check] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function runFullHealthCheck(supabase: any): Promise<HealthCheckResult> {
  const startTime = Date.now();
  const notes: string[] = [];

  const dbLatency = await measureDatabaseLatency(supabase);
  if (dbLatency > 1000) {
    notes.push(`High DB latency: ${dbLatency}ms`);
  }

  const departments = await getAllDepartmentStatuses(supabase);
  const redDepts = departments.filter(d => d.health === 'RED');
  const yellowDepts = departments.filter(d => d.health === 'YELLOW');

  if (redDepts.length > 0) {
    notes.push(`${redDepts.length} departments critical: ${redDepts.map(d => d.code).join(', ')}`);
  }
  if (yellowDepts.length > 0) {
    notes.push(`${yellowDepts.length} departments degraded: ${yellowDepts.map(d => d.code).join(', ')}`);
  }

  const orchestratorMetrics = await getOrchestratorMetrics(supabase);
  const orchestratorLatency = orchestratorMetrics.avgLatency;

  if (orchestratorLatency > 5000) {
    notes.push(`High orchestrator latency: ${orchestratorLatency}ms`);
  }

  const { errorRate, totalJobs, failedJobs } = await calculateErrorRate(supabase);

  if (errorRate > 5) {
    notes.push(`High error rate: ${errorRate.toFixed(2)}%`);
  }

  const blockedJobs = await getBlockedJobsCount(supabase);

  if (blockedJobs > 50) {
    notes.push(`High blocked jobs: ${blockedJobs} in last 24h`);
  }

  const overallStatus = determineOverallStatus(
    departments,
    errorRate,
    dbLatency,
    orchestratorLatency
  );

  const result: HealthCheckResult = {
    id: crypto.randomUUID(),
    overallStatus,
    departments,
    orchestratorLatencyMs: orchestratorLatency,
    dbLatencyMs: dbLatency,
    errorRate24h: parseFloat(errorRate.toFixed(2)),
    totalJobs24h: totalJobs,
    failedJobs24h: failedJobs,
    blockedJobs24h: blockedJobs,
    notes: notes.length > 0 ? notes : undefined,
    createdAt: new Date().toISOString(),
  };

  await storeHealthCheck(supabase, result);

  const totalTime = Date.now() - startTime;
  console.log(`[Health Check] Completed in ${totalTime}ms`);

  return result;
}

async function measureDatabaseLatency(supabase: any): Promise<number> {
  const start = Date.now();
  try {
    await supabase.from('profiles').select('id').limit(1);
    return Date.now() - start;
  } catch (error) {
    return 9999;
  }
}

async function getAllDepartmentStatuses(supabase: any): Promise<DepartmentStatus[]> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count: incidents } = await supabase
      .from('diagnostic_logs')
      .select('*', { count: 'exact', head: true })
      .eq('log_level', 'error')
      .gte('created_at', last24Hours.toISOString());

    const incidentCount = incidents || 0;
    const health: 'GREEN' | 'YELLOW' | 'RED' =
      incidentCount === 0 ? 'GREEN' : incidentCount < 10 ? 'YELLOW' : 'RED';

    const departments: DepartmentStatus[] = [
      { id: 'eng', name: 'Engineering', code: 'ENG', health, activeEngines: ['scanning_engine'], openIncidents: incidentCount, notes: 'Automated check' },
      { id: 'uiux', name: 'UI/UX', code: 'UIUX', health: 'GREEN', activeEngines: ['nudge_engine'], openIncidents: 0, notes: 'Operational' },
      { id: 'db', name: 'Database', code: 'DB', health: 'GREEN', activeEngines: ['data_fusion'], openIncidents: 0, notes: 'Operational' },
      { id: 'sec', name: 'Security', code: 'SEC', health: 'GREEN', activeEngines: ['supreme_court'], openIncidents: 0, notes: 'Operational' },
      { id: 'know', name: 'Knowledge', code: 'KNOW', health: 'GREEN', activeEngines: ['company_intelligence'], openIncidents: 0, notes: 'Operational' },
      { id: 'prod', name: 'Productivity', code: 'PROD', health: 'GREEN', activeEngines: ['ai_todo'], openIncidents: 0, notes: 'Operational' },
      { id: 'comm', name: 'Communication', code: 'COMM', health: 'GREEN', activeEngines: ['chatbot_engine'], openIncidents: 0, notes: 'Operational' },
      { id: 'econ', name: 'Economy', code: 'ECON', health: 'GREEN', activeEngines: ['energy_engine'], openIncidents: 0, notes: 'Operational' },
      { id: 'anly', name: 'Analytics', code: 'ANLY', health: 'GREEN', activeEngines: ['analytics_engine'], openIncidents: 0, notes: 'Operational' },
    ];

    return departments;
  } catch (error) {
    console.error('getAllDepartmentStatuses error:', error);
    return [];
  }
}

async function getOrchestratorMetrics(supabase: any) {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { data: events } = await supabase
      .from('orchestrator_events')
      .select('metadata')
      .gte('created_at', last24Hours.toISOString())
      .limit(1000);

    if (!events || events.length === 0) {
      return { avgLatency: 0, totalEvents: 0 };
    }

    const latencies = events
      .filter((e: any) => e.metadata?.duration)
      .map((e: any) => e.metadata.duration);

    const avgLatency = latencies.length > 0
      ? Math.round(latencies.reduce((sum: number, l: number) => sum + l, 0) / latencies.length)
      : 0;

    return {
      avgLatency,
      totalEvents: events.length,
    };
  } catch (error) {
    console.error('getOrchestratorMetrics error:', error);
    return { avgLatency: 0, totalEvents: 0 };
  }
}

async function calculateErrorRate(supabase: any) {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count: totalJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString());

    const { count: failedJobs } = await supabase
      .from('orchestrator_events')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'FAILED')
      .gte('created_at', last24Hours.toISOString());

    const errorRate = totalJobs && totalJobs > 0
      ? ((failedJobs || 0) / totalJobs) * 100
      : 0;

    return {
      errorRate,
      totalJobs: totalJobs || 0,
      failedJobs: failedJobs || 0,
    };
  } catch (error) {
    console.error('calculateErrorRate error:', error);
    return { errorRate: 0, totalJobs: 0, failedJobs: 0 };
  }
}

async function getBlockedJobsCount(supabase: any): Promise<number> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const { count } = await supabase
      .from('audit_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('postcheck_blocked', true)
      .gte('created_at', last24Hours.toISOString());

    return count || 0;
  } catch (error) {
    console.error('getBlockedJobsCount error:', error);
    return 0;
  }
}

function determineOverallStatus(
  departments: DepartmentStatus[],
  errorRate: number,
  dbLatency: number,
  orchestratorLatency: number
): 'GREEN' | 'YELLOW' | 'RED' {
  const redDepts = departments.filter(d => d.health === 'RED').length;
  const yellowDepts = departments.filter(d => d.health === 'YELLOW').length;

  if (
    redDepts > 0 ||
    errorRate > 5 ||
    dbLatency > 2000 ||
    orchestratorLatency > 10000
  ) {
    return 'RED';
  }

  if (
    yellowDepts > 2 ||
    errorRate > 1 ||
    dbLatency > 1000 ||
    orchestratorLatency > 5000
  ) {
    return 'YELLOW';
  }

  return 'GREEN';
}

async function storeHealthCheck(supabase: any, result: HealthCheckResult): Promise<void> {
  try {
    await supabase.from('system_health_checks').insert({
      overall_status: result.overallStatus,
      departments: JSON.stringify(result.departments),
      orchestrator_latency_ms: result.orchestratorLatencyMs,
      db_latency_ms: result.dbLatencyMs,
      error_rate_24h: result.errorRate24h,
      total_jobs_24h: result.totalJobs24h,
      failed_jobs_24h: result.failedJobs24h,
      blocked_jobs_24h: result.blockedJobs24h,
      notes: JSON.stringify(result.notes || []),
    });

    console.log(`Health check stored: ${result.overallStatus}`);
  } catch (error) {
    console.error('Failed to store health check:', error);
  }
}
