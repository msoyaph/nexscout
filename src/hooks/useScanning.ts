import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface ScanProgress {
  session_id: string;
  status: string;
  progress_percentage: number;
  current_stage?: string;
  prospects_found: number;
}

export interface ScanResult {
  session_id: string;
  prospects_found: number;
  hot_count: number;
  warm_count: number;
  cold_count: number;
  processing_time_ms: number;
  top_prospects: any[];
}

export function useScanning() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const initiateScan = async (options: any) => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsScanning(true);
    setError(null);
    setProgress(null);
    setResult(null);

    const sessionId = crypto.randomUUID();

    try {
      let textContent = options.text_content || '';

      if (options.image_file) {
        const stages = [
          { percentage: 5, stage: 'Reading image file' },
          { percentage: 15, stage: 'Extracting text from image' },
          { percentage: 30, stage: 'Detecting names' },
          { percentage: 45, stage: 'Detecting events' },
          { percentage: 60, stage: 'Classifying topics' },
          { percentage: 75, stage: 'Detecting interests' },
          { percentage: 90, stage: 'Scoring prospects' },
          { percentage: 100, stage: 'Preparing results' },
        ];

        let currentStage = 0;
        const interval = setInterval(() => {
          if (currentStage < stages.length) {
            setProgress({
              session_id: sessionId,
              status: 'processing',
              progress_percentage: stages[currentStage].percentage,
              current_stage: stages[currentStage].stage,
              prospects_found: 0,
            });
            currentStage++;
          } else {
            clearInterval(interval);
            const mockResult: ScanResult = {
              session_id: sessionId,
              prospects_found: 8,
              hot_count: 3,
              warm_count: 3,
              cold_count: 2,
              processing_time_ms: 6400,
              top_prospects: [],
            };
            setResult(mockResult);
            setIsScanning(false);
          }
        }, 800);
      } else {
        const stages = [
          { percentage: 10, stage: 'Extracting text' },
          { percentage: 20, stage: 'Detecting names' },
          { percentage: 35, stage: 'Detecting events' },
          { percentage: 50, stage: 'Classifying topics' },
          { percentage: 65, stage: 'Detecting interests' },
          { percentage: 80, stage: 'Scoring prospects' },
          { percentage: 100, stage: 'Preparing swipe cards' },
        ];

        let currentStage = 0;
        const interval = setInterval(() => {
          if (currentStage < stages.length) {
            setProgress({
              session_id: sessionId,
              status: 'processing',
              progress_percentage: stages[currentStage].percentage,
              current_stage: stages[currentStage].stage,
              prospects_found: 0,
            });
            currentStage++;
          } else {
            clearInterval(interval);
            const mockResult: ScanResult = {
              session_id: sessionId,
              prospects_found: 12,
              hot_count: 4,
              warm_count: 5,
              cold_count: 3,
              processing_time_ms: 5000,
              top_prospects: [],
            };
            setResult(mockResult);
            setIsScanning(false);
          }
        }, 800);
      }

      return sessionId;
    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to process scan. Please try again.');
      setIsScanning(false);
      return null;
    }
  };

  const reset = () => {
    setIsScanning(false);
    setProgress(null);
    setError(null);
    setResult(null);
  };

  return {
    initiateScan,
    isScanning,
    progress,
    error,
    result,
    reset,
  };
}

export function useProspects() {
  const { user } = useAuth();
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockProspects = [
    {
      id: '1',
      full_name: 'Sarah Martinez',
      username: '@sarahmartinez',
      platform: 'facebook',
      profile_link: '',
      is_unlocked: true,
      score: {
        scout_score: 95,
        bucket: 'hot',
        explanation_tags: [
          'Highly engaged with content',
          'Looking for additional income',
          'New baby signals financial planning',
          'Shows entrepreneurial mindset',
        ],
        engagement_score: 0.9,
        responsiveness_likelihood: 0.85,
        mlm_leadership_potential: 0.75,
      },
      profile: {
        dominant_topics: ['business', 'finance', 'family'],
        pain_points: ['financial', 'income'],
        life_events: ['New Baby'],
        total_events_count: 25,
      },
    },
    {
      id: '2',
      full_name: 'Michael Chen',
      username: '@mchen',
      platform: 'linkedin',
      profile_link: '',
      is_unlocked: false,
      score: {
        scout_score: 72,
        bucket: 'warm',
        explanation_tags: [
          'Moderate engagement',
          'Interested in business topics',
          'Recent job change',
        ],
        engagement_score: 0.7,
        responsiveness_likelihood: 0.65,
        mlm_leadership_potential: 0.6,
      },
      profile: {
        dominant_topics: ['career', 'business'],
        pain_points: ['opportunity'],
        life_events: ['Job Change'],
        total_events_count: 15,
      },
    },
    {
      id: '3',
      full_name: 'Jennifer Lopez',
      username: '@jlopez',
      platform: 'instagram',
      profile_link: '',
      is_unlocked: false,
      score: {
        scout_score: 88,
        bucket: 'hot',
        explanation_tags: [
          'Very active on social media',
          'Talks about business regularly',
          'Strong buying signals',
        ],
        engagement_score: 0.85,
        responsiveness_likelihood: 0.8,
        mlm_leadership_potential: 0.7,
      },
      profile: {
        dominant_topics: ['lifestyle', 'business', 'finance'],
        pain_points: ['income', 'security'],
        life_events: [],
        total_events_count: 30,
      },
    },
  ];

  const fetchTopProspects = async (limit: number = 20) => {
    if (!user) return;

    setLoading(true);
    setTimeout(() => {
      setProspects(mockProspects);
      setLoading(false);
    }, 500);
  };

  const fetchProspectsByBucket = async (bucket: string) => {
    if (!user) return;

    setLoading(true);
    setTimeout(() => {
      setProspects(mockProspects.filter(p => p.score.bucket === bucket));
      setLoading(false);
    }, 500);
  };

  const searchProspects = async (query: string) => {
    if (!user || !query) return;

    setLoading(true);
    setTimeout(() => {
      setProspects(
        mockProspects.filter(p =>
          p.full_name.toLowerCase().includes(query.toLowerCase())
        )
      );
      setLoading(false);
    }, 500);
  };

  const unlockProspect = async (prospectId: string) => {
    if (!user) return false;

    setProspects(prev =>
      prev.map(p => (p.id === prospectId ? { ...p, is_unlocked: true } : p))
    );
    return true;
  };

  const generateContent = async (prospectId: string, generationType: string, context?: any) => {
    if (!user) return null;

    return {
      content: 'Mock generated content for ' + generationType,
    };
  };

  return {
    prospects,
    loading,
    error,
    fetchTopProspects,
    fetchProspectsByBucket,
    searchProspects,
    unlockProspect,
    generateContent,
  };
}
