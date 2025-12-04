/**
 * Hook for tracking file scan progress in real-time
 */

import { useState, useEffect } from 'react';
import { getScanBatchStatus } from '../services/fileIntelligence';

export interface ScanProgress {
  batchStatus: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  progressPercent: number;
  steps: Array<{
    name: string;
    completed: number;
    total: number;
    percent: number;
  }>;
  files: Array<{
    fileName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error?: string;
  }>;
}

export function useFileScanProgress(scanBatchId: string | null, pollingInterval = 2000) {
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanBatchId) {
      setLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;

    const fetchProgress = async () => {
      try {
        const status = await getScanBatchStatus(scanBatchId);

        if (!status.batch) {
          setError('Scan batch not found');
          return;
        }

        // Calculate step progress
        const steps = [
          { name: 'Extracting text', step: 'extract_text' },
          { name: 'Finding prospects', step: 'detect_entities' },
          { name: 'Generating insights', step: 'generate_chunks' },
          { name: 'Linking data', step: 'link_prospects' },
        ];

        const stepProgress = steps.map(({ name, step }) => {
          const stepItems = status.queueItems.filter(q => q.step === step);
          const completed = stepItems.filter(q => q.status === 'completed').length;
          const total = stepItems.length;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return { name, completed, total, percent };
        });

        // Map files
        const files = status.files.map(f => ({
          fileName: f.original_filename,
          status: f.status as any,
          error: f.error_message || undefined,
        }));

        setProgress({
          batchStatus: status.batch.status,
          totalFiles: status.batch.total_files,
          completedFiles: status.batch.completed_files,
          failedFiles: status.batch.failed_files,
          progressPercent: status.progress.percent,
          steps: stepProgress,
          files,
        });

        setLoading(false);

        // Stop polling if completed or failed
        if (status.batch.status === 'completed' || status.batch.status === 'failed') {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
      } catch (err: any) {
        console.error('Error fetching scan progress:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchProgress();

    // Start polling
    intervalId = setInterval(fetchProgress, pollingInterval);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [scanBatchId, pollingInterval]);

  return { progress, loading, error };
}
