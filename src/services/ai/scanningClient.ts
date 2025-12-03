import { supabase } from '../../lib/supabase';
import { API_CONFIG, StartScanPayload, ScanStatusResponse, ScanResultsResponse } from '../../config/apiConfig';

export class ScanningClient {
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async startScan(payload: StartScanPayload): Promise<{ scanId: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        status: 'processing',
        sources: {
          type: payload.sourceType,
          url: payload.url,
          tags: payload.tags,
        },
        total_items: 0,
      })
      .select()
      .single();

    if (error || !scan) throw new Error('Failed to create scan');

    if (payload.sourceType === 'url' && payload.url) {
      try {
        await this.makeRequest(`${API_CONFIG.endpoints.scan.start}`, {
          method: 'POST',
          body: JSON.stringify({
            scan_id: scan.id,
            url: payload.url,
            tags: payload.tags,
          }),
        });
      } catch (err) {
        console.error('Failed to trigger scan processor:', err);
      }
    } else if (payload.sourceType === 'paste_text' && payload.rawText) {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/paste-scan-start`;
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            scanId: scan.id,
            rawText: payload.rawText,
          }),
        });
      } catch (err) {
        console.error('Failed to trigger paste scan processor:', err);
      }
    } else if ((payload.sourceType === 'screenshots' || payload.sourceType === 'files') && payload.files) {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-processor`;
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const formData = new FormData();
        formData.append('scanId', scan.id);
        formData.append('sourceType', payload.sourceType);
        payload.files.forEach((file) => {
          formData.append('files', file);
        });

        await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
      } catch (err) {
        console.error('Failed to trigger file scan processor:', err);
      }
    }

    return { scanId: scan.id };
  }

  async getScanStatus(scanId: string): Promise<ScanStatusResponse> {
    const { data: scan } = await supabase
      .from('scans')
      .select('status')
      .eq('id', scanId)
      .single();

    const { data: status } = await supabase
      .from('scan_status')
      .select('*')
      .eq('scan_id', scanId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const state = scan?.status === 'completed' ? 'completed' : scan?.status === 'failed' ? 'failed' : 'processing';

    return {
      scanId,
      state,
      currentStep: status?.step || 'extracting_text',
      progress: status?.percent || 0,
      message: status?.message,
    };
  }

  async getScanResults(scanId: string): Promise<ScanResultsResponse> {
    const { data: scan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    const { data: items } = await supabase
      .from('scan_processed_items')
      .select('*')
      .eq('scan_id', scanId)
      .order('score', { ascending: false });

    const prospects = (items || []).map((item) => ({
      id: item.id,
      name: item.name,
      score: item.score || 50,
      rank: (item.score >= 70 ? 'hot' : item.score >= 50 ? 'warm' : 'cold') as 'hot' | 'warm' | 'cold',
      summary: item.content || 'No summary available',
      tags: item.metadata?.signals || item.metadata?.keywords || [],
      metadata: item.metadata,
    }));

    const hotProspects = prospects.filter(p => p.rank === 'hot');
    const allInterests = prospects.flatMap(p => p.tags).filter(Boolean);
    const uniqueInterests = Array.from(new Set(allInterests));

    return {
      scanId,
      prospects,
      insights: {
        topHotProspects: hotProspects.slice(0, 3),
        commonInterests: uniqueInterests.slice(0, 6),
        intentSignals: ['Extra income interest', 'Business opportunity seeker', 'Insurance awareness', 'Financial planning'],
        engagementPatterns: ['Active on social media', 'Responds to messages', 'Shares business content'],
        personaClusters: [
          { label: 'Entrepreneurs', count: Math.floor(prospects.length * 0.3) },
          { label: 'OFW', count: Math.floor(prospects.length * 0.25) },
          { label: 'Professionals', count: Math.floor(prospects.length * 0.45) },
        ],
        aiStrategy: 'Lead with value proposition about passive income opportunities. Use Taglish messaging for better engagement. Focus on hot leads first.',
      },
      meta: {
        totalProspects: prospects.length,
        hotCount: scan?.hot_leads || 0,
        warmCount: scan?.warm_leads || 0,
        coldCount: scan?.cold_leads || 0,
        sourceTypes: [scan?.sources?.type || 'unknown'],
        startedAt: scan?.created_at || new Date().toISOString(),
        finishedAt: scan?.updated_at || new Date().toISOString(),
      },
    };
  }

  async saveScan(scanId: string): Promise<{ success: boolean }> {
    const { error } = await supabase
      .from('scans')
      .update({ saved: true })
      .eq('id', scanId);

    if (error) throw error;

    return { success: true };
  }

  async getScanList(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    dateRange?: { start: string; end: string };
  } = {}): Promise<{ scans: any[]; total: number }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (params.dateRange) {
      query = query
        .gte('created_at', params.dateRange.start)
        .lte('created_at', params.dateRange.end);
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: scans, error, count } = await query.range(from, to);

    if (error) throw error;

    return {
      scans: scans || [],
      total: count || 0,
    };
  }
}

export const scanningClient = new ScanningClient();
