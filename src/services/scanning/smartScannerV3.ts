import { supabase } from '../../lib/supabase';
import { computeSmartness } from './smartScanner';

export interface ScanSession {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  filesCount: number;
  textCount: number;
  socialSources: string[];
  smartnessScoreAtScan: number;
  totalProspectsFound: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface SessionProspect {
  id: string;
  sessionId: string;
  prospectName: string;
  prospectEmail?: string;
  prospectPhone?: string;
  scoreSnapshot: number;
  bucketSnapshot: 'hot' | 'warm' | 'cold';
  explanationTags: string[];
  painPoints: string[];
  personalityTraits: string[];
  sourcePlatform?: string;
  metadata: any;
}

export async function startScanSession(userId: string): Promise<string> {
  try {
    const { data: smartnessData } = await supabase
      .from('ai_smartness')
      .select('smartness_score')
      .eq('user_id', userId)
      .maybeSingle();

    const smartnessScore = smartnessData?.smartness_score || 0;

    const { data, error } = await supabase
      .from('scan_sessions')
      .insert({
        user_id: userId,
        status: 'pending',
        started_at: new Date().toISOString(),
        smartness_score_at_scan: smartnessScore
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error: any) {
    console.error('Start scan session error:', error);
    throw new Error(error.message || 'Failed to start scan session');
  }
}

export async function ingestScreenshots(sessionId: string, files: File[]): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const file of files) {
      const fileName = `${user.id}/${sessionId}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('scan-uploads')
        .getPublicUrl(fileName);

      await supabase.from('scan_session_files').insert({
        session_id: sessionId,
        file_url: urlData.publicUrl,
        file_type: 'screenshot',
        file_name: file.name,
        file_size: file.size,
        ocr_status: 'pending'
      });
    }

    await supabase
      .from('scan_sessions')
      .update({ files_count: files.length })
      .eq('id', sessionId);
  } catch (error: any) {
    console.error('Ingest screenshots error:', error);
    throw new Error(error.message || 'Failed to ingest screenshots');
  }
}

export async function ingestFiles(sessionId: string, files: File[]): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    for (const file of files) {
      const fileName = `${user.id}/${sessionId}/${Date.now()}_${file.name}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('scan-uploads')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('scan-uploads')
        .getPublicUrl(fileName);

      const fileType = file.name.endsWith('.csv') ? 'csv' :
                       file.name.endsWith('.json') ? 'json' : 'export';

      await supabase.from('scan_session_files').insert({
        session_id: sessionId,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
        ocr_status: 'pending'
      });

      if (file.type === 'text/csv' || file.type === 'text/plain') {
        const text = await file.text();
        await extractTextContent(sessionId, text, file.name);
      }
    }

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('files_count')
      .eq('id', sessionId)
      .single();

    await supabase
      .from('scan_sessions')
      .update({ files_count: (session?.files_count || 0) + files.length })
      .eq('id', sessionId);
  } catch (error: any) {
    console.error('Ingest files error:', error);
    throw new Error(error.message || 'Failed to ingest files');
  }
}

export async function ingestText(sessionId: string, text: string): Promise<void> {
  try {
    await supabase.from('scan_session_files').insert({
      session_id: sessionId,
      file_url: 'text://pasted',
      file_type: 'text',
      file_name: 'Pasted Text',
      extracted_text: text,
      ocr_status: 'completed'
    });

    await extractTextContent(sessionId, text, 'pasted-text');

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('text_count')
      .eq('id', sessionId)
      .single();

    await supabase
      .from('scan_sessions')
      .update({ text_count: (session?.text_count || 0) + 1 })
      .eq('id', sessionId);
  } catch (error: any) {
    console.error('Ingest text error:', error);
    throw new Error(error.message || 'Failed to ingest text');
  }
}

async function extractTextContent(sessionId: string, text: string, source: string): Promise<void> {
  const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;

  const prospects = new Set<string>();
  let match;

  while ((match = namePattern.exec(text)) !== null) {
    prospects.add(match[1]);
  }

  for (const name of prospects) {
    const score = Math.floor(Math.random() * 40) + 60;
    const bucket = score >= 85 ? 'hot' : score >= 70 ? 'warm' : 'cold';

    await supabase.from('scan_session_prospects').insert({
      session_id: sessionId,
      prospect_name: name,
      score_snapshot: score,
      bucket_snapshot: bucket,
      explanation_tags: ['extracted_from_text', source],
      pain_points: ['needs_assessment'],
      personality_traits: ['prospect'],
      source_platform: 'text'
    });
  }
}

export async function ingestFacebook(sessionId: string, accessToken?: string): Promise<void> {
  try {
    await supabase.from('scan_session_social_data').insert({
      session_id: sessionId,
      platform: 'facebook',
      raw_payload: { token: accessToken, timestamp: new Date().toISOString() }
    });

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('social_sources')
      .eq('id', sessionId)
      .single();

    const sources = session?.social_sources || [];
    if (!sources.includes('facebook')) {
      sources.push('facebook');
      await supabase
        .from('scan_sessions')
        .update({ social_sources: sources })
        .eq('id', sessionId);
    }
  } catch (error: any) {
    console.error('Ingest Facebook error:', error);
    throw new Error(error.message || 'Failed to ingest Facebook data');
  }
}

export async function ingestInstagram(sessionId: string, accessToken?: string): Promise<void> {
  try {
    await supabase.from('scan_session_social_data').insert({
      session_id: sessionId,
      platform: 'instagram',
      raw_payload: { token: accessToken, timestamp: new Date().toISOString() }
    });

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('social_sources')
      .eq('id', sessionId)
      .single();

    const sources = session?.social_sources || [];
    if (!sources.includes('instagram')) {
      sources.push('instagram');
      await supabase
        .from('scan_sessions')
        .update({ social_sources: sources })
        .eq('id', sessionId);
    }
  } catch (error: any) {
    console.error('Ingest Instagram error:', error);
    throw new Error(error.message || 'Failed to ingest Instagram data');
  }
}

export async function ingestLinkedIn(sessionId: string, accessToken?: string): Promise<void> {
  try {
    await supabase.from('scan_session_social_data').insert({
      session_id: sessionId,
      platform: 'linkedin',
      raw_payload: { token: accessToken, timestamp: new Date().toISOString() }
    });

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('social_sources')
      .eq('id', sessionId)
      .single();

    const sources = session?.social_sources || [];
    if (!sources.includes('linkedin')) {
      sources.push('linkedin');
      await supabase
        .from('scan_sessions')
        .update({ social_sources: sources })
        .eq('id', sessionId);
    }
  } catch (error: any) {
    console.error('Ingest LinkedIn error:', error);
    throw new Error(error.message || 'Failed to ingest LinkedIn data');
  }
}

export async function ingestTikTok(sessionId: string, accessToken?: string): Promise<void> {
  try {
    await supabase.from('scan_session_social_data').insert({
      session_id: sessionId,
      platform: 'tiktok',
      raw_payload: { token: accessToken, timestamp: new Date().toISOString() }
    });

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('social_sources')
      .eq('id', sessionId)
      .single();

    const sources = session?.social_sources || [];
    if (!sources.includes('tiktok')) {
      sources.push('tiktok');
      await supabase
        .from('scan_sessions')
        .update({ social_sources: sources })
        .eq('id', sessionId);
    }
  } catch (error: any) {
    console.error('Ingest TikTok error:', error);
    throw new Error(error.message || 'Failed to ingest TikTok data');
  }
}

export async function ingestTwitter(sessionId: string, accessToken?: string): Promise<void> {
  try {
    await supabase.from('scan_session_social_data').insert({
      session_id: sessionId,
      platform: 'twitter',
      raw_payload: { token: accessToken, timestamp: new Date().toISOString() }
    });

    const { data: session } = await supabase
      .from('scan_sessions')
      .select('social_sources')
      .eq('id', sessionId)
      .single();

    const sources = session?.social_sources || [];
    if (!sources.includes('twitter')) {
      sources.push('twitter');
      await supabase
        .from('scan_sessions')
        .update({ social_sources: sources })
        .eq('id', sessionId);
    }
  } catch (error: any) {
    console.error('Ingest Twitter error:', error);
    throw new Error(error.message || 'Failed to ingest Twitter data');
  }
}

export async function runExtractionAndScoring(sessionId: string): Promise<void> {
  try {
    await supabase
      .from('scan_sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: files } = await supabase
      .from('scan_session_files')
      .select('*')
      .eq('session_id', sessionId);

    for (const file of files || []) {
      if (file.extracted_text && file.ocr_status === 'completed') {
        await extractTextContent(sessionId, file.extracted_text, file.file_name);
      }
    }
  } catch (error: any) {
    console.error('Run extraction error:', error);
    throw new Error(error.message || 'Failed to run extraction');
  }
}

export async function finalizeScanSession(sessionId: string): Promise<void> {
  try {
    const { data: prospects } = await supabase
      .from('scan_session_prospects')
      .select('bucket_snapshot')
      .eq('session_id', sessionId);

    const hotCount = prospects?.filter(p => p.bucket_snapshot === 'hot').length || 0;
    const warmCount = prospects?.filter(p => p.bucket_snapshot === 'warm').length || 0;
    const coldCount = prospects?.filter(p => p.bucket_snapshot === 'cold').length || 0;
    const totalProspectsFound = prospects?.length || 0;

    await supabase
      .from('scan_sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        total_prospects_found: totalProspectsFound,
        hot_count: hotCount,
        warm_count: warmCount,
        cold_count: coldCount
      })
      .eq('id', sessionId);
  } catch (error: any) {
    console.error('Finalize scan error:', error);
    await supabase
      .from('scan_sessions')
      .update({ status: 'failed' })
      .eq('id', sessionId);
    throw new Error(error.message || 'Failed to finalize scan');
  }
}

export async function getScanSession(sessionId: string): Promise<ScanSession | null> {
  try {
    const { data, error } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      filesCount: data.files_count || 0,
      textCount: data.text_count || 0,
      socialSources: data.social_sources || [],
      smartnessScoreAtScan: data.smartness_score_at_scan || 0,
      totalProspectsFound: data.total_prospects_found || 0,
      hotCount: data.hot_count || 0,
      warmCount: data.warm_count || 0,
      coldCount: data.cold_count || 0,
      createdAt: data.created_at,
      completedAt: data.completed_at
    };
  } catch (error) {
    console.error('Get scan session error:', error);
    return null;
  }
}

export async function getSessionProspects(sessionId: string): Promise<SessionProspect[]> {
  try {
    const { data, error } = await supabase
      .from('scan_session_prospects')
      .select('*')
      .eq('session_id', sessionId)
      .order('score_snapshot', { ascending: false });

    if (error || !data) return [];

    return data.map(p => ({
      id: p.id,
      sessionId: p.session_id,
      prospectName: p.prospect_name || '',
      prospectEmail: p.prospect_email,
      prospectPhone: p.prospect_phone,
      scoreSnapshot: p.score_snapshot || 0,
      bucketSnapshot: p.bucket_snapshot || 'cold',
      explanationTags: p.explanation_tags || [],
      painPoints: p.pain_points || [],
      personalityTraits: p.personality_traits || [],
      sourcePlatform: p.source_platform,
      metadata: p.metadata || {}
    }));
  } catch (error) {
    console.error('Get session prospects error:', error);
    return [];
  }
}

export async function getAllScanSessions(userId: string): Promise<ScanSession[]> {
  try {
    const { data, error } = await supabase
      .from('scan_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map(s => ({
      id: s.id,
      userId: s.user_id,
      status: s.status,
      filesCount: s.files_count || 0,
      textCount: s.text_count || 0,
      socialSources: s.social_sources || [],
      smartnessScoreAtScan: s.smartness_score_at_scan || 0,
      totalProspectsFound: s.total_prospects_found || 0,
      hotCount: s.hot_count || 0,
      warmCount: s.warm_count || 0,
      coldCount: s.cold_count || 0,
      createdAt: s.created_at,
      completedAt: s.completed_at
    }));
  } catch (error) {
    console.error('Get all scan sessions error:', error);
    return [];
  }
}
