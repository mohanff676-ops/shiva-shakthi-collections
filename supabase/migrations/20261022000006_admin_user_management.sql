-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — ADMIN USER MANAGEMENT & PROMOTION SYSTEM
-- Migration: 20261022000006_admin_user_management.sql
-- ============================================================================

-- 1. ADD EMAIL COLUMN TO PUBLIC.PROFILES (FOR EASY DIRECTORY & ADMIN LOOKUP)
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Backfill email from auth.users for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- Fast case-insensitive index on profile emails
CREATE INDEX IF NOT EXISTS idx_profiles_email 
  ON public.profiles(LOWER(email));

-- ----------------------------------------------------------------------------
-- 2. UPDATE TRIGGER FUNCTION: AUTOMATIC NEW USER HANDLER
-- Ensures all newly registered users have their email stored in public.profiles
-- and are strictly assigned the 'customer' role by default.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Insert into profiles including email
  INSERT INTO public.profiles (id, full_name, phone, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

  -- Default role assignment is strictly 'customer'
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'customer', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC FUNCTION: GET USERS DIRECTORY (ADMIN-ONLY)
-- Allows authorized administrators to view all registered users and their roles
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_users_directory()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  is_admin BOOLEAN,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  -- Strict authorization: Caller MUST be a verified administrator
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can view the user directory.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id,
    u.email::TEXT,
    COALESCE(p.full_name, u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))::TEXT AS full_name,
    COALESCE(p.phone, u.raw_user_meta_data->>'phone')::TEXT AS phone,
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 'admin'::TEXT
      ELSE 'customer'::TEXT
    END AS role,
    EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') AS is_admin,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY 
    (CASE WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 0 ELSE 1 END),
    u.created_at DESC;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC FUNCTION: PROMOTE USER TO ADMIN (ADMIN-ONLY)
-- Promotes an existing user by email to administrator without creating duplicate accounts
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(target_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  target_user_id UUID;
  target_user_email TEXT;
BEGIN
  -- 1. Security Check: Only verified administrators can promote users
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can promote users.';
  END IF;

  -- 2. Validate input
  IF target_email IS NULL OR TRIM(target_email) = '' THEN
    RAISE EXCEPTION 'Target email cannot be empty.';
  END IF;

  target_user_email := LOWER(TRIM(target_email));

  -- 3. Lookup user in auth.users by email (case-insensitive)
  SELECT id, email INTO target_user_id, target_user_email
  FROM auth.users
  WHERE LOWER(email) = target_user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found with email "%". The user must register an account on the website first.', target_email;
  END IF;

  -- 4. Check if already admin
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', format('User "%s" is already an administrator.', target_user_email),
      'user_id', target_user_id,
      'email', target_user_email,
      'already_admin', true
    );
  END IF;

  -- 5. Insert admin role (the authoritative RBAC source)
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (target_user_id, 'admin', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 6. Ensure profile exists and records email
  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (target_user_id, target_user_email, timezone('utc'::text, now()), timezone('utc'::text, now()))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully granted administrator privileges to %s.', target_user_email),
    'user_id', target_user_id,
    'email', target_user_email,
    'already_admin', false
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC FUNCTION: DEMOTE ADMIN TO CUSTOMER (ADMIN-ONLY)
-- Revokes admin access while preventing the last admin from locking the store
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.demote_admin_to_customer(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  admin_count INT;
  target_email TEXT;
BEGIN
  -- 1. Security Check
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can modify roles.';
  END IF;

  -- 2. Count current active administrators
  SELECT COUNT(DISTINCT user_id) INTO admin_count
  FROM public.user_roles
  WHERE role = 'admin';

  -- 3. Prevent accidental lockout: system must retain at least 1 administrator
  IF admin_count <= 1 AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Cannot revoke admin role: At least one active administrator must remain in the system.';
  END IF;

  -- 4. Lookup user email for confirmation message
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  -- 5. Delete admin role
  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = 'admin';

  -- 6. Ensure customer role is preserved
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (target_user_id, 'customer', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Admin privileges revoked for %s. Account role reverted to customer.', COALESCE(target_email, 'user'))
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. GRANT EXECUTE PERMISSIONS & RELOAD POSTGREST SCHEMA CACHE
-- Note: Functions are SECURITY DEFINER with internal public.is_admin() checks
-- ----------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_users_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_admin_to_customer(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
