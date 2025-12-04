import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  processScreenshotBatch,
  processFileBatch,
  processTextBatch,
  computeSmartness,
  fetchRecentScans,
  UploadBatchResult,
  SmartnessData,
  RecentScan
} from '../services/scanning/smartScanner';

export function useSmartScanner() {
  const { user } = useAuth();
  const [smartness, setSmartness] = useState<SmartnessData>({
    uploadsCount: 0,
    uniqueSources: 0,
    smartnessScore: 0,
    level: 'Beginner',
    subtitle: 'Your AI is still learning.'
  });
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSmartness();
      loadRecentScans();
    }
  }, [user]);

  const loadSmartness = async () => {
    if (!user) return;
    try {
      const data = await computeSmartness(user.id);
      setSmartness(data);
    } catch (err: any) {
      console.error('Failed to load smartness:', err);
    }
  };

  const loadRecentScans = async () => {
    if (!user) return;
    try {
      const scans = await fetchRecentScans(user.id, 10);
      setRecentScans(scans);
    } catch (err: any) {
      console.error('Failed to load recent scans:', err);
    }
  };

  const uploadScreenshots = async (files: File[]): Promise<UploadBatchResult | null> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const result = await processScreenshotBatch(files);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        loadSmartness();
        loadRecentScans();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      return result;
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setUploadProgress(0);
      return null;
    }
  };

  const uploadFiles = async (files: File[]): Promise<UploadBatchResult | null> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const result = await processFileBatch(files);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        loadSmartness();
        loadRecentScans();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      return result;
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setUploadProgress(0);
      return null;
    }
  };

  const uploadText = async (text: string): Promise<UploadBatchResult | null> => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 15, 90));
      }, 200);

      const result = await processTextBatch(text);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        loadSmartness();
        loadRecentScans();
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);

      return result;
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
      setUploadProgress(0);
      return null;
    }
  };

  const refreshSmartness = () => {
    loadSmartness();
  };

  const refreshRecentScans = () => {
    loadRecentScans();
  };

  return {
    smartness,
    recentScans,
    isUploading,
    uploadProgress,
    error,
    uploadScreenshots,
    uploadFiles,
    uploadText,
    refreshSmartness,
    refreshRecentScans
  };
}
