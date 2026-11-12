-- ============================================================================
-- SHIVA SHAKTHI COLLECTIONS — USER BAN & DELETE MANAGEMENT SYSTEM
-- Migration: 20261022000007_user_ban_and_delete_management.sql
-- ============================================================================

-- 1. TABLE: USER_BANS (Audit & Status Tracking)
CREATE TABLE IF NOT EXISTS public.user_bans (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_banned BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  banned_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  banned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  unbanned_at TIMESTAMPTZ,
  unbanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_bans_user ON public.user_bans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_status ON public.user_bans(is_banned);

-- 2. ENHANCE PROFILES TABLE WITH EMAIL AND BAN CACHE
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;

-- Backfill profile emails from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON public.profiles(is_banned);

-- 3. ENABLE ROW LEVEL SECURITY ON USER_BANS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_bans_admin_all" ON public.user_bans;
CREATE POLICY "user_bans_admin_all"
  ON public.user_bans
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 4. SECURITY DEFINER HELPER: IS_BANNED()
DROP FUNCTION IF EXISTS public.is_banned(UUID);

CREATE OR REPLACE FUNCTION public.is_banned(lookup_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_bans
    WHERE user_id = lookup_user_id
      AND is_banned = true
  );
$$;

-- 5. UPDATE TRIGGER: AUTOMATIC NEW USER HANDLER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email, is_banned, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    false,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = timezone('utc'::text, now());

  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (NEW.id, 'customer', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6. RPC FUNCTION: GET USERS DIRECTORY (ADMIN-ONLY)
-- NOTE: In PostgreSQL, changing OUT parameters/return type requires dropping the existing function first.
DROP FUNCTION IF EXISTS public.get_users_directory();

CREATE FUNCTION public.get_users_directory()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  is_admin BOOLEAN,
  is_banned BOOLEAN,
  ban_reason TEXT,
  banned_at TIMESTAMPTZ,
  order_count BIGINT,
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
    COALESCE(b.is_banned, p.is_banned, false) AS is_banned,
    COALESCE(b.reason, p.banned_reason) AS ban_reason,
    b.banned_at,
    (SELECT COUNT(*) FROM public.orders o WHERE o.user_id = u.id) AS order_count,
    u.created_at,
    u.last_sign_in_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  LEFT JOIN public.user_bans b ON b.user_id = u.id
  ORDER BY 
    (CASE WHEN EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin') THEN 0 ELSE 1 END),
    COALESCE(b.is_banned, false) DESC,
    u.created_at DESC;
END;
$$;

-- 7. RPC FUNCTION: BAN USER (ADMIN-ONLY)
DROP FUNCTION IF EXISTS public.ban_user(UUID, TEXT);
DROP FUNCTION IF EXISTS public.ban_user(UUID);

CREATE OR REPLACE FUNCTION public.ban_user(
  target_user_id UUID,
  ban_reason TEXT DEFAULT 'Violation of store terms'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  admin_count INT;
  target_email TEXT;
  is_target_admin BOOLEAN;
BEGIN
  -- 1. Verify caller is an administrator
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can ban users.';
  END IF;

  -- 2. Guard against self-banning
  IF calling_user_id = target_user_id THEN
    RAISE EXCEPTION 'Security Violation: Administrators cannot ban their own account.';
  END IF;

  -- 3. Check if target user exists
  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found in system.';
  END IF;

  -- 4. Guard against banning the last administrator
  is_target_admin := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin');
  IF is_target_admin THEN
    SELECT COUNT(DISTINCT user_id) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin'
      AND user_id NOT IN (SELECT user_id FROM public.user_bans WHERE is_banned = true);

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Security Violation: Cannot ban the last active administrator.';
    END IF;
  END IF;

  -- 5. Enforce ban in Supabase Auth (banned_until set to year 2099)
  UPDATE auth.users
  SET banned_until = '2099-12-31 23:59:59+00'::timestamptz
  WHERE id = target_user_id;

  -- 6. Invalidate active sessions and refresh tokens
  BEGIN
    DELETE FROM auth.refresh_tokens
    WHERE session_id IN (SELECT id FROM auth.sessions WHERE user_id = target_user_id);
    DELETE FROM auth.sessions WHERE user_id = target_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 7. Upsert into public.user_bans audit table
  INSERT INTO public.user_bans (user_id, is_banned, reason, banned_at, banned_by, unbanned_at, unbanned_by)
  VALUES (target_user_id, true, TRIM(ban_reason), timezone('utc'::text, now()), calling_user_id, NULL, NULL)
  ON CONFLICT (user_id) DO UPDATE
    SET is_banned = true,
        reason = EXCLUDED.reason,
        banned_at = EXCLUDED.banned_at,
        banned_by = EXCLUDED.banned_by,
        unbanned_at = NULL,
        unbanned_by = NULL;

  -- 8. Cache ban status in profiles
  UPDATE public.profiles
  SET is_banned = true,
      banned_reason = TRIM(ban_reason),
      banned_at = timezone('utc'::text, now()),
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('User %s has been banned successfully. Active sessions have been invalidated.', target_email),
    'user_id', target_user_id,
    'email', target_email,
    'reason', ban_reason
  );
END;
$$;

-- 8. RPC FUNCTION: UNBAN USER (ADMIN-ONLY)
DROP FUNCTION IF EXISTS public.unban_user(UUID);

CREATE OR REPLACE FUNCTION public.unban_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  target_email TEXT;
BEGIN
  -- 1. Verify caller is an administrator
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can unban users.';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User not found in system.';
  END IF;

  -- 2. Clear ban in Supabase Auth
  UPDATE auth.users
  SET banned_until = NULL
  WHERE id = target_user_id;

  -- 3. Update audit status in public.user_bans
  UPDATE public.user_bans
  SET is_banned = false,
      unbanned_at = timezone('utc'::text, now()),
      unbanned_by = calling_user_id
  WHERE user_id = target_user_id;

  -- 4. Update profiles cache
  UPDATE public.profiles
  SET is_banned = false,
      banned_reason = NULL,
      banned_at = NULL,
      updated_at = timezone('utc'::text, now())
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('User %s has been unbanned. Account access is fully restored.', target_email),
    'user_id', target_user_id,
    'email', target_email
  );
END;
$$;

-- 9. RPC FUNCTION: DELETE USER ACCOUNT (ADMIN-ONLY)
-- Securely unlinks historical orders (preserves accounting data) and permanently deletes account.
DROP FUNCTION IF EXISTS public.delete_user_account(UUID);

CREATE OR REPLACE FUNCTION public.delete_user_account(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  calling_user_id UUID;
  admin_count INT;
  target_email TEXT;
  orders_preserved INT;
  is_target_admin BOOLEAN;
BEGIN
  -- 1. Security Check: Only verified administrators can delete accounts
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can delete user accounts.';
  END IF;

  -- 2. Guard: Cannot delete self
  IF calling_user_id = target_user_id THEN
    RAISE EXCEPTION 'Security Violation: Administrators cannot delete their own account.';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;
  IF target_email IS NULL THEN
    RAISE EXCEPTION 'User account not found or already deleted.';
  END IF;

  -- 3. Guard: Cannot delete the last administrator
  is_target_admin := EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin');
  IF is_target_admin THEN
    SELECT COUNT(DISTINCT user_id) INTO admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    IF admin_count <= 1 THEN
      RAISE EXCEPTION 'Security Violation: Cannot delete the last active administrator.';
    END IF;
  END IF;

  -- 4. Safely preserve historical orders & financial records
  -- Unlink user_id to NULL so orders and invoices remain intact
  SELECT COUNT(*) INTO orders_preserved FROM public.orders WHERE user_id = target_user_id;
  UPDATE public.orders
  SET user_id = NULL
  WHERE user_id = target_user_id;

  -- 5. Clean up associated public records
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.user_bans WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE id = target_user_id;

  -- 6. Permanently delete from Supabase Auth
  DELETE FROM auth.users WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('User account %s permanently deleted. Preserved %s historical order record(s).', target_email, orders_preserved),
    'deleted_user_id', target_user_id,
    'deleted_email', target_email,
    'orders_preserved', orders_preserved
  );
END;
$$;

-- 10. RPC FUNCTION: PROMOTE USER TO ADMIN (ADMIN-ONLY)
DROP FUNCTION IF EXISTS public.promote_user_to_admin(TEXT);

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
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can promote users.';
  END IF;

  IF target_email IS NULL OR TRIM(target_email) = '' THEN
    RAISE EXCEPTION 'Target email cannot be empty.';
  END IF;

  target_user_email := LOWER(TRIM(target_email));

  SELECT id, email INTO target_user_id, target_user_email
  FROM auth.users
  WHERE LOWER(email) = target_user_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No registered user found with email "%". The user must register an account on the website first.', target_email;
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RETURN jsonb_build_object(
      'success', true,
      'message', format('User "%s" is already an administrator.', target_user_email),
      'user_id', target_user_id,
      'email', target_user_email,
      'already_admin', true
    );
  END IF;

  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (target_user_id, 'admin', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (id, email, created_at, updated_at)
  VALUES (target_user_id, target_user_email, timezone('utc'::text, now()), timezone('utc'::text, now()))
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, updated_at = timezone('utc'::text, now());

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Successfully granted administrator privileges to %s.', target_user_email),
    'user_id', target_user_id,
    'email', target_user_email,
    'already_admin', false
  );
END;
$$;

-- 11. RPC FUNCTION: DEMOTE ADMIN TO CUSTOMER (ADMIN-ONLY)
DROP FUNCTION IF EXISTS public.demote_admin_to_customer(UUID);

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
  calling_user_id := auth.uid();
  IF calling_user_id IS NULL OR NOT public.is_admin(calling_user_id) THEN
    RAISE EXCEPTION 'Access Denied: Only verified administrators can modify roles.';
  END IF;

  SELECT COUNT(DISTINCT user_id) INTO admin_count FROM public.user_roles WHERE role = 'admin';

  IF admin_count <= 1 AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Cannot revoke admin role: At least one active administrator must remain in the system.';
  END IF;

  SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

  DELETE FROM public.user_roles WHERE user_id = target_user_id AND role = 'admin';

  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (target_user_id, 'customer', timezone('utc'::text, now()))
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('Admin privileges revoked for %s. Account role reverted to customer.', COALESCE(target_email, 'user'))
  );
END;
$$;

-- 12. UPDATE ROW LEVEL SECURITY ON ORDERS AND PROFILES FOR BANNED USERS
DROP POLICY IF EXISTS "orders_insert_authenticated" ON public.orders;
CREATE POLICY "orders_insert_authenticated"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND NOT public.is_banned(auth.uid()));

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING ((auth.uid() = id AND NOT public.is_banned(auth.uid())) OR public.is_admin(auth.uid()))
  WITH CHECK ((auth.uid() = id AND NOT public.is_banned(auth.uid())) OR public.is_admin(auth.uid()));

-- 13. GRANT EXECUTE ON ALL RPC FUNCTIONS TO AUTHENTICATED
GRANT EXECUTE ON FUNCTION public.is_banned(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_directory() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unban_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_admin_to_customer(UUID) TO authenticated;

-- 14. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
