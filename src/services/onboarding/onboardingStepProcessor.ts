/**
 * Onboarding Step Processor
 * 
 * Unified wrapper for processing individual onboarding steps
 * Routes to appropriate engines and triggers aha moments/nudges
 */

import { supabase } from '../../lib/supabase';
import { sendOnboardingNudge } from '../nudges/nudgeEngineV3';
import { checkForAhaMoment, ahaMomentTriggers } from './ahaMomentEngine';

export interface StepResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

/**
 * Process individual onboarding step
 * Central router for all onboarding actions
 */
export async function processStep(
  userId: string,
  step: string,
  payload: any = {}
): Promise<StepResult> {
  try {
    console.log('[StepProcessor] Processing:', step, 'for user:', userId);

    switch (step) {
      // ========================================
      // PERSONA & INDUSTRY
      // ========================================
      case 'persona_detected':
      case 'industry_selected':
        await supabase
          .from('profiles')
          .update({
            persona_type: payload.persona || 'default',
            industry: payload.industry,
          })
          .eq('id', userId);
        
        await sendOnboardingNudge(userId, 'industry_selected', payload);
        
        return {
          success: true,
          message: 'Persona and industry saved'
        };

      // ========================================
      // PRODUCT SETUP
      // ========================================
      case 'product_added':
        // Create product record
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            name: payload.productName || payload.name || 'Product',
            short_description: payload.description || '',
            industry: payload.industry,
            price: payload.price || null,
          })
          .select()
          .single();

        if (productError && !productError.message.includes('duplicate')) {
          throw productError;
        }

        // Trigger aha moment (product profile auto-generated)
        await checkForAhaMoment(userId, 'lead_captured', {
          source: 'product_added',
          product_id: product?.id
        });
        
        await sendOnboardingNudge(userId, 'product_added', payload);
        
        return {
          success: true,
          message: 'Product profile created',
          data: product
        };

      // ========================================
      // COMPANY SETUP
      // ========================================
      case 'company_added':
        const { data: company, error: companyError } = await supabase
          .from('company_profiles')
          .upsert({
            user_id: userId,
            company_name: payload.companyName || payload.name || 'Company',
            industry: payload.industry,
            company_description: payload.description || '',
            tagline: payload.tagline || '',
          })
          .select()
          .single();

        if (companyError) {
          throw companyError;
        }

        await sendOnboardingNudge(userId, 'company_added', payload);
        
        return {
          success: true,
          message: 'Company profile created',
          data: company
        };

      // ========================================
      // CHATBOT SETUP
      // ========================================
      case 'chatbot_setup':
      case 'chatbot_deployed':
        await supabase
          .from('chatbot_settings')
          .upsert({
            user_id: userId,
            is_configured: true,
            configured_at: new Date().toISOString(),
            tone: payload.tone || 'professional',
          })
          .select()
          .single();

        // Trigger aha moment
        await checkForAhaMoment(userId, 'chatbot_test', {
          chatbot_id: payload.chatbotId
        });

        await sendOnboardingNudge(userId, 'chatbot_setup', payload);
        
        return {
          success: true,
          message: 'Chatbot configured and deployed'
        };

      // ========================================
      // PIPELINE SETUP
      // ========================================
      case 'pipeline_setup':
      case 'pipeline_ready':
        await supabase
          .from('profiles')
          .update({
            pipeline_configured: true,
          })
          .eq('id', userId);

        await sendOnboardingNudge(userId, 'pipeline_setup', payload);
        
        return {
          success: true,
          message: 'Pipeline configured'
        };

      // ========================================
      // FIRST WINS (Aha Moments)
      // ========================================
      case 'first_lead_captured':
        await ahaMomentTriggers.onFirstLead(userId, payload.leadId || payload.prospect_id);
        await sendOnboardingNudge(userId, 'first_lead_captured', payload);
        
        // Mark quick win achieved
        await supabase
          .from('onboarding_progress')
          .update({ quick_win: true })
          .eq('user_id', userId);
        
        return {
          success: true,
          message: 'First lead captured! Aha moment triggered.'
        };

      case 'first_followup_sent':
      case 'first_followup':
        await ahaMomentTriggers.onAutoFollowup(userId, payload.prospectId || payload.prospect_id);
        await sendOnboardingNudge(userId, 'first_followup_sent', payload);
        
        return {
          success: true,
          message: 'First followup sent! Aha moment triggered.'
        };

      case 'first_scan_complete':
      case 'deepscan_complete':
        await ahaMomentTriggers.onDeepScanComplete(userId, payload.score || 0);
        
        return {
          success: true,
          message: 'DeepScan complete! Aha moment triggered.'
        };

      case 'first_appointment_booked':
      case 'appointment_booked':
        await ahaMomentTriggers.onAppointmentBooked(userId, payload.appointmentId || payload.appointment_id);
        
        return {
          success: true,
          message: 'Appointment booked! Aha moment triggered.'
        };

      // ========================================
      // WIZARD COMPLETION
      // ========================================
      case 'wizard_completed':
      case 'onboarding_completed':
        await supabase
          .from('onboarding_progress')
          .update({
            stage: 'completed',
            quick_win: true,
            last_step: 'wizard_completed',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_step: 'complete',
          })
          .eq('id', userId);

        await sendOnboardingNudge(userId, 'wizard_completed', payload);
        
        return {
          success: true,
          message: 'Onboarding completed! Welcome to NexScout!'
        };

      // ========================================
      // UNKNOWN STEP
      // ========================================
      default:
        console.warn('[StepProcessor] Unknown step:', step);
        return {
          success: false,
          error: `Unknown onboarding step: ${step}`
        };
    }
  } catch (error: any) {
    console.error('[StepProcessor] Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process step'
    };
  }
}

/**
 * Get onboarding progress for user
 */
export async function getProgress(userId: string) {
  try {
    const { data: progress } = await supabase
      .from('onboarding_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: checklist } = await supabase
      .from('user_activation_checklist')
      .select(`
        *,
        activation_checklist_items (
          id,
          name,
          description,
          xp_reward,
          estimated_time_seconds
        )
      `)
      .eq('user_id', userId);

    const completedCount = checklist?.filter(c => c.completed).length || 0;
    const totalCount = checklist?.length || 0;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      stage: progress?.stage || 'not_started',
      lastStep: progress?.last_step,
      quickWinAchieved: progress?.quick_win || false,
      checklist: {
        total: totalCount,
        completed: completedCount,
        percentage,
        items: checklist || []
      }
    };
  } catch (error) {
    console.error('[OnboardingEngine] Error getting progress:', error);
    return null;
  }
}

