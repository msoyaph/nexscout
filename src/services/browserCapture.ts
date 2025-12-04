import { supabase } from '../lib/supabase';

export type CaptureType = 'friends_list' | 'post' | 'comments' | 'messages' | 'profile' | 'other';

export interface BrowserCapturePayload {
  htmlSnapshot: string;
  textContent: string;
  sourceUrl: string;
  captureType: CaptureType;
  metadata?: Record<string, any>;
}

export interface BrowserCaptureEvent {
  id: string;
  userId: string;
  scanId?: string;
  htmlSnapshot: string;
  textContent: string;
  sourceUrl: string;
  captureType: CaptureType;
  metadata: Record<string, any>;
  createdAt: string;
}

export class BrowserCapture {
  static async captureEvent(
    payload: BrowserCapturePayload,
    scanId?: string
  ): Promise<BrowserCaptureEvent> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('browser_capture_events')
      .insert({
        user_id: user.id,
        scan_id: scanId,
        html_snapshot: payload.htmlSnapshot,
        text_content: payload.textContent,
        source_url: payload.sourceUrl,
        capture_type: payload.captureType,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id,
      userId: data.user_id,
      scanId: data.scan_id,
      htmlSnapshot: data.html_snapshot,
      textContent: data.text_content,
      sourceUrl: data.source_url,
      captureType: data.capture_type,
      metadata: data.metadata,
      createdAt: data.created_at,
    };
  }

  static async getCapturesForScan(scanId: string): Promise<BrowserCaptureEvent[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('browser_capture_events')
      .select('*')
      .eq('scan_id', scanId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch browser captures:', error);
      return [];
    }

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      scanId: item.scan_id,
      htmlSnapshot: item.html_snapshot,
      textContent: item.text_content,
      sourceUrl: item.source_url,
      captureType: item.capture_type,
      metadata: item.metadata,
      createdAt: item.created_at,
    }));
  }

  static extractTextFromCapture(event: BrowserCaptureEvent): string {
    return event.textContent || '';
  }

  static parseCapture(event: BrowserCaptureEvent): {
    names: string[];
    posts: string[];
    comments: string[];
  } {
    const text = event.textContent;
    const lines = text.split('\n').filter(l => l.trim());

    const names: string[] = [];
    const posts: string[] = [];
    const comments: string[] = [];

    for (const line of lines) {
      const nameMatch = line.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*$/);
      if (nameMatch) {
        names.push(nameMatch[1]);
        continue;
      }

      if (line.length > 50 && !line.includes('mutual friend')) {
        if (line.includes('commented') || line.includes('replied')) {
          comments.push(line);
        } else {
          posts.push(line);
        }
      }
    }

    return { names, posts, comments };
  }
}
