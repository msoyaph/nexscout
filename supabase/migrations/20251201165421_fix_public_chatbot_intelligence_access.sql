/*
  # Fix Public Chatbot Intelligence Access

  1. Security
    - Add policies allowing anon users to read company profiles
    - Add policies allowing anon users to read products
    - Required for public chatbot AI engine to load intelligence
    - Only for public chatbot functionality
*/

-- Allow public (anon) users to read company profiles for chatbot
CREATE POLICY "Public can view company profiles for chatbot"
  ON company_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow public (anon) users to read active products for chatbot
CREATE POLICY "Public can view active products for chatbot"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (active = true);
