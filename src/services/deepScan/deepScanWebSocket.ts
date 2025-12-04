import { supabase } from '../../lib/supabase';

export interface DeepScanEvent {
  id: string;
  session_id: string;
  event_type: string;
  stage: string;
  progress: number;
  message: string;
  data: any;
  created_at: string;
}

export class DeepScanWebSocketClient {
  private channel: any;
  private sessionId: string;
  private userId: string;
  private onEvent: (event: DeepScanEvent) => void;
  private onStatusUpdate: (status: any) => void;

  constructor(
    sessionId: string,
    userId: string,
    onEvent: (event: DeepScanEvent) => void,
    onStatusUpdate: (status: any) => void
  ) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.onEvent = onEvent;
    this.onStatusUpdate = onStatusUpdate;
  }

  connect() {
    this.channel = supabase
      .channel(`deep_scan:${this.sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deep_scan_events',
          filter: `session_id=eq.${this.sessionId}`
        },
        (payload) => {
          if (payload.new) {
            this.onEvent(payload.new as DeepScanEvent);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deep_scan_sessions',
          filter: `id=eq.${this.sessionId}`
        },
        (payload) => {
          if (payload.new) {
            this.onStatusUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return this.channel;
  }

  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export async function subscribeToDeepScan(
  sessionId: string,
  userId: string,
  callbacks: {
    onEvent: (event: DeepScanEvent) => void;
    onStatusUpdate: (status: any) => void;
  }
): Promise<DeepScanWebSocketClient> {
  const client = new DeepScanWebSocketClient(
    sessionId,
    userId,
    callbacks.onEvent,
    callbacks.onStatusUpdate
  );

  client.connect();

  return client;
}

export async function getSessionStatus(sessionId: string) {
  const { data, error } = await supabase
    .from('deep_scan_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

export async function getSessionEvents(sessionId: string) {
  const { data, error } = await supabase
    .from('deep_scan_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSessionResults(sessionId: string) {
  const { data, error } = await supabase
    .from('deep_scan_results')
    .select('*')
    .eq('session_id', sessionId)
    .order('scout_score_v10', { ascending: false });

  if (error) throw error;
  return data || [];
}
