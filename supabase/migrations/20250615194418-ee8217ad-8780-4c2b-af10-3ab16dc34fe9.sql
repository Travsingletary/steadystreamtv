
-- Drop the existing problematic RLS policy if it exists
DROP POLICY IF EXISTS "Admin roles are viewable by authenticated users" ON public.admin_roles;

-- Create a simple policy that allows authenticated users to view admin roles
-- without causing recursion
CREATE POLICY "Allow authenticated users to view admin roles" 
  ON public.admin_roles 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Optional: Add a more restrictive policy for other operations
CREATE POLICY "Only admins can modify admin roles" 
  ON public.admin_roles 
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id);
