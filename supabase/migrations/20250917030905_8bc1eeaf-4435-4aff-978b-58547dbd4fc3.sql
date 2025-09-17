-- Create table required by create-payment function
CREATE TABLE IF NOT EXISTS public.checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS (service role used by edge function bypasses RLS)
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Optional: allow selecting a session by session_id for verification flows (no PII stored here)
CREATE POLICY "Read checkout session by session_id"
ON public.checkout_sessions
FOR SELECT
USING (true);
