import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  createScan,
  updateScanCounts,
  completeScan,
  getAllScans,
  getUserSmartness,
  getSocialConnections,
  connectSocialAccount,
  Scan
} from '../services/scanning/scanService';

export function useSmartScannerV25() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [smartness, setSmartness] = useState({
    score: 0,
    precision: 0,
    speed: 0,
    learningDepth: 0
  });
  const [socialConnections, setSocialConnections] = useState({
    facebook: false,
    instagram: false,
    linkedin: false,
    twitter: false,
    tiktok: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const [smartnessData, connectionsData, scansData] = await Promise.all([
        getUserSmartness(user.id),
        getSocialConnections(user.id),
        getAllScans(user.id)
      ]);

      setSmartness(smartnessData);
      setSocialConnections(connectionsData);
      setScans(scansData);
    } catch (err: any) {
      console.error('Load user data error:', err);
      setError(err.message);
    }
  };

  const startNewScan = async (): Promise<string | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      const scanId = await createScan(user.id);
      await loadUserData();
      return scanId;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const uploadScanData = async (
    scanId: string,
    data: {
      screenshots?: File[];
      files?: File[];
      text?: string;
    }
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const screenshotCount = data.screenshots?.length || 0;
      const fileCount = data.files?.length || 0;
      const textCount = data.text ? 1 : 0;

      const connectedCount = Object.values(socialConnections).filter(Boolean).length;

      await updateScanCounts(scanId, {
        screenshotCount,
        fileCount,
        textCount,
        connectedAccountCount: connectedCount
      });

      await loadUserData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const finalizeScan = async (
    scanId: string,
    results: {
      hotLeads: number;
      warmLeads: number;
      coldLeads: number;
      prospectIds: string[];
    }
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await completeScan(scanId, results);
      await loadUserData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const connectSocial = async (
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok',
    token?: string
  ): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      await connectSocialAccount(user.id, platform, token);
      await loadUserData();
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await loadUserData();
  };

  return {
    scans,
    smartness,
    socialConnections,
    loading,
    error,
    startNewScan,
    uploadScanData,
    finalizeScan,
    connectSocial,
    refreshData
  };
}
