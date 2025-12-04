/*
  # Add Pipeline Stage Automation Triggers

  1. Purpose
    - Automatically trigger AI jobs when prospects move through pipeline stages
    - Respect user's operating mode (manual, hybrid, autopilot)
    - Enable complete autonomous sales pipeline

  2. Changes
    - Create function to handle pipeline stage changes
    - Create trigger on prospects table
    - Queue appropriate AI jobs based on stage and mode

  3. Trigger Logic
    - Manual mode: No automation
    - Hybrid mode: Selective automation (no auto-close)
    - Autopilot mode: Full automation

  4. Stage → Action Mapping
    - new → contacted: Queue smart_scan
    - contacted → qualified: Queue follow_up
    - qualified → interested: Queue nurture
    - interested → ready_to_close: Queue book_meeting
    - ready_to_close → won: Queue close_deal (autopilot only)
*/

-- Function to trigger AI pipeline jobs on stage change
CREATE OR REPLACE FUNCTION trigger_ai_pipeline_on_stage_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, extensions
LANGUAGE plpgsql
AS $$
DECLARE
  v_operating_mode text;
  v_mode_preferences jsonb;
  v_ai_settings record;
  v_should_trigger boolean;
BEGIN
  -- Only process if pipeline_stage actually changed
  IF OLD.pipeline_stage IS NOT DISTINCT FROM NEW.pipeline_stage THEN
    RETURN NEW;
  END IF;

  -- Don't trigger if stage is cleared/removed
  IF NEW.pipeline_stage IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get user's operating mode and preferences
  SELECT operating_mode, mode_preferences
  INTO v_operating_mode, v_mode_preferences
  FROM profiles
  WHERE id = NEW.user_id;

  -- Manual mode: No automation
  IF v_operating_mode = 'manual' THEN
    RETURN NEW;
  END IF;

  -- Get AI pipeline settings
  SELECT *
  INTO v_ai_settings
  FROM ai_pipeline_settings
  WHERE user_id = NEW.user_id
  LIMIT 1;

  -- No settings found: Skip
  IF v_ai_settings IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine which job to queue based on new stage
  v_should_trigger := false;

  -- Stage: contacted → Queue follow_up
  IF NEW.pipeline_stage = 'contacted' AND v_ai_settings.auto_follow_up THEN
    INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
    VALUES (
      NEW.user_id,
      NEW.id,
      'follow_up',
      'queued',
      jsonb_build_object(
        'trigger', 'stage_change',
        'from_stage', OLD.pipeline_stage,
        'to_stage', NEW.pipeline_stage,
        'delay_minutes', CASE WHEN v_operating_mode = 'autopilot' THEN 5 ELSE 30 END
      ),
      15,
      8
    );
    v_should_trigger := true;
  END IF;

  -- Stage: qualified → Queue nurture OR qualify
  IF NEW.pipeline_stage = 'qualified' THEN
    -- Queue qualification analysis if enabled
    IF v_ai_settings.auto_qualify THEN
      INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
      VALUES (
        NEW.user_id,
        NEW.id,
        'qualify',
        'queued',
        jsonb_build_object('trigger', 'stage_change', 'from_stage', OLD.pipeline_stage, 'to_stage', NEW.pipeline_stage),
        20,
        10
      );
      v_should_trigger := true;
    END IF;
    
    -- Queue nurture if enabled
    IF v_ai_settings.auto_nurture THEN
      INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
      VALUES (
        NEW.user_id,
        NEW.id,
        'nurture',
        'queued',
        jsonb_build_object('trigger', 'stage_change', 'from_stage', OLD.pipeline_stage, 'to_stage', NEW.pipeline_stage),
        25,
        12
      );
      v_should_trigger := true;
    END IF;
  END IF;

  -- Stage: interested → Queue book_meeting
  IF NEW.pipeline_stage = 'interested' AND v_ai_settings.auto_book_meetings THEN
    -- Check if hybrid mode allows automation
    IF v_operating_mode = 'autopilot' OR 
       (v_operating_mode = 'hybrid' AND (v_mode_preferences->'hybrid'->>'enable_pipeline_automation')::boolean) THEN
      INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
      VALUES (
        NEW.user_id,
        NEW.id,
        'book_meeting',
        'queued',
        jsonb_build_object('trigger', 'stage_change', 'from_stage', OLD.pipeline_stage, 'to_stage', NEW.pipeline_stage),
        30,
        15
      );
      v_should_trigger := true;
    END IF;
  END IF;

  -- Stage: ready_to_close → Queue close_deal (AUTOPILOT ONLY)
  IF NEW.pipeline_stage = 'ready_to_close' AND v_ai_settings.auto_close_deals THEN
    -- Only autopilot mode can auto-close
    -- Hybrid always requires approval
    IF v_operating_mode = 'autopilot' THEN
      -- Check if prospect score meets threshold
      IF NEW.scout_score >= COALESCE((v_mode_preferences->'autopilot'->>'auto_close_threshold')::integer, 70) THEN
        INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
        VALUES (
          NEW.user_id,
          NEW.id,
          'close_deal',
          'queued',
          jsonb_build_object(
            'trigger', 'stage_change',
            'from_stage', OLD.pipeline_stage,
            'to_stage', NEW.pipeline_stage,
            'scout_score', NEW.scout_score
          ),
          50,
          25
        );
        v_should_trigger := true;
      END IF;
    END IF;
  END IF;

  -- Stage: new → Queue smart_scan
  IF NEW.pipeline_stage = 'new' AND v_ai_settings.smart_scan_enabled THEN
    INSERT INTO ai_pipeline_jobs (user_id, prospect_id, job_type, status, config, energy_cost, coin_cost)
    VALUES (
      NEW.user_id,
      NEW.id,
      'smart_scan',
      'queued',
      jsonb_build_object('trigger', 'stage_change', 'priority', 'normal'),
      10,
      5
    );
    v_should_trigger := true;
  END IF;

  -- Log the trigger if any jobs were queued
  IF v_should_trigger THEN
    INSERT INTO ai_pipeline_actions (user_id, prospect_id, action_type, status, details)
    VALUES (
      NEW.user_id,
      NEW.id,
      'stage_change_triggered',
      'completed',
      jsonb_build_object(
        'from_stage', OLD.pipeline_stage,
        'to_stage', NEW.pipeline_stage,
        'operating_mode', v_operating_mode,
        'timestamp', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on prospects table
DROP TRIGGER IF EXISTS trigger_ai_pipeline_on_stage_change ON prospects;

CREATE TRIGGER trigger_ai_pipeline_on_stage_change
  AFTER UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_ai_pipeline_on_stage_change();

-- Add comments
COMMENT ON FUNCTION trigger_ai_pipeline_on_stage_change() IS 'Automatically queues AI pipeline jobs when prospect pipeline stage changes. Respects operating mode settings.';

-- Create notification on stage change (optional, for user awareness)
CREATE OR REPLACE FUNCTION notify_stage_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify on actual stage changes
  IF OLD.pipeline_stage IS DISTINCT FROM NEW.pipeline_stage THEN
    -- Create notification for stage advancement
    IF NEW.pipeline_stage IN ('qualified', 'interested', 'ready_to_close', 'won') THEN
      INSERT INTO notifications (user_id, type, title, message, data, read)
      VALUES (
        NEW.user_id,
        'pipeline_update',
        'Prospect Moved Forward',
        format('%s moved to %s stage', NEW.full_name, NEW.pipeline_stage),
        jsonb_build_object(
          'prospect_id', NEW.id,
          'from_stage', OLD.pipeline_stage,
          'to_stage', NEW.pipeline_stage
        ),
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create notification trigger
DROP TRIGGER IF EXISTS notify_stage_change ON prospects;

CREATE TRIGGER notify_stage_change
  AFTER UPDATE ON prospects
  FOR EACH ROW
  EXECUTE FUNCTION notify_stage_change();

COMMENT ON FUNCTION notify_stage_change() IS 'Sends notification when prospect advances through pipeline stages';
