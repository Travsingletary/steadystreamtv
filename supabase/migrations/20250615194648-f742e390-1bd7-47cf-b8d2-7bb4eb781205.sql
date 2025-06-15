
-- Drop ALL existing policies on admin_roles to start fresh
DROP POLICY IF EXISTS "Admin roles are viewable by authenticated users" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow authenticated users to view admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Only admins can modify admin roles" ON public.admin_roles;

-- Temporarily disable RLS to clear any issues
ALTER TABLE public.admin_roles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Create a very simple policy that just allows authenticated users to read
CREATE POLICY "authenticated_users_can_read_admin_roles" 
  ON public.admin_roles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Create a simple policy for insert/update/delete that only allows users to modify their own records
CREATE POLICY "users_can_manage_own_admin_roles" 
  ON public.admin_roles 
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
