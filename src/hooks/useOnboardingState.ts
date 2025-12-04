import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUser } from './useUser';

export interface OnboardingStep {
  id: string;
  title: string;
  completed: boolean;
  route: string;
  estimatedMinutes: number;
}

export interface OnboardingStateData {
  progress: number;
  currentStep: string;
  steps: OnboardingStep[];
  risk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    reasons: string[];
  };
  nextBestAction: string;
  pendingReminder: any;
}

export const useOnboardingState = () => {
  const { user } = useUser();
  const [state, setState] = useState<OnboardingStateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchOnboardingState = async () => {
      try {
        setLoading(true);

        const { data: completionStatus } = await supabase.rpc(
          'get_onboarding_completion_status',
          { p_user_id: user.id }
        );

        const { data: riskScore } = await supabase.rpc(
          'calculate_onboarding_risk_score',
          { p_user_id: user.id }
        );

        const { data: journey } = await supabase
          .from('mentor_journey_state')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        const { data: reminder } = await supabase
          .from('onboarding_reminder_jobs')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const steps: OnboardingStep[] = [
          {
            id: 'company',
            title: 'Add my company',
            completed: completionStatus?.has_company_data || false,
            route: '/onboarding/company-setup',
            estimatedMinutes: 1
          },
          {
            id: 'products',
            title: 'Add my products/services',
            completed: completionStatus?.has_products || false,
            route: '/products/add',
            estimatedMinutes: 2
          },
          {
            id: 'chatbot',
            title: 'Activate AI Chatbot',
            completed: completionStatus?.chatbot_active || false,
            route: '/ai-chatbot',
            estimatedMinutes: 1
          },
          {
            id: 'scan',
            title: 'Run my first scan',
            completed: completionStatus?.has_scans || false,
            route: '/scan/upload',
            estimatedMinutes: 3
          }
        ];

        const completedSteps = steps.filter(s => s.completed).length;
        const progress = (completedSteps / steps.length) * 100;

        const currentStep = steps.find(s => !s.completed)?.id || 'completed';

        let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
        const score = riskScore || 0;
        if (score >= 76) riskLevel = 'critical';
        else if (score >= 51) riskLevel = 'high';
        else if (score >= 26) riskLevel = 'medium';

        const riskReasons: string[] = [];
        if (!completionStatus?.has_company_data)
          riskReasons.push('No company data');
        if (!completionStatus?.has_products) riskReasons.push('No products');
        if (!completionStatus?.chatbot_active)
          riskReasons.push('Chatbot not active');
        if (!completionStatus?.has_scans) riskReasons.push('No scans');

        let nextBestAction = 'Continue your setup';
        if (!completionStatus?.has_company_data)
          nextBestAction = 'Add your company information';
        else if (!completionStatus?.has_products)
          nextBestAction = 'Add your first product';
        else if (!completionStatus?.chatbot_active)
          nextBestAction = 'Activate your AI Chatbot';
        else if (!completionStatus?.has_scans)
          nextBestAction = 'Scan your first prospects';

        setState({
          progress,
          currentStep,
          steps,
          risk: {
            level: riskLevel,
            score,
            reasons: riskReasons
          },
          nextBestAction,
          pendingReminder: reminder || null
        });

        setError(null);
      } catch (err: any) {
        console.error('Error fetching onboarding state:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingState();
  }, [user]);

  return { state, loading, error };
};
