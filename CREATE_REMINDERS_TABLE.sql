-- Create prospect_reminders table
CREATE TABLE IF NOT EXISTS public.prospect_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prospect_id uuid NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  reminder_date timestamptz NOT NULL,
  notes text,
  is_completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE public.prospect_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reminders"
  ON public.prospect_reminders
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prospect_reminders_user_id ON public.prospect_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reminders_prospect_id ON public.prospect_reminders(prospect_id);
CREATE INDEX IF NOT EXISTS idx_prospect_reminders_reminder_date ON public.prospect_reminders(reminder_date);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_prospect_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospect_reminders_timestamp
  BEFORE UPDATE ON public.prospect_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_prospect_reminders_updated_at();

COMMENT ON TABLE public.prospect_reminders IS 'Stores follow-up reminders for prospects';
