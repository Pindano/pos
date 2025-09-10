-- Create the first admin user
-- Replace 'admin@example.com' and 'your-secure-password' with actual credentials

-- First, we need to insert into auth.users (this is handled by Supabase auth.signUp)
-- Then we create the admin_users record

-- This script should be run after creating an admin user through Supabase auth
-- You can create the admin user by:
-- 1. Going to your Supabase dashboard
-- 2. Authentication > Users
-- 3. Add user manually with email: admin@freshmarket.com
-- 4. Then run this script with the user ID

-- Example admin user setup (replace with actual user ID after creating the auth user)
-- INSERT INTO admin_users (user_id, role) 
-- VALUES ('your-user-id-here', 'admin');

-- For now, we'll create a trigger to automatically make the first user an admin
CREATE OR REPLACE FUNCTION create_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is the first user and no admin exists
  IF (SELECT COUNT(*) FROM auth.users) = 1 AND (SELECT COUNT(*) FROM admin_users) = 0 THEN
    INSERT INTO admin_users (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to make first user admin
DROP TRIGGER IF EXISTS make_first_user_admin ON auth.users;
CREATE TRIGGER make_first_user_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_first_admin();

-- Add RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all admin records
CREATE POLICY "Admins can view admin users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );

-- Allow admins to insert new admin users
CREATE POLICY "Admins can create admin users" ON admin_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.user_id = auth.uid()
    )
  );
