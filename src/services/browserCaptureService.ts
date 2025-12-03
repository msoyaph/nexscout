import { supabase } from '../lib/supabase';

export interface BrowserCapture {
  id: string;
  user_id: string;
  capture_type: string;
  platform: string;
  source_url: string;
  html_snapshot: string | null;
  text_content: string | null;
  tags: string[];
  notes: string | null;
  extension_version: string | null;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

export interface BrowserExtensionToken {
  id: string;
  user_id: string;
  token: string;
  label: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export interface CaptureFilters {
  platform?: string[];
  captureType?: string[];
  tags?: string[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export async function fetchBrowserCaptures(
  filters?: CaptureFilters,
  limit = 50,
  offset = 0
): Promise<{ captures: BrowserCapture[]; total: number }> {
  let query = supabase
    .from('browser_captures')
    .select('*, profiles!browser_captures_user_id_fkey(full_name, email)', { count: 'exact' });

  if (filters?.platform && filters.platform.length > 0) {
    query = query.in('platform', filters.platform);
  }

  if (filters?.captureType && filters.captureType.length > 0) {
    query = query.in('capture_type', filters.captureType);
  }

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters?.searchQuery) {
    query = query.or(
      `source_url.ilike.%${filters.searchQuery}%,text_content.ilike.%${filters.searchQuery}%`
    );
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching browser captures:', error);
    throw error;
  }

  return {
    captures: data as BrowserCapture[],
    total: count || 0,
  };
}

export async function fetchBrowserCaptureById(captureId: string): Promise<BrowserCapture | null> {
  const { data, error } = await supabase
    .from('browser_captures')
    .select('*, profiles!browser_captures_user_id_fkey(full_name, email)')
    .eq('id', captureId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching browser capture:', error);
    throw error;
  }

  return data as BrowserCapture | null;
}

export async function deleteBrowserCapture(captureId: string): Promise<boolean> {
  const { error } = await supabase.from('browser_captures').delete().eq('id', captureId);

  if (error) {
    console.error('Error deleting browser capture:', error);
    return false;
  }

  return true;
}

export async function fetchUserExtensionTokens(
  userId?: string
): Promise<BrowserExtensionToken[]> {
  let query = supabase
    .from('browser_extension_tokens')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching extension tokens:', error);
    throw error;
  }

  return data as BrowserExtensionToken[];
}

export async function generateExtensionToken(
  userId: string,
  label?: string
): Promise<BrowserExtensionToken | null> {
  const { data: tokenData, error: tokenError } = await supabase.rpc(
    'generate_browser_extension_token'
  );

  if (tokenError || !tokenData) {
    console.error('Error generating token:', tokenError);
    return null;
  }

  const { data, error } = await supabase
    .from('browser_extension_tokens')
    .insert({
      user_id: userId,
      token: tokenData,
      label: label || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating extension token:', error);
    return null;
  }

  return data as BrowserExtensionToken;
}

export async function toggleExtensionToken(
  tokenId: string,
  isActive: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('browser_extension_tokens')
    .update({ is_active: isActive })
    .eq('id', tokenId);

  if (error) {
    console.error('Error toggling extension token:', error);
    return false;
  }

  return true;
}

export async function deleteExtensionToken(tokenId: string): Promise<boolean> {
  const { error } = await supabase.from('browser_extension_tokens').delete().eq('id', tokenId);

  if (error) {
    console.error('Error deleting extension token:', error);
    return false;
  }

  return true;
}

export async function getCaptureStatistics(): Promise<{
  totalCaptures: number;
  capturesByPlatform: Record<string, number>;
  capturesByType: Record<string, number>;
  recentCaptureCount: number;
}> {
  const { data: captures, error } = await supabase
    .from('browser_captures')
    .select('platform, capture_type, created_at');

  if (error) {
    console.error('Error fetching capture statistics:', error);
    return {
      totalCaptures: 0,
      capturesByPlatform: {},
      capturesByType: {},
      recentCaptureCount: 0,
    };
  }

  const capturesByPlatform: Record<string, number> = {};
  const capturesByType: Record<string, number> = {};
  let recentCaptureCount = 0;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  captures.forEach((capture) => {
    capturesByPlatform[capture.platform] = (capturesByPlatform[capture.platform] || 0) + 1;
    capturesByType[capture.capture_type] = (capturesByType[capture.capture_type] || 0) + 1;

    if (capture.created_at >= oneDayAgo) {
      recentCaptureCount++;
    }
  });

  return {
    totalCaptures: captures.length,
    capturesByPlatform,
    capturesByType,
    recentCaptureCount,
  };
}
