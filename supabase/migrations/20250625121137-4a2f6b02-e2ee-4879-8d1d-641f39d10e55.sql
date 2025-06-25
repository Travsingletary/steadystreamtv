
-- Create email_logs table for tracking sent emails
CREATE TABLE public.email_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing email logs (admin only for now)
CREATE POLICY "Admin can view email logs" 
  ON public.email_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create policy for inserting email logs (service role only)
CREATE POLICY "Service role can insert email logs" 
  ON public.email_logs 
  FOR INSERT 
  WITH CHECK (true);

-- Add index for better performance
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);
