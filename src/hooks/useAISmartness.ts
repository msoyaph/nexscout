import { useState, useEffect, useCallback } from 'react';
import { AISmartness } from '../config/apiConfig';
import { insightClient } from '../services/ai/insightClient';

interface UseAISmartnessReturn {
  smartness: AISmartness;
  isLoading: boolean;
  error: string | null;
  refreshSmartness: () => Promise<void>;
}

export function useAISmartness(): UseAISmartnessReturn {
  const [smartness, setSmartness] = useState<AISmartness>({
    overall: 29,
    precision: 75,
    speed: 82,
    learningDepth: 45,
    samplesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSmartness = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await insightClient.getAISmartness();
      setSmartness(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch AI smartness');
      console.error('Error fetching AI smartness:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSmartness();
  }, [fetchSmartness]);

  return {
    smartness,
    isLoading,
    error,
    refreshSmartness: fetchSmartness,
  };
}
