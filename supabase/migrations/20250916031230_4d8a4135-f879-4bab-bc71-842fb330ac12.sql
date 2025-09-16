-- Remove Stripe-related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Remove Stripe-related columns from checkout_sessions table
ALTER TABLE public.checkout_sessions 
DROP COLUMN IF EXISTS stripe_customer_id;

-- Remove Stripe-related columns from user_subscriptions table
ALTER TABLE public.user_subscriptions 
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Remove Stripe-related columns from purchase_automations table
ALTER TABLE public.purchase_automations 
DROP COLUMN IF EXISTS stripe_session_id;

-- Remove Stripe-related columns from payments table
ALTER TABLE public.payments 
DROP COLUMN IF EXISTS stripe_invoice_id,
DROP COLUMN IF EXISTS stripe_subscription_id;

-- Update payment_history table to remove Stripe payment ID
ALTER TABLE public.payment_history 
DROP COLUMN IF EXISTS stripe_payment_id;

-- Remove any Stripe subscriptions table if it exists
DROP TABLE IF EXISTS public.stripe_subscriptions;