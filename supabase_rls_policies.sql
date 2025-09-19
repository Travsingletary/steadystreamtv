-- Supabase RLS Policies for SteadyStream TV
-- Run these commands in your Supabase SQL Editor

-- Enable RLS on the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow authenticated users to insert their own record
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Allow public read access for basic user info (optional - remove if you want strict privacy)
CREATE POLICY "Public users read access" ON users
  FOR SELECT USING (true);

-- If you have a subscriptions table, add these policies too:
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own subscriptions" ON subscriptions
--   FOR SELECT USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own subscriptions" ON subscriptions
--   FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own subscriptions" ON subscriptions
--   FOR UPDATE USING (auth.uid() = user_id);

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON users TO authenticated;
-- GRANT ALL ON subscriptions TO authenticated; -- Uncomment if you have this table