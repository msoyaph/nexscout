import { supabase } from '../../lib/supabase';

export interface Scan {
  id: string;
  userId: string;
  createdAt: string;
  completedAt?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sources: {
    screenshots?: string[];
    files?: string[];
    text?: string[];
    social?: string[];
  };
  smartnessDelta: number;
  totalItems: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  prospectIds: string[];
  screenshotCount: number;
  fileCount: number;
  textCount: number;
  connectedAccountCount: number;
}

export async function createScan(userId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        user_id: userId,
        status: 'pending',
        sources: {},
        screenshot_count: 0,
        file_count: 0,
        text_count: 0,
        connected_account_count: 0
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error('Create scan error:', error);
    throw new Error(error.message || 'Failed to create scan');
  }
}

export async function updateScanCounts(
  scanId: string,
  counts: {
    screenshotCount?: number;
    fileCount?: number;
    textCount?: number;
    connectedAccountCount?: number;
  }
): Promise<void> {
  try {
    const updates: any = {};
    if (counts.screenshotCount !== undefined) updates.screenshot_count = counts.screenshotCount;
    if (counts.fileCount !== undefined) updates.file_count = counts.fileCount;
    if (counts.textCount !== undefined) updates.text_count = counts.textCount;
    if (counts.connectedAccountCount !== undefined) updates.connected_account_count = counts.connectedAccountCount;

    const totalItems = (counts.screenshotCount || 0) + (counts.fileCount || 0) + (counts.textCount || 0);
    updates.total_items = totalItems;

    const { error } = await supabase
      .from('scans')
      .update(updates)
      .eq('id', scanId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Update scan counts error:', error);
    throw new Error(error.message || 'Failed to update scan counts');
  }
}

export async function completeScan(
  scanId: string,
  results: {
    hotLeads: number;
    warmLeads: number;
    coldLeads: number;
    prospectIds: string[];
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('scans')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        hot_leads: results.hotLeads,
        warm_leads: results.warmLeads,
        cold_leads: results.coldLeads,
        prospect_ids: results.prospectIds
      })
      .eq('id', scanId);

    if (error) throw error;
  } catch (error: any) {
    console.error('Complete scan error:', error);
    throw new Error(error.message || 'Failed to complete scan');
  }
}

export async function getScan(scanId: string): Promise<Scan | null> {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      createdAt: data.created_at,
      completedAt: data.completed_at,
      status: data.status,
      sources: data.sources || {},
      smartnessDelta: data.smartness_delta || 0,
      totalItems: data.total_items || 0,
      hotLeads: data.hot_leads || 0,
      warmLeads: data.warm_leads || 0,
      coldLeads: data.cold_leads || 0,
      prospectIds: data.prospect_ids || [],
      screenshotCount: data.screenshot_count || 0,
      fileCount: data.file_count || 0,
      textCount: data.text_count || 0,
      connectedAccountCount: data.connected_account_count || 0
    };
  } catch (error) {
    console.error('Get scan error:', error);
    return null;
  }
}

export async function getAllScans(userId: string): Promise<Scan[]> {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(s => ({
      id: s.id,
      userId: s.user_id,
      createdAt: s.created_at,
      completedAt: s.completed_at,
      status: s.status,
      sources: s.sources || {},
      smartnessDelta: s.smartness_delta || 0,
      totalItems: s.total_items || 0,
      hotLeads: s.hot_leads || 0,
      warmLeads: s.warm_leads || 0,
      coldLeads: s.cold_leads || 0,
      prospectIds: s.prospect_ids || [],
      screenshotCount: s.screenshot_count || 0,
      fileCount: s.file_count || 0,
      textCount: s.text_count || 0,
      connectedAccountCount: s.connected_account_count || 0
    }));
  } catch (error) {
    console.error('Get all scans error:', error);
    return [];
  }
}

export async function calculateSmartness(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('calculate_smartness_score', {
      p_user_id: userId
    });

    if (error) throw error;
    return data || 0;
  } catch (error: any) {
    console.error('Calculate smartness error:', error);
    return 0;
  }
}

export async function getUserSmartness(userId: string): Promise<{
  score: number;
  precision: number;
  speed: number;
  learningDepth: number;
}> {
  try {
    const { data: smartnessData } = await supabase
      .from('ai_smartness')
      .select('smartness_score')
      .eq('user_id', userId)
      .maybeSingle();

    const score = smartnessData?.smartness_score || 0;

    const precision = Math.min(score * 0.9, 100);
    const speed = Math.min(score * 0.85, 100);
    const learningDepth = Math.min(score * 0.95, 100);

    return {
      score,
      precision: Math.round(precision),
      speed: Math.round(speed),
      learningDepth: Math.round(learningDepth)
    };
  } catch (error) {
    console.error('Get user smartness error:', error);
    return { score: 0, precision: 0, speed: 0, learningDepth: 0 };
  }
}

export async function connectSocialAccount(
  userId: string,
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok',
  accessToken?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform,
        connected: true,
        access_token: accessToken,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,platform'
      });

    if (error) throw error;
  } catch (error: any) {
    console.error('Connect social account error:', error);
    throw new Error(error.message || 'Failed to connect social account');
  }
}

export async function getSocialConnections(userId: string): Promise<{
  facebook: boolean;
  instagram: boolean;
  linkedin: boolean;
  twitter: boolean;
  tiktok: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('social_connections')
      .select('platform, connected')
      .eq('user_id', userId)
      .eq('connected', true);

    if (error) throw error;

    const connections = {
      facebook: false,
      instagram: false,
      linkedin: false,
      twitter: false,
      tiktok: false
    };

    data?.forEach(conn => {
      if (conn.platform in connections) {
        connections[conn.platform as keyof typeof connections] = conn.connected;
      }
    });

    return connections;
  } catch (error) {
    console.error('Get social connections error:', error);
    return {
      facebook: false,
      instagram: false,
      linkedin: false,
      twitter: false,
      tiktok: false
    };
  }
}
