-- Fix RLS policies for users_log table
-- This table seems to be for audit logging

-- Enable RLS on users_log table
ALTER TABLE IF EXISTS users_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own log entries
CREATE POLICY IF NOT EXISTS "Users can view own log entries"
  ON users_log FOR SELECT
  USING (auth.uid()::text = user_id::text);

-- Allow service role to insert/update log entries
CREATE POLICY IF NOT EXISTS "Service role can manage log entries"
  ON users_log FOR ALL
  USING (auth.role() = 'service_role');

-- Allow admins to view all log entries
CREATE POLICY IF NOT EXISTS "Admins can view all log entries"
  ON users_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );