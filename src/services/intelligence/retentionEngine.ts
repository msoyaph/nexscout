// PURPOSE: Segment users and execute automated retention campaigns
// INPUT: User ID or batch processing
// OUTPUT: JSON with segment, recovery rate
// NOTES: 5 segments, 3 pre-built playbooks, target 30%+ recovery

import { supabase } from '../../lib/supabase';

type RetentionSegment = 'healthy' | 'at_risk_early' | 'at_risk_serious' | 'dormant' | 'churned';

interface SegmentResult {
  user_id: string;
  segment: RetentionSegment;
  days_inactive: number;
  last_session_date: string;
  recommended_playbook: string;
}

class RetentionEngine {
  /**
   * Update retention segments for all users
   */
  async updateRetentionSegments(): Promise<{ success: boolean; updated: number }> {
    try {
      const { data: users } = await supabase
        .from('profiles')
        .select('id, last_sign_in_at');

      if (!users) return { success: false, updated: 0 };

      for (const user of users) {
        const segment = await this.calculateSegment(user.id, user.last_sign_in_at);
        await supabase.from('retention_segments').upsert({
          user_id: user.id,
          segment: segment.segment,
          days_inactive: segment.days_inactive,
          last_session_date: segment.last_session_date,
          recommended_playbook: segment.recommended_playbook,
        });
      }

      return { success: true, updated: users.length };
    } catch (error) {
      console.error('Retention segmentation error:', error);
      return { success: false, updated: 0 };
    }
  }

  /**
   * Execute recovery campaigns based on segments
   */
  async executeRecoveryCampaigns(): Promise<{ success: boolean; campaigns_sent: number }> {
    try {
      const { data: atRiskUsers } = await supabase
        .from('retention_segments')
        .select('*, retention_playbooks!inner(*)').in('segment', ['at_risk_early', 'at_risk_serious', 'dormant']);

      if (!atRiskUsers) return { success: false, campaigns_sent: 0 };

      let sent = 0;
      for (const user of atRiskUsers) {
        const playbook = user.retention_playbooks;
        if (playbook) {
          await this.sendCampaign(user.user_id, playbook);
          sent++;
        }
      }

      return { success: true, campaigns_sent: sent };
    } catch (error) {
      console.error('Campaign execution error:', error);
      return { success: false, campaigns_sent: 0 };
    }
  }

  /**
   * Calculate user segment
   */
  private async calculateSegment(userId: string, lastSignIn: string | null): Promise<SegmentResult> {
    const now = Date.now();
    const lastLogin = lastSignIn ? new Date(lastSignIn).getTime() : now - 999 * 24 * 60 * 60 * 1000;
    const daysInactive = Math.floor((now - lastLogin) / (1000 * 60 * 60 * 24));

    let segment: RetentionSegment = 'healthy';
    let playbook = 'none';

    if (daysInactive >= 30) {
      segment = 'churned';
      playbook = 'dormant_revival';
    } else if (daysInactive >= 10) {
      segment = 'dormant';
      playbook = 'dormant_revival';
    } else if (daysInactive >= 6) {
      segment = 'at_risk_serious';
      playbook = 'win_back';
    } else if (daysInactive >= 3) {
      segment = 'at_risk_early';
      playbook = 'early_nudge';
    } else {
      segment = 'healthy';
      playbook = 'none';
    }

    return {
      user_id: userId,
      segment,
      days_inactive: daysInactive,
      last_session_date: lastSignIn || '',
      recommended_playbook: playbook,
    };
  }

  /**
   * Send campaign to user
   */
  private async sendCampaign(userId: string, playbook: any): Promise<void> {
    // Create notification
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'retention_campaign',
      title: playbook.title,
      message: playbook.message,
      priority: 'high',
    });

    // Grant bonus coins if playbook includes it
    if (playbook.bonus_coins && playbook.bonus_coins > 0) {
      await supabase.rpc('add_coins', {
        p_user_id: userId,
        p_amount: playbook.bonus_coins,
        p_reason: 'Retention campaign bonus',
      });
    }

    // Log campaign
    await supabase.from('retention_campaign_logs').insert({
      user_id: userId,
      playbook_id: playbook.id,
      campaign_type: playbook.playbook_type,
      sent_at: new Date().toISOString(),
    });
  }

  /**
   * Get recovery rate for playbooks
   */
  async getPlaybookPerformance(): Promise<any[]> {
    const { data: playbooks } = await supabase
      .from('retention_playbooks')
      .select('*');

    if (!playbooks) return [];

    const results = [];
    for (const playbook of playbooks) {
      const { count: sent } = await supabase
        .from('retention_campaign_logs')
        .select('*', { count: 'exact', head: true })
        .eq('playbook_id', playbook.id);

      const { count: recovered } = await supabase
        .from('retention_campaign_logs')
        .select('*', { count: 'exact', head: true })
        .eq('playbook_id', playbook.id)
        .eq('user_returned', true);

      results.push({
        playbook_name: playbook.playbook_name,
        campaigns_sent: sent || 0,
        users_recovered: recovered || 0,
        recovery_rate: sent && sent > 0 ? ((recovered || 0) / sent) * 100 : 0,
      });
    }

    return results;
  }
}

export const retentionEngine = new RetentionEngine();
