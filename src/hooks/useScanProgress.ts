import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface ScanProgressData {
  scanId: string;
  stage: 'queued' | 'extracting_text' | 'detecting_prospects' | 'scoring' | 'saving' | 'completed' | 'failed';
  percent: number;
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalProspects: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
}

export function useScanProgress(scanId: string | null) {
  const [progress, setProgress] = useState<ScanProgressData>({
    scanId: scanId || '',
    stage: 'queued',
    percent: 0,
    message: 'Initializing...',
    status: 'pending',
    totalProspects: 0,
    hotCount: 0,
    warmCount: 0,
    coldCount: 0,
  });

  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!scanId) return;

    const setupRealtimeSubscription = () => {
      const channel = supabase
        .channel(`scan_progress:${scanId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'scan_status',
            filter: `scan_id=eq.${scanId}`,
          },
          (payload) => {
            const newStatus = payload.new;
            setProgress((prev) => ({
              ...prev,
              stage: newStatus.step,
              percent: newStatus.percent || 0,
              message: newStatus.message || '',
            }));

            if (newStatus.step === 'completed') {
              setIsComplete(true);
              fetchFinalResults();
            } else if (newStatus.step === 'failed') {
              setError(newStatus.message || 'Scan failed');
            }
          }
        )
        .subscribe();

      channelRef.current = channel;
    };

    const pollProgress = async () => {
      try {
        const { data: latestStatus } = await supabase
          .from('scan_status')
          .select('*')
          .eq('scan_id', scanId)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestStatus) {
          setProgress((prev) => ({
            ...prev,
            stage: latestStatus.step,
            percent: latestStatus.percent || 0,
            message: latestStatus.message || '',
          }));

          if (latestStatus.step === 'completed') {
            setIsComplete(true);
            fetchFinalResults();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          } else if (latestStatus.step === 'failed') {
            setError(latestStatus.message || 'Scan failed');
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        }

        const { data: scanData } = await supabase
          .from('scans')
          .select('status, total_items, hot_leads, warm_leads, cold_leads')
          .eq('id', scanId)
          .maybeSingle();

        if (scanData) {
          setProgress((prev) => ({
            ...prev,
            status: scanData.status,
            totalProspects: scanData.total_items || 0,
            hotCount: scanData.hot_leads || 0,
            warmCount: scanData.warm_leads || 0,
            coldCount: scanData.cold_leads || 0,
          }));
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const fetchFinalResults = async () => {
      try {
        const { data: scanData } = await supabase
          .from('scans')
          .select('*')
          .eq('id', scanId)
          .single();

        if (scanData) {
          setProgress((prev) => ({
            ...prev,
            status: scanData.status,
            totalProspects: scanData.total_items || 0,
            hotCount: scanData.hot_leads || 0,
            warmCount: scanData.warm_leads || 0,
            coldCount: scanData.cold_leads || 0,
          }));
        }
      } catch (err) {
        console.error('Failed to fetch final results:', err);
      }
    };

    setupRealtimeSubscription();

    pollProgress();
    pollingIntervalRef.current = setInterval(pollProgress, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [scanId]);

  return {
    progress,
    isComplete,
    error,
  };
}
