import { supabase } from '../../lib/supabase';
import { ScanStateMachine } from './stateMachine';
import { SourceType, ScanProgressEvent } from './types';

export async function startScan(
  userId: string,
  sourceType: SourceType,
  rawPayload: any,
  onProgress?: (event: ScanProgressEvent) => void
): Promise<string> {
  const scanId = crypto.randomUUID();

  const { data: source, error: sourceError } = await supabase
    .from('prospect_sources')
    .insert({
      id: crypto.randomUUID(),
      user_id: userId,
      source_type: sourceType,
      raw_payload: rawPayload,
      processed: false,
    })
    .select()
    .single();

  if (sourceError || !source) {
    throw new Error('Failed to create source');
  }

  await supabase.from('scan_queue').insert({
    scan_id: scanId,
    user_id: userId,
    source_id: source.id,
    priority: 5,
    status: 'pending',
  });

  const machine = new ScanStateMachine(scanId, userId, source.id, onProgress);

  machine.run().catch((error) => {
    console.error('Scan failed:', error);
  });

  return scanId;
}

export async function getScanStatus(scanId: string) {
  const { data: queueItem } = await supabase
    .from('scan_queue')
    .select('*')
    .eq('scan_id', scanId)
    .single();

  const { data: stateData } = await supabase
    .from('deep_scan_state_machine')
    .select('*')
    .eq('scan_id', scanId)
    .single();

  return {
    scanId,
    status: queueItem?.status || 'unknown',
    state: stateData?.current_state || 'IDLE',
    context: stateData?.context_snapshot || null,
    error: stateData?.error_message || null,
  };
}

export async function getProspectIntel(userId: string, prospectId: string) {
  const { data: entity } = await supabase
    .from('prospect_entities')
    .select('*')
    .eq('id', prospectId)
    .eq('user_id', userId)
    .single();

  const { data: intel } = await supabase
    .from('prospect_intel')
    .select('*')
    .eq('prospect_entity_id', prospectId)
    .eq('user_id', userId)
    .single();

  const { data: history } = await supabase
    .from('prospect_history')
    .select('*')
    .eq('prospect_entity_id', prospectId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return {
    entity,
    intel,
    history,
  };
}

export async function listProspects(userId: string) {
  const { data: entities } = await supabase
    .from('prospect_entities')
    .select('*, prospect_intel(*)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  return entities || [];
}

export async function searchProspects(userId: string, query: string) {
  const { data } = await supabase
    .from('prospect_entities')
    .select('*, prospect_intel(*)')
    .eq('user_id', userId)
    .or(
      `display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`
    )
    .order('updated_at', { ascending: false });

  return data || [];
}
