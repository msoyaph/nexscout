-- =====================================================
-- SMART CALENDAR BOOKING SYSTEM (Calendly-style)
-- =====================================================
-- Complete calendar system with public booking pages,
-- AI chatbot integration, and availability management

-- =====================================================
-- 1. CALENDAR SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Public booking link
  booking_slug TEXT UNIQUE, -- e.g., "juandelacruz" → /book/juandelacruz
  is_booking_enabled BOOLEAN DEFAULT TRUE,
  
  -- Display settings
  display_name TEXT NOT NULL,
  welcome_message TEXT,
  profile_image_url TEXT,
  company_name TEXT,
  
  -- Timezone
  timezone TEXT DEFAULT 'Asia/Manila',
  
  -- Booking preferences
  min_notice_hours INTEGER DEFAULT 2, -- Minimum hours in advance
  max_days_advance INTEGER DEFAULT 30, -- Max days in future
  buffer_before_minutes INTEGER DEFAULT 0,
  buffer_after_minutes INTEGER DEFAULT 0,
  
  -- Confirmation settings
  confirmation_message TEXT,
  redirect_url TEXT, -- After booking
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_settings_user ON calendar_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_settings_slug ON calendar_settings(booking_slug);

-- =====================================================
-- 2. MEETING TYPES
-- =====================================================
CREATE TABLE IF NOT EXISTS meeting_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Meeting details
  name TEXT NOT NULL, -- e.g., "Quick Chat", "Discovery Call"
  description TEXT,
  duration_minutes INTEGER NOT NULL, -- 15, 30, 60, etc.
  color TEXT DEFAULT '#3B82F6', -- Hex color for calendar
  
  -- Meeting location
  location_type TEXT CHECK (location_type IN (
    'zoom',
    'google_meet',
    'phone',
    'in_person',
    'custom'
  )),
  location_details TEXT, -- Zoom link, phone number, address, etc.
  
  -- Price (optional)
  is_paid BOOLEAN DEFAULT FALSE,
  price_amount DECIMAL(10,2),
  price_currency TEXT DEFAULT 'PHP',
  
  -- Availability
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  
  -- Questions to ask
  custom_questions JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meeting_types_user ON meeting_types(user_id);
CREATE INDEX IF NOT EXISTS idx_meeting_types_active ON meeting_types(is_active);

-- =====================================================
-- 3. WEEKLY AVAILABILITY
-- =====================================================
CREATE TABLE IF NOT EXISTS weekly_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Day of week (0 = Sunday, 6 = Saturday)
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Time slots (multiple per day)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Linked to meeting type (optional, null = all types)
  meeting_type_id UUID REFERENCES meeting_types(id) ON DELETE CASCADE,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, day_of_week, start_time, meeting_type_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_availability_user ON weekly_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_availability_day ON weekly_availability(day_of_week);

-- =====================================================
-- 4. DATE OVERRIDES (Special availability or blocked dates)
-- =====================================================
CREATE TABLE IF NOT EXISTS date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Specific date
  override_date DATE NOT NULL,
  
  -- Type
  override_type TEXT CHECK (override_type IN ('available', 'unavailable')),
  
  -- If available, time slots
  time_slots JSONB DEFAULT '[]'::jsonb, -- [{"start": "09:00", "end": "12:00"}, ...]
  
  reason TEXT, -- "Vacation", "Conference", etc.
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_date_overrides_user ON date_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_date_overrides_date ON date_overrides(override_date);

-- =====================================================
-- 5. BOOKINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS calendar_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner (user who receives the booking)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meeting_type_id UUID NOT NULL REFERENCES meeting_types(id) ON DELETE CASCADE,
  
  -- Booking details
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'Asia/Manila',
  
  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  guest_notes TEXT,
  
  -- Custom question responses
  custom_responses JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'confirmed',
    'cancelled',
    'rescheduled',
    'completed',
    'no_show'
  )),
  
  -- Payment (if paid meeting)
  payment_status TEXT CHECK (payment_status IN (
    'pending',
    'paid',
    'failed',
    'refunded'
  )),
  payment_amount DECIMAL(10,2),
  
  -- Meeting link (generated Zoom, Google Meet, etc.)
  meeting_link TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Reminders sent
  reminder_24h_sent BOOLEAN DEFAULT FALSE,
  reminder_1h_sent BOOLEAN DEFAULT FALSE,
  
  -- Integration with prospects (optional)
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  
  -- Source tracking
  booking_source TEXT, -- 'direct', 'chatbot', 'email', 'messenger'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_bookings_user ON calendar_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_start ON calendar_bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_status ON calendar_bookings(status);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_guest_email ON calendar_bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_calendar_bookings_prospect ON calendar_bookings(prospect_id);

-- =====================================================
-- 6. BOOKING NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS booking_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES calendar_bookings(id) ON DELETE CASCADE,
  
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'booking_confirmed',
    'booking_cancelled',
    'booking_rescheduled',
    'reminder_24h',
    'reminder_1h',
    'follow_up'
  )),
  
  recipient_email TEXT NOT NULL,
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_notifications_booking ON booking_notifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_sent ON booking_notifications(sent_at);

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

-- calendar_settings
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view calendar settings by slug" ON calendar_settings;
CREATE POLICY "Public can view calendar settings by slug"
  ON calendar_settings FOR SELECT
  USING (TRUE); -- Public for booking pages

DROP POLICY IF EXISTS "Users can view own calendar settings" ON calendar_settings;
CREATE POLICY "Users can view own calendar settings"
  ON calendar_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own calendar settings" ON calendar_settings;
CREATE POLICY "Users can create own calendar settings"
  ON calendar_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own calendar settings" ON calendar_settings;
CREATE POLICY "Users can update own calendar settings"
  ON calendar_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- meeting_types
ALTER TABLE meeting_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active meeting types" ON meeting_types;
CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can manage own meeting types" ON meeting_types;
CREATE POLICY "Users can manage own meeting types"
  ON meeting_types FOR ALL
  USING (auth.uid() = user_id);

-- weekly_availability
ALTER TABLE weekly_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view availability" ON weekly_availability;
CREATE POLICY "Public can view availability"
  ON weekly_availability FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can manage own availability" ON weekly_availability;
CREATE POLICY "Users can manage own availability"
  ON weekly_availability FOR ALL
  USING (auth.uid() = user_id);

-- date_overrides
ALTER TABLE date_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view date overrides" ON date_overrides;
CREATE POLICY "Public can view date overrides"
  ON date_overrides FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Users can manage own date overrides" ON date_overrides;
CREATE POLICY "Users can manage own date overrides"
  ON date_overrides FOR ALL
  USING (auth.uid() = user_id);

-- calendar_bookings
ALTER TABLE calendar_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON calendar_bookings;
CREATE POLICY "Users can view own bookings"
  ON calendar_bookings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can create bookings" ON calendar_bookings;
CREATE POLICY "Anyone can create bookings"
  ON calendar_bookings FOR INSERT
  WITH CHECK (TRUE); -- Public booking allowed

DROP POLICY IF EXISTS "Users can update own bookings" ON calendar_bookings;
CREATE POLICY "Users can update own bookings"
  ON calendar_bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- booking_notifications
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view notifications for their bookings" ON booking_notifications;
CREATE POLICY "Users can view notifications for their bookings"
  ON booking_notifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM calendar_bookings
      WHERE calendar_bookings.id = booking_notifications.booking_id
      AND calendar_bookings.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Function to get available time slots for a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_user_id UUID,
  p_meeting_type_id UUID,
  p_date DATE,
  p_timezone TEXT DEFAULT 'Asia/Manila'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_day_of_week INTEGER;
  v_availability RECORD;
  v_booking RECORD;
  v_slots JSONB := '[]'::jsonb;
  v_slot JSONB;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_start TIME;
  v_is_available BOOLEAN;
BEGIN
  -- Get day of week (0 = Sunday)
  v_day_of_week := EXTRACT(DOW FROM p_date);
  
  -- Get weekly availability for this day
  FOR v_availability IN
    SELECT start_time, end_time
    FROM weekly_availability
    WHERE user_id = p_user_id
      AND day_of_week = v_day_of_week
      AND is_active = TRUE
      AND (meeting_type_id IS NULL OR meeting_type_id = p_meeting_type_id)
    ORDER BY start_time
  LOOP
    v_start_time := v_availability.start_time;
    v_end_time := v_availability.end_time;
    
    -- Generate 30-minute slots (can be customized based on meeting type)
    v_slot_start := v_start_time;
    
    WHILE v_slot_start < v_end_time LOOP
      v_is_available := TRUE;
      
      -- Check if this slot conflicts with existing bookings
      FOR v_booking IN
        SELECT start_time, end_time
        FROM calendar_bookings
        WHERE user_id = p_user_id
          AND status = 'confirmed'
          AND DATE(start_time AT TIME ZONE p_timezone) = p_date
          AND (
            (v_slot_start::time, (v_slot_start + INTERVAL '30 minutes')::time)
            OVERLAPS
            (start_time::time, end_time::time)
          )
      LOOP
        v_is_available := FALSE;
        EXIT;
      END LOOP;
      
      -- Add slot if available
      IF v_is_available THEN
        v_slot := jsonb_build_object(
          'time', v_slot_start::text,
          'available', TRUE
        );
        v_slots := v_slots || v_slot;
      END IF;
      
      v_slot_start := v_slot_start + INTERVAL '30 minutes';
    END LOOP;
  END LOOP;
  
  RETURN v_slots;
END;
$$;

-- Function to create booking and update prospect engagement
CREATE OR REPLACE FUNCTION create_calendar_booking(
  p_user_id UUID,
  p_meeting_type_id UUID,
  p_start_time TIMESTAMPTZ,
  p_guest_name TEXT,
  p_guest_email TEXT,
  p_guest_phone TEXT,
  p_guest_notes TEXT,
  p_prospect_id UUID DEFAULT NULL,
  p_booking_source TEXT DEFAULT 'direct'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_duration INTEGER;
  v_end_time TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  -- Get meeting duration
  SELECT duration_minutes INTO v_duration
  FROM meeting_types
  WHERE id = p_meeting_type_id;
  
  IF v_duration IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid meeting type');
  END IF;
  
  v_end_time := p_start_time + (v_duration || ' minutes')::interval;
  
  -- Create booking
  INSERT INTO calendar_bookings (
    user_id,
    meeting_type_id,
    start_time,
    end_time,
    guest_name,
    guest_email,
    guest_phone,
    guest_notes,
    prospect_id,
    booking_source,
    status
  ) VALUES (
    p_user_id,
    p_meeting_type_id,
    p_start_time,
    v_end_time,
    p_guest_name,
    p_guest_email,
    p_guest_phone,
    p_guest_notes,
    p_prospect_id,
    p_booking_source,
    'confirmed'
  )
  RETURNING id INTO v_booking_id;
  
  -- If prospect linked, update their engagement
  IF p_prospect_id IS NOT NULL THEN
    -- Log engagement event
    INSERT INTO engagement_events (
      prospect_id,
      user_id,
      event_type,
      channel_type,
      scoutscore_impact,
      engagement_impact,
      event_data
    ) VALUES (
      p_prospect_id,
      p_user_id,
      'meeting_scheduled',
      'calendar',
      15, -- +15 points for scheduling meeting
      'positive',
      jsonb_build_object(
        'booking_id', v_booking_id,
        'meeting_type_id', p_meeting_type_id,
        'scheduled_for', p_start_time
      )
    );
    
    -- Update prospect ScoutScore
    UPDATE prospects
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{scout_score}',
      to_jsonb(LEAST(100, GREATEST(0, COALESCE((metadata->>'scout_score')::integer, 50) + 15)))
    )
    WHERE id = p_prospect_id;
  END IF;
  
  v_result := jsonb_build_object(
    'success', TRUE,
    'booking_id', v_booking_id,
    'message', 'Booking created successfully'
  );
  
  RETURN v_result;
END;
$$;

-- =====================================================
-- 9. INITIALIZE DEFAULT CALENDAR SETTINGS
-- =====================================================

-- Trigger to create default calendar settings for new users
CREATE OR REPLACE FUNCTION initialize_calendar_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_slug TEXT;
  v_name TEXT;
  v_chatbot_id TEXT;
BEGIN
  -- Try to get universal user ID from chatbot_links
  SELECT chatbot_id INTO v_chatbot_id
  FROM chatbot_links
  WHERE user_id = NEW.id
  LIMIT 1;
  
  -- If found, use it as booking slug (universal ID across /chat/, /book/, /ref/)
  IF v_chatbot_id IS NOT NULL THEN
    v_slug := v_chatbot_id;
  ELSE
    -- Fallback: generate from email
    v_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]', '', 'g'));
    
    -- Add random suffix if slug exists
    WHILE EXISTS (SELECT 1 FROM calendar_settings WHERE booking_slug = v_slug) LOOP
      v_slug := v_slug || floor(random() * 1000)::text;
    END LOOP;
  END IF;
  
  -- Get display name from profiles table or metadata
  SELECT full_name INTO v_name
  FROM profiles
  WHERE id = NEW.id
  LIMIT 1;
  
  IF v_name IS NULL THEN
    v_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    );
  END IF;
  
  -- Create default calendar settings
  INSERT INTO calendar_settings (
    user_id,
    booking_slug,
    display_name,
    welcome_message,
    timezone
  ) VALUES (
    NEW.id,
    v_slug,
    v_name,
    'Welcome! Book a time to chat with me.',
    'Asia/Manila'
  );
  
  -- Create default meeting type
  INSERT INTO meeting_types (
    user_id,
    name,
    description,
    duration_minutes,
    location_type,
    location_details
  ) VALUES (
    NEW.id,
    '30-Minute Discovery Call',
    'Let''s get to know each other and discuss how I can help you.',
    30,
    'zoom',
    'Zoom link will be sent after booking'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_initialize_calendar_settings ON auth.users;
CREATE TRIGGER trigger_initialize_calendar_settings
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_calendar_settings();

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Smart Calendar System created successfully!';
  RAISE NOTICE '📅 Tables: calendar_settings, meeting_types, weekly_availability, date_overrides, calendar_bookings';
  RAISE NOTICE '🔗 Public booking: /book/[slug]';
  RAISE NOTICE '🤖 AI Chatbot integration ready';
  RAISE NOTICE '📧 Notification system ready';
END $$;

