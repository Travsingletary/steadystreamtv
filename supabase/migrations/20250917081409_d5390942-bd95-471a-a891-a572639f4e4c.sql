-- Fix RLS policies for proper access
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;

-- Create proper RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
ON public.subscriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
ON public.subscriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
ON public.subscriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create proper RLS policies for payments
CREATE POLICY "Users can view their own payments" 
ON public.payments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments" 
ON public.payments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow service role to bypass RLS for webhook processing
CREATE POLICY "Service role can manage all subscriptions" 
ON public.subscriptions 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all payments" 
ON public.payments 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');