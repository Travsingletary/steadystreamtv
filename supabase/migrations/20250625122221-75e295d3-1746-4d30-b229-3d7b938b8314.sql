
-- Create token_monitoring_logs table for tracking monitoring activity
CREATE TABLE public.token_monitoring_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_snapshot JSONB NOT NULL,
  alerts_generated JSONB DEFAULT '[]'::jsonb,
  actions_taken JSONB DEFAULT '[]'::jsonb,
  monitored_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_errors table for error logging
CREATE TABLE public.system_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_token_monitoring_logs_monitored_at ON public.token_monitoring_logs(monitored_at DESC);
CREATE INDEX idx_system_errors_occurred_at ON public.system_errors(occurred_at DESC);
CREATE INDEX idx_system_errors_type ON public.system_errors(error_type);

-- Enable RLS on both tables
ALTER TABLE public.token_monitoring_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_errors ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role access
CREATE POLICY "Service role can manage token monitoring logs" 
  ON public.token_monitoring_logs 
  FOR ALL 
  USING (true);

CREATE POLICY "Service role can manage system errors" 
  ON public.system_errors 
  FOR ALL 
  USING (true);

-- Add trigger for updated_at timestamp on token_monitoring_logs
CREATE OR REPLACE FUNCTION public.update_token_monitoring_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_token_monitoring_logs_updated_at
    BEFORE UPDATE ON public.token_monitoring_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_token_monitoring_logs_updated_at();
