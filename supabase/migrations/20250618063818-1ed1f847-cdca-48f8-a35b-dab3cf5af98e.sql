
-- Add device_pairings table for tracking app installations
CREATE TABLE IF NOT EXISTS device_pairings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pairing_code TEXT NOT NULL UNIQUE,
  subscription_id TEXT,
  device_type TEXT NOT NULL,
  app_type TEXT DEFAULT 'standard',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_device_pairings_pairing_code ON device_pairings(pairing_code);
CREATE INDEX IF NOT EXISTS idx_device_pairings_user_id ON device_pairings(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pairings_app_type ON device_pairings(app_type);
CREATE INDEX IF NOT EXISTS idx_device_pairings_expires_at ON device_pairings(expires_at);

-- Enable Row Level Security
ALTER TABLE device_pairings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own pairings" ON device_pairings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pairings" ON device_pairings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pairings" ON device_pairings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pairings" ON device_pairings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_device_pairings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER device_pairings_updated_at
    BEFORE UPDATE ON device_pairings
    FOR EACH ROW
    EXECUTE FUNCTION update_device_pairings_updated_at();
