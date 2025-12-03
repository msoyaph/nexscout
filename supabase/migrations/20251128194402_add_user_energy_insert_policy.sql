/*
  # Add INSERT policy for user_energy table

  1. Security
    - Add policy allowing authenticated users to insert their own energy records
    - This fixes the energy conversion feature where new users need energy records created

  ## Problem
  - Users trying to convert coins to energy fail with RLS violation
  - No INSERT policy exists on user_energy table
  - Code tries to auto-create energy record but gets blocked by RLS

  ## Solution
  - Add INSERT policy for authenticated users
  - Only allow inserting their own user_id
  - Prevents users from creating energy records for other users
*/

-- Add INSERT policy for user_energy
CREATE POLICY "Users can insert own energy record"
  ON user_energy
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
