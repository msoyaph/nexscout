import { useState, useEffect, useCallback, useRef } from 'react';
import { StartScanPayload, ScanStatus, ScanStep } from '../config/apiConfig';
import { scanningClient } from '../services/ai/scanningClient';
import { useAnalytics } from './useAnalytics';

interface UseScanRunnerReturn {
  scanId: string | null;
  status: ScanStatus;
  progress: number;
  currentStep: ScanStep;
  message?: string;
  startNewScan: (payload: StartScanPayload) => Promise<void>;
  refreshStatus: () => Promise<void>;
  cancelScan: () => void;
  isLoading: boolean;
  error: string | null;
}

export function useScanRunner(): UseScanRunnerReturn {
  const { trackEvent } = useAnalytics();
  const [scanId, setScanId] = useState<string | null>(null);
  const [status, setStatus] = useState<ScanStatus>('pending');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<ScanStep>('extracting_text');
  const [message, setMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = useCallback((scanIdToTrack: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const poll = async () => {
      if (!isMountedRef.current) return;

      try {
        const statusData = await scanningClient.getScanStatus(scanIdToTrack);

        if (!isMountedRef.current) return;

        setStatus(statusData.state);
        setProgress(statusData.progress);
        setCurrentStep(statusData.currentStep);
        setMessage(statusData.message);

        if (statusData.state === 'completed') {
          trackEvent('scan_completed', {
            scanId: scanIdToTrack,
            progress: statusData.progress,
          });

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          try {
            await scanningClient.getScanResults(scanIdToTrack);
          } catch (err) {
            console.error('Failed to prefetch results:', err);
          }
        } else if (statusData.state === 'failed') {
          trackEvent('scan_failed', {
            scanId: scanIdToTrack,
            error: statusData.error,
          });

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }

          setError(statusData.error || 'Scan failed');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    poll();
    pollingIntervalRef.current = setInterval(poll, 3000);
  }, [trackEvent]);

  const startNewScan = useCallback(async (payload: StartScanPayload) => {
    setIsLoading(true);
    setError(null);

    try {
      trackEvent('scan_started', {
        sourceType: payload.sourceType,
        tags: payload.tags,
      });

      const { scanId: newScanId } = await scanningClient.startScan(payload);

      if (!isMountedRef.current) return;

      setScanId(newScanId);
      setStatus('processing');
      setProgress(0);

      localStorage.setItem('nexscout_current_scan', newScanId);

      startPolling(newScanId);
    } catch (err: any) {
      if (!isMountedRef.current) return;

      setError(err.message || 'Failed to start scan');
      trackEvent('scan_start_failed', { error: err.message });
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [trackEvent, startPolling]);

  const refreshStatus = useCallback(async () => {
    if (!scanId) return;

    try {
      const statusData = await scanningClient.getScanStatus(scanId);

      if (!isMountedRef.current) return;

      setStatus(statusData.state);
      setProgress(statusData.progress);
      setCurrentStep(statusData.currentStep);
      setMessage(statusData.message);
    } catch (err: any) {
      console.error('Failed to refresh status:', err);
    }
  }, [scanId]);

  const cancelScan = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    setStatus('pending');
    setProgress(0);

    trackEvent('scan_cancelled', { scanId });
  }, [scanId, trackEvent]);

  return {
    scanId,
    status,
    progress,
    currentStep,
    message,
    startNewScan,
    refreshStatus,
    cancelScan,
    isLoading,
    error,
  };
}
