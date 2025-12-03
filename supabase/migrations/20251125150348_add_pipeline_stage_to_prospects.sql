/*
  # Add Pipeline Stage to Prospects

  1. Changes
    - Add pipeline_stage column to prospects table
    - Add default stage as 'discover'
    - Add index for filtering by stage
    - Update existing prospects to have discover stage

  2. Pipeline Stages
    - discover: Initial prospecting stage
    - engage: Active engagement with prospect
    - closing: Ready to close the deal
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'prospects' AND column_name = 'pipeline_stage'
  ) THEN
    ALTER TABLE prospects ADD COLUMN pipeline_stage text DEFAULT 'discover';
    CREATE INDEX IF NOT EXISTS idx_prospects_pipeline_stage ON prospects(pipeline_stage);
    
    UPDATE prospects SET pipeline_stage = 'discover' WHERE pipeline_stage IS NULL;
    
    RAISE NOTICE 'Added pipeline_stage column to prospects table';
  END IF;
END $$;