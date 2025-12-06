/**
 * useAutomation Hook
 * 
 * Comprehensive hook for running automations with premium features:
 * - Preview before send
 * - Progress tracking
 * - Success notifications
 * - Smart recommendations
 * - Quota management
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AutomationOrchestrator, AutomationRequest, AutomationProgress } from '../services/automation/automationOrchestrator';
import { RecommendationEngine, SmartRecommendation } from '../services/automation/recommendationEngine';
import { supabase } from '../lib/supabase';

export function useAutomation(prospectId: string, prospectName: string) {
  const { user } = useAuth();
  
  // Modal states
  const [showPreview, setShowPreview] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  
  // Data states
  const [previewData, setPreviewData] = useState<any>(null);
  const [progressData, setProgressData] = useState<AutomationProgress | null>(null);
  const [recommendation, setRecommendation] = useState<SmartRecommendation | null>(null);
  const [quotaStatus, setQuotaStatus] = useState<any>(null);
  
  // Loading states
  const [isRunning, setIsRunning] = useState(false);

  // Load recommendation on mount
  useEffect(() => {
    if (user?.id && prospectId) {
      loadRecommendation();
      loadQuotaStatus();
    }
  }, [user?.id, prospectId]);

  const loadRecommendation = async () => {
    if (!user) return;
    
    const rec = await AutomationOrchestrator.getSmartRecommendation(prospectId, user.id);
    setRecommendation(rec);
  };

  const loadQuotaStatus = async () => {
    if (!user) return;
    
    const { data } = await supabase.rpc('get_automation_quota_status', {
      p_user_id: user.id
    });
    
    setQuotaStatus(data);
  };

  /**
   * Run automation with full premium experience
   */
  const runAutomation = async (action: string) => {
    if (!user) return;
    
    setIsRunning(true);
    setShowProgress(true);

    const request: AutomationRequest = {
      action,
      prospectId,
      prospectName,
      userId: user.id,
    };

    const result = await AutomationOrchestrator.runAutomation(
      request,
      // Progress callback
      (progress) => {
        setProgressData(progress);
      },
      // Preview callback
      (content, quality, onApprove) => {
        setShowProgress(false);
        setPreviewData({
          content,
          quality,
          onApprove: async () => {
            setShowPreview(false);
            setShowProgress(true);
            await onApprove();
            setShowProgress(false);
            loadRecommendation(); // Reload for next action
            loadQuotaStatus(); // Update quota
          },
        });
        setShowPreview(true);
      }
    );

    setIsRunning(false);
    setShowProgress(false);

    return result;
  };

  /**
   * Run recommended automation with one click
   */
  const runRecommended = async () => {
    if (!recommendation) return;
    return await runAutomation(recommendation.action);
  };

  return {
    // States
    showPreview,
    showProgress,
    previewData,
    progressData,
    recommendation,
    quotaStatus,
    isRunning,
    
    // Actions
    runAutomation,
    runRecommended,
    setShowPreview,
    setShowProgress,
    
    // Utilities
    hasQuota: quotaStatus?.has_free_quota || false,
    quotaRemaining: quotaStatus?.quota_remaining || 0,
  };
}




