// PURPOSE: Track all user events and analytics data
// INPUT: Event name, user data, metadata
// OUTPUT: JSON success response
// NOTES: Batches events, captures device info, session tracking

import { supabase } from '../../lib/supabase';

interface EventProperties {
  [key: string]: any;
}

interface EventData {
  event_name: string;
  page?: string;
  element?: string;
  properties?: EventProperties;
  user_id?: string;
  session_id?: string;
  device_info?: any;
  subscription_tier?: string;
}

class AnalyticsEngineV2 {
  private eventQueue: EventData[] = [];
  private batchSize = 10;
  private batchTimeout = 5000; // 5 seconds
  private batchTimer: any = null;
  private sessionId: string;
  private deviceInfo: any;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.getDeviceInfo();
  }

  /**
   * Track any event
   */
  async trackEvent(
    eventName: string,
    properties?: EventProperties,
    page?: string,
    element?: string
  ): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .maybeSingle();

      const event: EventData = {
        event_name: eventName,
        page,
        element,
        properties,
        user_id: user.id,
        session_id: this.sessionId,
        device_info: this.deviceInfo,
        subscription_tier: profile?.subscription_tier || 'free',
      };

      this.eventQueue.push(event);

      if (this.eventQueue.length >= this.batchSize) {
        await this.flushEvents();
      } else {
        this.startBatchTimer();
      }

      return { success: true };
    } catch (error) {
      console.error('Analytics tracking error:', error);
      return { success: false };
    }
  }

  /**
   * Flush all queued events to database
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await supabase.from('analytics_events_v2').insert(
        eventsToSend.map(event => ({
          user_id: event.user_id,
          session_id: event.session_id,
          event_name: event.event_name,
          page: event.page,
          element: event.element,
          properties: event.properties || {},
          device_info: event.device_info,
          subscription_tier: event.subscription_tier,
          timestamp: new Date().toISOString(),
        }))
      );
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flushEvents();
    }, this.batchTimeout);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   */
  private getDeviceInfo(): any {
    return {
      user_agent: navigator.userAgent,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      device_type: this.getDeviceType(),
      browser: this.getBrowser(),
      os: this.getOS(),
    };
  }

  /**
   * Detect device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Detect browser
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  /**
   * Detect OS
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  // ========================================
  // CONVENIENCE METHODS (60+ event types)
  // ========================================

  async trackPageView(pageName: string): Promise<{ success: boolean }> {
    return this.trackEvent('page_viewed', { page: pageName }, pageName);
  }

  async trackSignup(method: string = 'email'): Promise<{ success: boolean }> {
    return this.trackEvent('user_signed_up', { method }, 'signup');
  }

  async trackLogin(method: string = 'email'): Promise<{ success: boolean }> {
    return this.trackEvent('user_logged_in', { method }, 'login');
  }

  async trackOnboardingCompleted(): Promise<{ success: boolean }> {
    return this.trackEvent('onboarding_completed', {}, 'onboarding');
  }

  async trackProspectScanned(prospectId: string, scanType: string): Promise<{ success: boolean }> {
    return this.trackEvent('prospect_scanned', { prospect_id: prospectId, scan_type: scanType }, 'scan');
  }

  async trackProspectViewed(prospectId: string): Promise<{ success: boolean }> {
    return this.trackEvent('prospect_viewed', { prospect_id: prospectId }, 'prospects');
  }

  async trackProspectSwiped(prospectId: string, direction: 'left' | 'right'): Promise<{ success: boolean }> {
    return this.trackEvent('prospect_swiped', { prospect_id: prospectId, direction }, 'prospects');
  }

  async trackAIMessageGenerated(prospectId: string, intent: string): Promise<{ success: boolean }> {
    return this.trackEvent('ai_message_generated', { prospect_id: prospectId, intent }, 'messaging');
  }

  async trackAIDeckGenerated(prospectId: string): Promise<{ success: boolean }> {
    return this.trackEvent('ai_deck_generated', { prospect_id: prospectId }, 'ai-tools');
  }

  async trackAISequenceGenerated(prospectId: string, sequenceType: string): Promise<{ success: boolean }> {
    return this.trackEvent('ai_sequence_generated', { prospect_id: prospectId, sequence_type: sequenceType }, 'ai-tools');
  }

  async trackPipelineStageChanged(prospectId: string, fromStage: string, toStage: string): Promise<{ success: boolean }> {
    return this.trackEvent('pipeline_stage_changed', { prospect_id: prospectId, from_stage: fromStage, to_stage: toStage }, 'pipeline');
  }

  async trackPaywallViewed(feature: string, requiredTier: string): Promise<{ success: boolean }> {
    return this.trackEvent('paywall_viewed', { feature, required_tier: requiredTier }, 'paywall');
  }

  async trackPricingViewed(): Promise<{ success: boolean }> {
    return this.trackEvent('pricing_page_viewed', {}, 'pricing');
  }

  async trackCheckoutStarted(tier: string, price: number): Promise<{ success: boolean }> {
    return this.trackEvent('checkout_started', { tier, price }, 'checkout');
  }

  async trackSubscriptionUpgraded(fromTier: string, toTier: string, price: number): Promise<{ success: boolean }> {
    return this.trackEvent('subscription_upgraded', { from_tier: fromTier, to_tier: toTier, price }, 'checkout');
  }

  async trackSubscriptionCancelled(tier: string): Promise<{ success: boolean }> {
    return this.trackEvent('subscription_cancelled', { tier }, 'settings');
  }

  async trackMissionStarted(missionId: string, missionType: string): Promise<{ success: boolean }> {
    return this.trackEvent('mission_started', { mission_id: missionId, mission_type: missionType }, 'missions');
  }

  async trackMissionCompleted(missionId: string, coinsEarned: number): Promise<{ success: boolean }> {
    return this.trackEvent('mission_completed', { mission_id: missionId, coins_earned: coinsEarned }, 'missions');
  }

  async trackCoinsPurchased(amount: number, price: number): Promise<{ success: boolean }> {
    return this.trackEvent('coins_purchased', { amount, price }, 'wallet');
  }

  async trackCoinsSpent(amount: number, feature: string): Promise<{ success: boolean }> {
    return this.trackEvent('coins_spent', { amount, feature }, feature);
  }

  async trackShare(contentType: string, platform: string, contentId?: string): Promise<{ success: boolean }> {
    return this.trackEvent('app_shared', { content_type: contentType, platform, content_id: contentId });
  }

  async trackReferralSignup(referralCode: string): Promise<{ success: boolean }> {
    return this.trackEvent('referral_signup', { referral_code: referralCode }, 'signup');
  }

  async trackLimitReached(feature: string, currentUsage: number, limit: number): Promise<{ success: boolean }> {
    return this.trackEvent('limit_reached', { feature, current_usage: currentUsage, limit }, feature);
  }

  async trackSupportTicketCreated(ticketId: string, category: string): Promise<{ success: boolean }> {
    return this.trackEvent('support_ticket_created', { ticket_id: ticketId, category }, 'support');
  }

  async trackTrainingCompleted(trainingId: string, topic: string): Promise<{ success: boolean }> {
    return this.trackEvent('training_completed', { training_id: trainingId, topic }, 'training');
  }

  async trackNotificationOpened(notificationId: string, notificationType: string): Promise<{ success: boolean }> {
    return this.trackEvent('notification_opened', { notification_id: notificationId, notification_type: notificationType }, 'notifications');
  }

  async trackSearchPerformed(query: string, resultsCount: number): Promise<{ success: boolean }> {
    return this.trackEvent('search_performed', { query, results_count: resultsCount });
  }

  async trackFilterApplied(filterType: string, filterValue: any): Promise<{ success: boolean }> {
    return this.trackEvent('filter_applied', { filter_type: filterType, filter_value: filterValue });
  }

  async trackErrorOccurred(errorType: string, errorMessage: string, page: string): Promise<{ success: boolean }> {
    return this.trackEvent('error_occurred', { error_type: errorType, error_message: errorMessage }, page);
  }

  /**
   * Track feature usage with time spent
   */
  async trackFeatureUsage(feature: string, timeSpentSeconds: number, actions?: string[]): Promise<{ success: boolean }> {
    return this.trackEvent('feature_used', {
      feature,
      time_spent_seconds: timeSpentSeconds,
      actions,
    });
  }

  /**
   * Track heatmap event (tap/click)
   */
  async trackHeatmapEvent(
    page: string,
    elementId: string,
    x: number,
    y: number,
    elementType: string
  ): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      await supabase.from('heatmap_events').insert({
        user_id: user.id,
        session_id: this.sessionId,
        page_name: page,
        element_id: elementId,
        element_type: elementType,
        x_coordinate: x,
        y_coordinate: y,
        x_ratio: x / viewportWidth,
        y_ratio: y / viewportHeight,
        viewport_width: viewportWidth,
        viewport_height: viewportHeight,
        device_type: this.deviceInfo.device_type,
      });

      return { success: true };
    } catch (error) {
      console.error('Heatmap tracking error:', error);
      return { success: false };
    }
  }

  /**
   * Track scroll depth
   */
  async trackScrollDepth(page: string, scrollDepthPercent: number, maxScrollDepth: number): Promise<{ success: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false };

      await supabase.from('heatmap_scroll_summary').insert({
        user_id: user.id,
        session_id: this.sessionId,
        page_name: page,
        scroll_depth_percent: scrollDepthPercent,
        max_scroll_depth: maxScrollDepth,
        device_type: this.deviceInfo.device_type,
      });

      return { success: true };
    } catch (error) {
      console.error('Scroll tracking error:', error);
      return { success: false };
    }
  }

  /**
   * Cleanup on unmount
   */
  async cleanup(): Promise<void> {
    await this.flushEvents();
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }
  }
}

// Export singleton instance
export const analyticsEngineV2 = new AnalyticsEngineV2();
