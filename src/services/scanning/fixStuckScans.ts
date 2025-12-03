import { supabase } from '../../lib/supabase';

export async function fixStuckScans(userId: string): Promise<number> {
  try {
    const { data: stuckScans } = await supabase
      .from('scans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'processing')
      .order('created_at', { ascending: false });

    if (!stuckScans || stuckScans.length === 0) {
      return 0;
    }

    let fixedCount = 0;

    for (const scan of stuckScans) {
      const { data: latestStatus } = await supabase
        .from('scan_status')
        .select('*')
        .eq('scan_id', scan.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestStatus?.step === 'completed' || latestStatus?.step === 'COMPLETED' || latestStatus?.percent >= 100) {
        const { data: items } = await supabase
          .from('scan_processed_items')
          .select('score, metadata')
          .eq('scan_id', scan.id);

        if (items && items.length > 0) {
          const hotCount = items.filter(
            (i) => (i.metadata as any)?.bucket === 'hot' || i.score >= 70
          ).length;
          const warmCount = items.filter(
            (i) => (i.metadata as any)?.bucket === 'warm' || (i.score >= 50 && i.score < 70)
          ).length;
          const coldCount = items.filter(
            (i) => (i.metadata as any)?.bucket === 'cold' || i.score < 50
          ).length;

          await supabase
            .from('scans')
            .update({
              status: 'completed',
              total_items: items.length,
              hot_leads: hotCount,
              warm_leads: warmCount,
              cold_leads: coldCount,
              completed_at: new Date().toISOString(),
            })
            .eq('id', scan.id);

          fixedCount++;
          console.log(`Fixed scan ${scan.id}: ${items.length} prospects (${hotCount}H/${warmCount}W/${coldCount}C)`);
        }
      }
    }

    return fixedCount;
  } catch (error) {
    console.error('Fix stuck scans error:', error);
    return 0;
  }
}

export async function getScanProspects(scanId: string) {
  try {
    const { data: items } = await supabase
      .from('scan_processed_items')
      .select('*')
      .eq('scan_id', scanId)
      .order('score', { ascending: false });

    return items || [];
  } catch (error) {
    console.error('Get scan prospects error:', error);
    return [];
  }
}
