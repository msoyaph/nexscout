    -- =====================================================
    -- UPDATE PIPELINE AUTOMATION TRIGGER COSTS (2.5x)
    -- =====================================================
    -- Updates the hardcoded costs in pipeline trigger function
    -- =====================================================

    CREATE OR REPLACE FUNCTION trigger_ai_pipeline_on_stage_change()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
    v_ai_settings RECORD;
    v_operating_mode TEXT;
    v_mode_preferences JSONB;
    v_should_trigger BOOLEAN := false;
    BEGIN
    -- Get user's AI settings
    SELECT * INTO v_ai_settings
    FROM ai_automation_settings
    WHERE user_id = NEW.user_id;
    
    -- Get operating mode
    SELECT operating_mode, mode_preferences INTO v_operating_mode, v_mode_preferences
    FROM operating_mode_settings
    WHERE user_id = NEW.user_id;
    
    -- Default to manual if not set
    v_operating_mode := COALESCE(v_operating_mode, 'manual');
    
    -- Don't trigger automation in manual mode
    IF v_operating_mode = 'manual' THEN
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
        40,  -- Updated from 15
        25   -- Updated from 8
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
            55,  -- Updated from 20
            35   -- Updated from 10
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
            70,  -- Updated from 25
            45   -- Updated from 12
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
            90,  -- Updated from 30
            55   -- Updated from 15
        );
        v_should_trigger := true;
        END IF;
    END IF;
    
    -- Stage: ready_to_close → Queue close_deal (AUTOPILOT ONLY)
    IF NEW.pipeline_stage = 'ready_to_close' AND v_ai_settings.auto_close_deals THEN
        -- Only autopilot mode can auto-close
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
            150, -- Updated from 50
            85   -- Updated from 25
            );
            v_should_trigger := true;
        END IF;
        END IF;
    END IF;
    
    -- Create notification if automation was triggered
    IF v_should_trigger THEN
        INSERT INTO notifications (user_id, type, title, message, link, icon)
        VALUES (
        NEW.user_id,
        'automation_queued',
        'AI Automation Queued',
        format('Automation queued for %s (stage: %s)', NEW.name, NEW.pipeline_stage),
        format('/prospects/%s', NEW.id),
        'bot'
        );
    END IF;
    
    RETURN NEW;
    END;
    $$;

    -- Success message
    DO $$ 
    BEGIN 
    RAISE NOTICE '✅ Pipeline trigger costs updated to 2.5x pricing!';
    RAISE NOTICE '📊 New costs: Smart Scan 25E+15C, Follow-Up 40E+25C, Qualify 55E+35C';
    END $$;




