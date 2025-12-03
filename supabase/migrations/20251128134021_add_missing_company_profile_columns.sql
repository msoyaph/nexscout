/*
  # Add Missing Company Profile Columns

  1. New Columns
    - `value_proposition` (text) - Company value proposition
    - `achievements` (jsonb) - Array of company achievements
    - `mission` (text) - Company mission statement
    - `vision` (text) - Company vision statement
    - `culture` (text) - Company culture description
  
  2. Purpose
    - Support company intelligence features
    - Enable AI-generated content
    - Consolidate company data
*/

ALTER TABLE company_profiles
ADD COLUMN IF NOT EXISTS value_proposition text,
ADD COLUMN IF NOT EXISTS achievements jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS mission text,
ADD COLUMN IF NOT EXISTS vision text,
ADD COLUMN IF NOT EXISTS culture text;
