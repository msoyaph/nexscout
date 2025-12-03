/**
 * NexScout Synergy Layer Engine
 *
 * The central "glue" that connects all engines together.
 * Every meaningful event flows through here and triggers appropriate engines.
 */

import { supabase } from '../../lib/supabase';
import { sifeEngine } from '../sife/sifeEngine';

export type SynergyEventType =
  | 'prospect.scanned'
  | 'prospect.deep_scanned'
  | 'prospect.updated'
  | 'chatbot.message'
  | 'chatbot.session_started'
  | 'chatbot.session_closed'
  | 'deal.closed'
  | 'deal.lost'
  | 'meeting.booked'
  | 'meeting.completed'
  | 'meeting.missed'
  | 'onboarding.milestone_reached'
  | 'onboarding.completed'
  | 'subscription.upgraded'
  | 'subscription.downgraded'
  | 'subscription.cancelled'
  | 'energy.low'
  | 'energy.depleted'
  | 'coins.low'
  | 'coins.depleted'
  | 'product.added'
  | 'product.pitched'
  | 'product.purchased'
  | 'company.intel_updated'
  | 'mission.completed'
  | 'pipeline.stage_changed'
  | 'follow_up.sent'
  | 'follow_up.responded';

export interface SynergyEventInput {
  userId: string;
  accountId?: string;
  eventType: SynergyEventType;
  sourceEngine: string;

  // Related entities
  prospectId?: string;
  companyId?: string;
  productId?: string;
  conversationId?: string;
  pipelineStage?: string;

  // Financial
  revenueAmount?: number;
  currency?: string;

  // Resources
  energyCost?: number;
  coinCost?: number;

  // Additional context
  metadata?: Record<string, any>;
}

export interface SynergyLink {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  relation: string;
  weight?: number;
  metadata?: Record<string, any>;
}

export class SynergyLayerEngine {
  /**
   * Main entry point - called by any engine when something important happens
   */
  async handleEvent(input: SynergyEventInput): Promise<{ success: boolean; eventId: string }> {
    try {
      const {
        userId,
        accountId,
        eventType,
        sourceEngine,
        prospectId,
        companyId,
        productId,
        conversationId,
        pipelineStage,
        revenueAmount,
        currency = 'PHP',
        energyCost = 0,
        coinCost = 0,
        metadata = {},
      } = input;

      console.log('[SynergyLayer] Processing event:', {
        eventType,
        sourceEngine,
        userId,
        prospectId,
        revenueAmount,
      });

      // 1) Persist the core event
      const { data: eventData, error: eventError } = await supabase
        .from('synergy_events')
        .insert({
          user_id: userId,
          account_id: accountId || null,
          event_type: eventType,
          source_engine: sourceEngine,
          prospect_id: prospectId || null,
          company_id: companyId || null,
          product_id: productId || null,
          conversation_id: conversationId || null,
          pipeline_stage: pipelineStage || null,
          revenue_amount: revenueAmount || null,
          currency,
          energy_cost: energyCost,
          coin_cost: coinCost,
          metadata,
        })
        .select('id')
        .single();

      if (eventError) {
        console.error('[SynergyLayer] Error creating event:', eventError);
        throw eventError;
      }

      const eventId = eventData.id;

      // 2) Write cross-feature links
      await this.writeSynergyLinks({
        userId,
        eventId,
        eventType,
        prospectId,
        companyId,
        productId,
        conversationId,
      });

      // 3) Route to appropriate engines (async - don't block)
      this.routeToEngines(input, eventId).catch((err) => {
        console.error('[SynergyLayer] Error routing to engines:', err);
      });

      // 4) Send to SIFE for learning (async)
      sifeEngine.processEvent(input).catch((err) => {
        console.error('[SynergyLayer] Error in SIFE:', err);
      });

      console.log('[SynergyLayer] Event processed successfully:', eventId);

      return { success: true, eventId };
    } catch (error: any) {
      console.error('[SynergyLayer] Error handling event:', error);
      throw error;
    }
  }

  /**
   * Write relationship links between entities
   */
  private async writeSynergyLinks(args: {
    userId: string;
    eventId: string;
    eventType: SynergyEventType;
    prospectId?: string;
    companyId?: string;
    productId?: string;
    conversationId?: string;
  }): Promise<void> {
    const { userId, eventId, eventType, prospectId, companyId, productId, conversationId } = args;

    const links: SynergyLink[] = [];

    // Link event to prospect
    if (prospectId) {
      links.push({
        fromType: 'event',
        fromId: eventId,
        toType: 'prospect',
        toId: prospectId,
        relation: 'event_for_prospect',
      });

      // Prospect <-> Conversation
      if (conversationId) {
        links.push({
          fromType: 'prospect',
          fromId: prospectId,
          toType: 'conversation',
          toId: conversationId,
          relation: 'has_conversation',
        });
      }

      // Prospect <-> Product
      if (productId) {
        const relation = this.getProductRelation(eventType);
        links.push({
          fromType: 'prospect',
          fromId: prospectId,
          toType: 'product',
          toId: productId,
          relation,
          weight: relation === 'purchased' ? 3.0 : relation === 'pitched' ? 2.0 : 1.0,
        });
      }

      // Prospect <-> Company
      if (companyId) {
        links.push({
          fromType: 'prospect',
          fromId: prospectId,
          toType: 'company',
          toId: companyId,
          relation: 'interested_in',
        });
      }
    }

    // Link product to company
    if (productId && companyId) {
      links.push({
        fromType: 'product',
        fromId: productId,
        toType: 'company',
        toId: companyId,
        relation: 'offered_by',
      });
    }

    if (links.length === 0) return;

    // Insert all links
    const linksToInsert = links.map((link) => ({
      user_id: userId,
      from_type: link.fromType,
      from_id: link.fromId,
      to_type: link.toType,
      to_id: link.toId,
      relation: link.relation,
      weight: link.weight || 1.0,
      metadata: link.metadata || {},
    }));

    const { error } = await supabase.from('synergy_links').insert(linksToInsert);

    if (error) {
      console.error('[SynergyLayer] Error writing links:', error);
    }
  }

  /**
   * Determine product relationship based on event type
   */
  private getProductRelation(eventType: SynergyEventType): string {
    if (eventType === 'product.purchased') return 'purchased';
    if (eventType === 'product.pitched') return 'pitched';
    if (eventType === 'chatbot.message') return 'discussed';
    return 'viewed';
  }

  /**
   * Route event to appropriate engines based on routing rules
   */
  private async routeToEngines(input: SynergyEventInput, eventId: string): Promise<void> {
    try {
      const { eventType, userId } = input;

      // Get routing rules for this event type
      const { data: rules } = await supabase
        .from('synergy_routing_rules')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (!rules || rules.length === 0) {
        console.log('[SynergyLayer] No routing rules found');
        return;
      }

      // Find matching rules
      const matchingRules = rules.filter((rule) => {
        // Simple pattern matching (can be enhanced with regex)
        return (
          rule.event_type_pattern === eventType ||
          eventType.startsWith(rule.event_type_pattern.replace('.*', ''))
        );
      });

      console.log('[SynergyLayer] Found', matchingRules.length, 'matching rules for', eventType);

      // Execute each rule's target engines
      for (const rule of matchingRules) {
        for (const engineName of rule.target_engines || []) {
          await this.executeEngine(engineName, input, eventId, rule.is_async);
        }
      }
    } catch (error) {
      console.error('[SynergyLayer] Error routing to engines:', error);
    }
  }

  /**
   * Execute a specific engine
   */
  private async executeEngine(
    engineName: string,
    input: SynergyEventInput,
    eventId: string,
    isAsync: boolean
  ): Promise<void> {
    const startTime = Date.now();

    try {
      console.log('[SynergyLayer] Executing engine:', engineName);

      // Log execution start
      const { data: logData } = await supabase
        .from('synergy_engine_logs')
        .insert({
          synergy_event_id: eventId,
          target_engine: engineName,
          status: 'running',
          started_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      const logId = logData?.id;

      // Execute engine-specific logic
      const result = await this.callEngineMethod(engineName, input);

      // Log completion
      const duration = Date.now() - startTime;
      if (logId) {
        await supabase
          .from('synergy_engine_logs')
          .update({
            status: 'completed',
            success: true,
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            result_data: result || {},
          })
          .eq('id', logId);
      }

      console.log('[SynergyLayer] Engine completed:', engineName, `(${duration}ms)`);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('[SynergyLayer] Engine failed:', engineName, error);

      // Log failure
      await supabase.from('synergy_engine_logs').insert({
        synergy_event_id: eventId,
        target_engine: engineName,
        status: 'failed',
        success: false,
        error_message: error.message || 'Unknown error',
        duration_ms: duration,
      });
    }
  }

  /**
   * Call specific engine method based on event
   */
  private async callEngineMethod(
    engineName: string,
    input: SynergyEventInput
  ): Promise<Record<string, any>> {
    const { eventType, userId, prospectId, revenueAmount, energyCost, coinCost } = input;

    // Simple routing logic - can be enhanced with dynamic imports
    switch (engineName) {
      case 'roiEngine':
        if (eventType === 'deal.closed' && revenueAmount && prospectId) {
          return { action: 'record_deal', revenue: revenueAmount };
        }
        break;

      case 'gamificationEngine':
        return { action: 'award_points', eventType };

      case 'salesGenomeEngine':
        return { action: 'learn_from_event', eventType };

      case 'economyEngine':
        if (energyCost || coinCost) {
          return { action: 'apply_costs', energyCost, coinCost };
        }
        break;

      case 'upgradeNudgeEngine':
        if (eventType.includes('low') || eventType.includes('depleted')) {
          return { action: 'trigger_upgrade_nudge' };
        }
        break;

      default:
        return { action: 'acknowledged', engine: engineName };
    }

    return { action: 'no_action_needed' };
  }

  /**
   * Get event statistics for a user
   */
  async getEventStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ eventType: string; count: number; totalRevenue: number }[]> {
    let query = supabase
      .from('synergy_events')
      .select('event_type, revenue_amount')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data } = await query;

    if (!data) return [];

    // Aggregate by event type
    const stats: Record<string, { count: number; totalRevenue: number }> = {};

    for (const event of data) {
      if (!stats[event.event_type]) {
        stats[event.event_type] = { count: 0, totalRevenue: 0 };
      }
      stats[event.event_type].count++;
      stats[event.event_type].totalRevenue += event.revenue_amount || 0;
    }

    return Object.entries(stats).map(([eventType, { count, totalRevenue }]) => ({
      eventType,
      count,
      totalRevenue,
    }));
  }

  /**
   * Get link graph for an entity
   */
  async getLinkGraph(
    userId: string,
    entityType: string,
    entityId: string,
    maxDepth: number = 2
  ): Promise<SynergyLink[]> {
    const { data } = await supabase
      .from('synergy_links')
      .select('*')
      .eq('user_id', userId)
      .or(`from_type.eq.${entityType},from_id.eq.${entityId},to_type.eq.${entityType},to_id.eq.${entityId}`);

    if (!data) return [];

    return data.map((link) => ({
      fromType: link.from_type,
      fromId: link.from_id,
      toType: link.to_type,
      toId: link.to_id,
      relation: link.relation,
      weight: link.weight,
      metadata: link.metadata,
    }));
  }
}

// Export singleton instance
export const synergyLayer = new SynergyLayerEngine();
