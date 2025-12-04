/*
  # Fix Public Chatbot Training Data Access

  1. Security
    - Add policy allowing anon users to read training data
    - Only for active training data
    - Required for public chatbot engine to work
*/

-- Allow public (anon) users to read active training data
CREATE POLICY "Public can view active training data"
  ON public_chatbot_training_data
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);
