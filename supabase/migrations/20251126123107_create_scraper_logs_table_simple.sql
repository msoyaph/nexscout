/*
  # Create Scraper Logs Table

  ## Changes
  Creates a table to track all scraping activity for admin monitoring and debugging.

  ## Tables
  - scraper_logs: Tracks all scraping requests and responses
    - id: Primary key
    - user_id: User who initiated the scrape
    - url: URL that was scraped
    - platform: Detected platform (facebook, instagram, twitter, linkedin, tiktok)
    - status: Success or error status
    - raw_html: Full HTML response (can be large)
    - raw_text: Extracted text content
    - links_count: Number of links extracted
    - error: Error message if failed
    - created_at: Timestamp of scrape

  ## Security
  - RLS enabled
  - Users can only view their own logs
*/

CREATE TABLE IF NOT EXISTS scraper_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  platform text,
  status text NOT NULL DEFAULT 'pending',
  raw_html text,
  raw_text text,
  links_count integer DEFAULT 0,
  error text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scraper_logs_user_id ON scraper_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_platform ON scraper_logs(platform);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_status ON scraper_logs(status);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_created_at ON scraper_logs(created_at DESC);

ALTER TABLE scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scraper logs"
  ON scraper_logs FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own scraper logs"
  ON scraper_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));