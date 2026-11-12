
-- SHIVA SHAKTHI COLLECTIONS
-- Read-only RLS verification
-- Does not create, update, or delete data.

-- 1. Check whether the admin function exists
SELECT
  to_regprocedure('public.is_admin(uuid)') AS admin_function;

-- 2. Check RLS status on the five website tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'user_roles',
    'products',
    'orders',
    'order_items'
  )
ORDER BY tablename;

-- 3. List the security policies on these tables
SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'user_roles',
    'products',
    'orders',
    'order_items'
  )
ORDER BY tablename, policyname;
