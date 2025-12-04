import { supabase } from '../../lib/supabase';
import { API_CONFIG, AISmartness } from '../../config/apiConfig';

export class InsightClient {
  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;

    if (!token) {
      throw new Error('User not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAISmartness(): Promise<AISmartness> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    try {
      const { count: scansCount } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const { count: capturesCount } = await supabase
        .from('browser_captures')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const samplesCount = (scansCount || 0) + (capturesCount || 0);

      const baseScore = Math.min(20 + samplesCount * 2, 100);
      const precision = Math.min(60 + samplesCount * 1.5, 95);
      const speed = Math.min(70 + samplesCount * 1, 98);
      const learningDepth = Math.min(30 + samplesCount * 2.5, 90);

      return {
        overall: Math.round(baseScore),
        precision: Math.round(precision),
        speed: Math.round(speed),
        learningDepth: Math.round(learningDepth),
        samplesCount,
      };
    } catch (error) {
      console.error('Error fetching AI smartness:', error);

      return {
        overall: 29,
        precision: 75,
        speed: 82,
        learningDepth: 45,
        samplesCount: 0,
      };
    }
  }
}

export const insightClient = new InsightClient();
