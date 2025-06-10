
-- First, let's create a default admin user in the auth.users table
-- Note: In a real implementation, you would typically create this through the Supabase Auth API
-- For now, I'll create the admin role entry that can be linked to a user account

-- Insert a default admin role entry
-- You'll need to create a user account with email 'Trav.Singletary@gmail.com' through the signup process first

-- Create an admin role entry (this will be linked after user signup)
-- First, let's ensure we have the admin_roles table structure
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on admin_roles table
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for admin_roles table
CREATE POLICY "Admin roles are viewable by authenticated users" 
  ON public.admin_roles 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Create a function to easily add admin role to a user
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get the user ID from the email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Insert admin role (will be ignored if already exists due to UNIQUE constraint)
  INSERT INTO public.admin_roles (user_id, role)
  VALUES (target_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- If the user Trav.Singletary@gmail.com already exists, make them admin
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Check if the user exists
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'Trav.Singletary@gmail.com';
  
  -- If user exists, make them admin
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.admin_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Made user Trav.Singletary@gmail.com an admin';
  ELSE
    RAISE NOTICE 'User Trav.Singletary@gmail.com not found. Please create account first, then run: SELECT public.make_user_admin(''Trav.Singletary@gmail.com'');';
  END IF;
END;
$$;
