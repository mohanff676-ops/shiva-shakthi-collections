import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
  Search,
  Mail,
  Calendar,
  Phone,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Ban,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Info,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { APP_NAME } from '@/lib/constants';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

export interface DirectoryUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: 'admin' | 'customer';
  is_admin: boolean;
  is_banned: boolean;
  ban_reason?: string | null;
  banned_at?: string | null;
  order_count?: number;
  created_at: string;
  last_sign_in_at: string | null;
}

export default function AdminUsers() {
  const { user: currentAdminUser, isAdmin } = useAuth();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'customer' | 'banned'>('all');

  // Manual email promotion state
  const [manualEmail, setManualEmail] = useState('');
  const [promotingManual, setPromotingManual] = useState(false);

  // Modal confirm states
  // 1. Promote to Admin
  const [promoteCandidate, setPromoteCandidate] = useState<{ email: string; name?: string } | null>(null);
  const [promoting, setPromoting] = useState(false);

  // 2. Demote Admin
  const [demoteCandidate, setDemoteCandidate] = useState<DirectoryUser | null>(null);
  const [demoting, setDemoting] = useState(false);

  // 3. Ban User
  const [banCandidate, setBanCandidate] = useState<DirectoryUser | null>(null);
  const [banReason, setBanReason] = useState('Violation of store terms and conditions');
  const [banning, setBanning] = useState(false);

  // 4. Unban User
  const [unbanCandidate, setUnbanCandidate] = useState<DirectoryUser | null>(null);
  const [unbanning, setUnbanning] = useState(false);

  // 5. Delete User
  const [deleteCandidate, setDeleteCandidate] = useState<DirectoryUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // SQL Migration missing indicator
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadDirectory = async () => {
    setLoading(true);
    setMigrationNeeded(false);

    if (!isSupabaseConfigured) {
      // Mock data in local preview mode
      setUsers([
        {
          id: currentAdminUser?.id || 'admin-1',
          email: currentAdminUser?.email || 'mohanff676@gmail.com',
          full_name: 'Store Administrator',
          phone: '+91 89712 63989',
          role: 'admin',
          is_admin: true,
          is_banned: false,
          ban_reason: null,
          banned_at: null,
          order_count: 0,
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
          last_sign_in_at: new Date().toISOString(),
        },
      ]);
      setLoading(false);
      return;
    }

    try {
      // 1. Call get_users_directory RPC
      const { data, error } = await supabase.rpc('get_users_directory');

      if (error) {
        if (
          error.code === 'PGRST202' ||
          error.message.includes('get_users_directory') ||
          error.message.includes('schema cache')
        ) {
          console.warn('[AdminUsers] RPC get_users_directory pending migration:', error.message);
          setMigrationNeeded(true);
          await loadFallbackDirectory();
          return;
        }
        throw error;
      }

      setUsers((data as DirectoryUser[]) || []);
    } catch (err: any) {
      console.error('[AdminUsers] Failed to load directory:', err);
      await loadFallbackDirectory();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackDirectory = async () => {
    try {
      const [profilesRes, rolesRes, bansRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('user_bans').select('*'),
        supabase.from('orders').select('id, user_id'),
      ]);

      const roles = rolesRes.data || [];
      const adminUserIds = new Set(roles.filter((r) => r.role === 'admin').map((r) => r.user_id));

      const bans = bansRes.data || [];
      const bansMap = new Map(bans.filter((b) => b.is_banned).map((b) => [b.user_id, b]));

      const orders = ordersRes.data || [];
      const orderCountMap = new Map<string, number>();
      orders.forEach((o) => {
        if (o.user_id) {
          orderCountMap.set(o.user_id, (orderCountMap.get(o.user_id) || 0) + 1);
        }
      });

      if (profilesRes.data) {
        const mapped: DirectoryUser[] = profilesRes.data.map((p) => {
          const isUserAdmin = adminUserIds.has(p.id) || p.id === currentAdminUser?.id;
          const banInfo = bansMap.get(p.id);
          const isUserBanned = Boolean(banInfo || p.is_banned);

          return {
            id: p.id,
            email: p.email || (p.id === currentAdminUser?.id ? currentAdminUser?.email || '' : 'Registered User'),
            full_name: p.full_name,
            phone: p.phone,
            role: isUserAdmin ? 'admin' : 'customer',
            is_admin: isUserAdmin,
            is_banned: isUserBanned,
            ban_reason: banInfo?.reason || p.banned_reason || null,
            banned_at: banInfo?.banned_at || p.banned_at || null,
            order_count: orderCountMap.get(p.id) || 0,
            created_at: p.created_at || new Date().toISOString(),
            last_sign_in_at: null,
          };
        });

        // Ensure current admin is visible if not in profiles
        if (currentAdminUser && !mapped.some((m) => m.id === currentAdminUser.id)) {
          mapped.unshift({
            id: currentAdminUser.id,
            email: currentAdminUser.email || '',
            full_name: 'Primary Administrator',
            phone: null,
            role: 'admin',
            is_admin: true,
            is_banned: false,
            ban_reason: null,
            banned_at: null,
            order_count: 0,
            created_at: new Date().toISOString(),
            last_sign_in_at: new Date().toISOString(),
          });
        }

        setUsers(mapped);
      }
    } catch (fallbackErr) {
      console.error('[AdminUsers] Fallback failed:', fallbackErr);
    }
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  // ── ACTION 1: BAN USER ─────────────────────────────────────────────
  const handleConfirmBan = async () => {
    if (!banCandidate) return;

    if (!isAdmin) {
      toast.error('Only administrators can ban accounts.');
      setBanCandidate(null);
      return;
    }

    if (banCandidate.id === currentAdminUser?.id) {
      toast.error('Security Violation: You cannot ban your own account.');
      setBanCandidate(null);
      return;
    }

    setBanning(true);

    try {
      // 1. Call ban_user RPC
      const { data, error } = await supabase.rpc('ban_user', {
        target_user_id: banCandidate.id,
        ban_reason: banReason.trim() || 'Violation of store terms',
      });

      if (error) {
        // Fallback: If RPC not created yet, update user_bans & profiles directly
        if (error.code === 'PGRST202' || error.message.includes('ban_user')) {
          setMigrationNeeded(true);

          await supabase.from('user_bans').upsert({
            user_id: banCandidate.id,
            is_banned: true,
            reason: banReason.trim(),
            banned_at: new Date().toISOString(),
            banned_by: currentAdminUser?.id || null,
          });

          await supabase.from('profiles').update({
            is_banned: true,
            banned_reason: banReason.trim(),
            banned_at: new Date().toISOString(),
          }).eq('id', banCandidate.id);
        } else {
          throw new Error(error.message || 'Failed to ban user');
        }
      }

      toast.success(`Account ${banCandidate.email} has been BANNED.`);
      setBanCandidate(null);
      setBanReason('Violation of store terms and conditions');
      await loadDirectory();
    } catch (err: any) {
      console.error('[AdminUsers] Ban failed:', err);
      toast.error(err.message || 'Failed to ban user');
    } finally {
      setBanning(false);
    }
  };

  // ── ACTION 2: UNBAN USER ───────────────────────────────────────────
  const handleConfirmUnban = async () => {
    if (!unbanCandidate) return;

    if (!isAdmin) {
      toast.error('Only administrators can unban accounts.');
      setUnbanCandidate(null);
      return;
    }

    setUnbanning(true);

    try {
      const { data, error } = await supabase.rpc('unban_user', {
        target_user_id: unbanCandidate.id,
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message.includes('unban_user')) {
          setMigrationNeeded(true);

          await supabase.from('user_bans').update({
            is_banned: false,
            unbanned_at: new Date().toISOString(),
            unbanned_by: currentAdminUser?.id || null,
          }).eq('user_id', unbanCandidate.id);

          await supabase.from('profiles').update({
            is_banned: false,
            banned_reason: null,
            banned_at: null,
          }).eq('id', unbanCandidate.id);
        } else {
          throw new Error(error.message || 'Failed to unban user');
        }
      }

      toast.success(`Access restored for ${unbanCandidate.email}.`);
      setUnbanCandidate(null);
      await loadDirectory();
    } catch (err: any) {
      console.error('[AdminUsers] Unban failed:', err);
      toast.error(err.message || 'Failed to unban user');
    } finally {
      setUnbanning(false);
    }
  };

  // ── ACTION 3: DELETE USER ──────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;

    if (!isAdmin) {
      toast.error('Only administrators can delete accounts.');
      setDeleteCandidate(null);
      return;
    }

    if (deleteCandidate.id === currentAdminUser?.id) {
      toast.error('Security Violation: You cannot delete your own account.');
      setDeleteCandidate(null);
      return;
    }

    setDeleting(true);

    try {
      let deletionSucceeded = false;
      let errorMsg = '';

      // 1. Try invoking Edge Function first (if deployed)
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('delete-user', {
          body: { target_user_id: deleteCandidate.id },
        });

        if (!edgeErr && edgeData?.success) {
          deletionSucceeded = true;
        } else if (edgeErr) {
          errorMsg = edgeErr.message || '';
        }
      } catch (edgeCallErr: any) {
        errorMsg = edgeCallErr?.message || '';
      }

      // 2. If Edge Function is not active or failed, execute via database RPC delete_user_account
      if (!deletionSucceeded) {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('delete_user_account', {
          target_user_id: deleteCandidate.id,
        });

        if (rpcErr) {
          if (rpcErr.code === 'PGRST202' || rpcErr.message.includes('delete_user_account')) {
            setMigrationNeeded(true);
            throw new Error(
              'The delete user server function is pending in Supabase. Please run migration 20261022000007_user_ban_and_delete_management.sql in the Supabase SQL Editor.'
            );
          }
          throw new Error(rpcErr.message || errorMsg || 'Account deletion failed');
        }

        deletionSucceeded = true;
      }

      toast.success(`User ${deleteCandidate.email} has been permanently deleted.`);
      setDeleteCandidate(null);
      await loadDirectory();
    } catch (err: any) {
      console.error('[AdminUsers] Delete failed:', err);
      toast.error(err.message || 'Failed to delete user account');
    } finally {
      setDeleting(false);
    }
  };

  // ── ACTION 4: PROMOTE TO ADMIN ─────────────────────────────────────
  const handleConfirmPromotion = async () => {
    if (!promoteCandidate) return;

    if (!isAdmin) {
      toast.error('Only administrators can promote users.');
      setPromoteCandidate(null);
      return;
    }

    setPromoting(true);
    const targetEmail = promoteCandidate.email.trim();

    try {
      const { data, error } = await supabase.rpc('promote_user_to_admin', {
        target_email: targetEmail,
      });

      if (error) {
        if (
          error.code === 'PGRST202' ||
          error.message.includes('promote_user_to_admin') ||
          error.message.includes('schema cache')
        ) {
          setMigrationNeeded(true);
          throw new Error(
            'The promotion database function is pending in Supabase. Please run migration 20261022000007_user_ban_and_delete_management.sql in your Supabase SQL Editor.'
          );
        }
        throw new Error(error.message || 'Promotion failed');
      }

      const res = data as any;
      if (res?.already_admin) {
        toast.success(`User "${targetEmail}" is already an active administrator.`);
      } else {
        toast.success(`Granted administrator privileges to ${targetEmail}!`);
      }

      setPromoteCandidate(null);
      setManualEmail('');
      await loadDirectory();
    } catch (err: any) {
      console.error('[AdminUsers] Promotion failed:', err);
      toast.error(err.message || 'Failed to promote user to administrator.');
    } finally {
      setPromoting(false);
    }
  };

  // ── ACTION 5: DEMOTE ADMIN ─────────────────────────────────────────
  const handleConfirmDemotion = async () => {
    if (!demoteCandidate) return;

    if (!isAdmin) {
      toast.error('Only administrators can modify roles.');
      setDemoteCandidate(null);
      return;
    }

    if (demoteCandidate.id === currentAdminUser?.id) {
      toast.error('You cannot revoke your own administrator access.');
      setDemoteCandidate(null);
      return;
    }

    setDemoting(true);

    try {
      const { error } = await supabase.rpc('demote_admin_to_customer', {
        target_user_id: demoteCandidate.id,
      });

      if (error) {
        const { error: directErr } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', demoteCandidate.id)
          .eq('role', 'admin');

        if (directErr) {
          throw new Error(error.message || directErr.message || 'Failed to revoke admin role');
        }
      }

      toast.success(`Admin privileges revoked for ${demoteCandidate.email}.`);
      setDemoteCandidate(null);
      await loadDirectory();
    } catch (err: any) {
      console.error('[AdminUsers] Demotion failed:', err);
      toast.error(err.message || 'Failed to revoke administrator access.');
    } finally {
      setDemoting(false);
    }
  };

  // Quick Promotion Submit
  const handleManualPromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualEmail.trim()) {
      toast.error('Please enter a valid email address.');
      return;
    }
    const clean = manualEmail.trim().toLowerCase();
    const existing = users.find((u) => u.email.toLowerCase() === clean);
    if (existing?.is_admin) {
      toast.error(`"${clean}" is already an administrator.`);
      return;
    }
    setPromoteCandidate({
      email: clean,
      name: existing?.full_name || undefined,
    });
  };

  // Copy SQL Snippet
  const handleCopySql = () => {
    const sql = `-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zrhzugujvbzkjqmyzupd/sql/new
-- Execute migration: supabase/migrations/20261022000007_user_ban_and_delete_management.sql`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    toast.success('SQL reference copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Filter users
  const filteredUsers = users.filter((u) => {
    const s = search.trim().toLowerCase();
    const matchSearch =
      !s ||
      u.email.toLowerCase().includes(s) ||
      (u.full_name && u.full_name.toLowerCase().includes(s)) ||
      (u.phone && u.phone.includes(s)) ||
      (u.ban_reason && u.ban_reason.toLowerCase().includes(s));

    const matchRole =
      roleFilter === 'all' ||
      (roleFilter === 'admin' && u.is_admin) ||
      (roleFilter === 'banned' && u.is_banned) ||
      (roleFilter === 'customer' && !u.is_admin && !u.is_banned);

    return matchSearch && matchRole;
  });

  const adminsList = users.filter((u) => u.is_admin);
  const bannedList = users.filter((u) => u.is_banned);
  const activeCustomersList = users.filter((u) => !u.is_admin && !u.is_banned);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Helmet>
        <title>Admins & Users — {APP_NAME} Admin</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2.5">
              <span>Admin & User Management</span>
              <span className="text-xs font-sans font-bold px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-maroon border border-brand-gold/40">
                Security & RBAC
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl">
              Manage accounts, enforce server-side bans, safely delete users with order preservation, and promote team administrators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/admin">
              <Button variant="outline" size="sm" className="bg-white">
                Dashboard Overview
              </Button>
            </Link>
          </div>
        </div>

        {/* Pending Migration Notice Banner */}
        {migrationNeeded && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-5 text-amber-900 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-950">
                  Database Functions Pending in Supabase
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed">
                  To activate server-side bans, unbans, and order-preserving account deletions, run migration{' '}
                  <code className="bg-amber-100 font-mono px-1 py-0.5 rounded text-amber-950 font-bold">
                    supabase/migrations/20261022000007_user_ban_and_delete_management.sql
                  </code>{' '}
                  in your Supabase SQL Editor.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 pl-8">
              <a
                href="https://supabase.com/dashboard/project/zrhzugujvbzkjqmyzupd/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySql}
                className="bg-white border-amber-300 text-amber-900 hover:bg-amber-100"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-green-600" />
                    <span>Copied Migration Path</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Copy Reference</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* 4 Key User Status Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Accounts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{users.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Administrators</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{adminsList.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Customers</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{activeCustomersList.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-medium">Banned Accounts</p>
              <p className={`text-2xl font-bold mt-1 ${bannedList.length > 0 ? 'text-rose-700' : 'text-gray-900'}`}>
                {bannedList.length}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              bannedList.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <Ban className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Promote by Email Form */}
        <div className="bg-[#1C1917] border border-brand-gold/60 rounded-xl p-5 text-white shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2 text-brand-champagne text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant Admin Promotion</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[#F7F5F0]">
                Promote Existing User by Email
              </h2>
              <p className="text-xs text-[#A8A29E] leading-relaxed">
                Grant admin permissions to an existing registered customer without creating duplicate accounts.
              </p>
            </div>

            <form
              onSubmit={handleManualPromoteSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto"
            >
              <div className="relative flex-1 sm:w-72">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="Enter registered user email..."
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-stone-900 border border-stone-700 rounded-lg text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-brand-gold/60 focus:border-brand-gold"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="shrink-0 font-bold flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Promote to Admin</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Registered Users Directory */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header & Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <span>User Directory & Permissions</span>
                <span className="text-xs font-sans font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {users.length}
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Full list of website accounts with real-time Ban, Unban, Delete, and Promotion controls.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search input */}
              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search email, name, reason..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold/40"
                />
                <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-gray-400" />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    roleFilter === 'all' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('customer')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    roleFilter === 'customer' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Active ({activeCustomersList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    roleFilter === 'admin' ? 'bg-white shadow-xs font-bold text-gray-900' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Admins ({adminsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('banned')}
                  className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
                    roleFilter === 'banned' ? 'bg-white shadow-xs font-bold text-rose-700' : 'text-rose-600/80 hover:text-rose-900'
                  }`}
                >
                  Banned ({bannedList.length})
                </button>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Spinner size="lg" className="text-brand-gold mb-3" />
              <p className="text-xs text-gray-500">Loading user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                {search ? 'No matching users found' : 'No users in this category'}
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {search ? 'Try adjusting your search terms.' : 'Users will appear here when accounts are registered.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-stone-50 border-b border-gray-200 uppercase text-[10px] tracking-wider text-gray-500 font-bold">
                  <tr>
                    <th className="px-4 py-3">Account Details</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Date Registered</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isCurrentUser = u.id === currentAdminUser?.id || u.email === currentAdminUser?.email;

                    return (
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          u.is_banned
                            ? 'bg-rose-50/40 hover:bg-rose-50/70'
                            : 'hover:bg-stone-50/70'
                        }`}
                      >
                        {/* User Details */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.is_banned
                                  ? 'bg-rose-200 text-rose-800'
                                  : u.is_admin
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-stone-200 text-stone-700'
                              }`}
                            >
                              {u.is_banned ? (
                                <Ban className="w-4 h-4 text-rose-700" />
                              ) : u.is_admin ? (
                                <Shield className="w-4 h-4 text-amber-700" />
                              ) : u.full_name ? (
                                u.full_name.charAt(0).toUpperCase()
                              ) : (
                                u.email.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                                <span>{u.full_name || 'Customer Account'}</span>
                                {isCurrentUser && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-gray-500">{u.email}</div>
                              {u.is_banned && u.ban_reason && (
                                <div className="text-[10px] text-rose-700 mt-0.5 italic flex items-center gap-1">
                                  <span>Reason:</span>
                                  <span>"{u.ban_reason}"</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                          {u.phone || '—'}
                        </td>

                        {/* Orders count */}
                        <td className="px-4 py-3">
                          {(u.order_count ?? 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              <ShoppingBag className="w-3 h-3" />
                              <span>{u.order_count} order(s)</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">0 orders</span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(u.created_at)}
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3">
                          {u.is_banned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <Ban className="w-3 h-3" /> BANNED
                            </span>
                          ) : u.is_admin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <ShieldCheck className="w-3 h-3" /> Administrator
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3 h-3" /> Active Customer
                            </span>
                          )}
                        </td>

                        {/* Actions (Promote, Ban/Unban, Delete) */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Role Action (Promote / Revoke) */}
                            {u.is_admin ? (
                              !isCurrentUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDemoteCandidate(u)}
                                  className="text-[10px] text-amber-800 border-amber-200 hover:bg-amber-50 py-1 px-2 h-7"
                                  title="Revoke Admin Rights"
                                >
                                  Revoke Admin
                                </Button>
                              )
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPromoteCandidate({ email: u.email, name: u.full_name || undefined })}
                                className="text-[10px] py-1 px-2 h-7 border-brand-gold/60 text-brand-maroon hover:bg-brand-gold/10 font-bold"
                                title="Promote to Administrator"
                              >
                                Promote
                              </Button>
                            )}

                            {/* Ban / Unban Button */}
                            {u.is_banned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUnbanCandidate(u)}
                                className="text-[10px] text-emerald-700 border-emerald-300 hover:bg-emerald-50 py-1 px-2 h-7 font-bold flex items-center gap-1"
                                title="Restore account access"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Unban</span>
                              </Button>
                            ) : (
                              !isCurrentUser && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setBanCandidate(u);
                                    setBanReason('Violation of store terms and conditions');
                                  }}
                                  className="text-[10px] text-rose-700 border-rose-200 hover:bg-rose-50 hover:border-rose-300 py-1 px-2 h-7 font-semibold flex items-center gap-1"
                                  title="Ban user account"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span>Ban</span>
                                </Button>
                              )
                            )}

                            {/* Delete User Button */}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                onClick={() => setDeleteCandidate(u)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Permanently delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── MODAL 1: BAN USER DIALOG ── */}
        <Modal
          isOpen={Boolean(banCandidate)}
          onClose={() => setBanCandidate(null)}
          size="sm"
        >
          <div className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-gray-900">
                  Ban User Account?
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Target: <strong className="text-gray-800">{banCandidate?.email}</strong>
                </p>
              </div>
            </div>

            {banCandidate?.is_admin && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>High-Privilege Warning</span>
                </div>
                <p className="leading-relaxed">
                  You are banning another <strong>Administrator</strong>. They will immediately lose access to both the Admin Portal and customer features.
                </p>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-gray-600">
              <p>
                When banned, this user will be blocked server-side:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-gray-500 pl-1">
                <li>Existing sessions and refresh tokens will be invalidated immediately.</li>
                <li>They cannot sign in or place new WhatsApp orders.</li>
                <li>Their profile and order history will remain preserved.</li>
                <li>You can restore their access at any time using <strong>Unban User</strong>.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Ban (Audit Record):
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                rows={2}
                placeholder="Specify reason for suspension..."
                className="w-full text-xs p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBanCandidate(null)}
                disabled={banning}
              >
                Cancel
              </Button>
              <Button
                variant="maroon"
                size="sm"
                onClick={handleConfirmBan}
                isLoading={banning}
                className="bg-rose-700 hover:bg-rose-800 border-none text-white font-bold"
              >
                Confirm Ban
              </Button>
            </div>
          </div>
        </Modal>

        {/* ── MODAL 2: UNBAN USER DIALOG ── */}
        <ConfirmDialog
          isOpen={Boolean(unbanCandidate)}
          onClose={() => setUnbanCandidate(null)}
          onConfirm={handleConfirmUnban}
          title="Restore Account Access?"
          message={
            unbanCandidate
              ? `Are you sure you want to unban "${unbanCandidate.email}"? Their account access will be immediately restored and they will be permitted to log in and use store features.`
              : ''
          }
          confirmLabel="Restore Access"
          cancelLabel="Cancel"
          variant="info"
          isLoading={unbanning}
        />

        {/* ── MODAL 3: DELETE USER DIALOG ── */}
        <Modal
          isOpen={Boolean(deleteCandidate)}
          onClose={() => setDeleteCandidate(null)}
          size="md"
        >
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold text-gray-900">
                  Permanently Delete User Account?
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Account: <strong className="text-gray-800">{deleteCandidate?.email}</strong>
                </p>
              </div>
            </div>

            {deleteCandidate?.is_admin && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-red-950">
                  <AlertTriangle className="w-4 h-4 text-red-700" />
                  <span>Extreme Caution: Administrator Deletion</span>
                </div>
                <p className="leading-relaxed">
                  You are permanently deleting an <strong>Administrator</strong> account. This cannot be undone.
                </p>
              </div>
            )}

            <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-700 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-stone-900">
                <Info className="w-4 h-4 text-stone-600" />
                <span>Financial & Business Records Protection</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">
                {(deleteCandidate?.order_count ?? 0) > 0 ? (
                  <>
                    This user has <strong>{deleteCandidate?.order_count} historical order record(s)</strong>. To protect your business books, invoices and sales data will remain intact in the database with their customer reference safely unlinked.
                  </>
                ) : (
                  <>
                    All customer authentication data, profile records, and permissions will be permanently removed.
                  </>
                )}
              </p>
            </div>

            <p className="text-xs text-red-600 font-semibold leading-relaxed">
              ⚠️ Warning: This action is destructive and irreversible. The user will be purged from Supabase Authentication.
            </p>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  const target = deleteCandidate;
                  setDeleteCandidate(null);
                  if (target) setBanCandidate(target);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
              >
                Want to suspend instead? Ban User
              </button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteCandidate(null)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="maroon"
                  size="sm"
                  onClick={handleConfirmDelete}
                  isLoading={deleting}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold border-none"
                >
                  Confirm Permanent Deletion
                </Button>
              </div>
            </div>
          </div>
        </Modal>

        {/* ── MODAL 4: CONFIRM PROMOTION DIALOG ── */}
        <ConfirmDialog
          isOpen={Boolean(promoteCandidate)}
          onClose={() => setPromoteCandidate(null)}
          onConfirm={handleConfirmPromotion}
          title="Grant Administrator Privileges?"
          message={
            promoteCandidate
              ? `Are you sure you want to promote ${promoteCandidate.name ? `"${promoteCandidate.name}" (${promoteCandidate.email})` : `"${promoteCandidate.email}"`} to Administrator? This account will gain full access to Shiva Shakthi Collections catalogue management, inventory edits, order history, and admin settings.`
              : ''
          }
          confirmLabel="Confirm Promotion"
          cancelLabel="Cancel"
          variant="warning"
          isLoading={promoting}
        />

        {/* ── MODAL 5: CONFIRM DEMOTION DIALOG ── */}
        <ConfirmDialog
          isOpen={Boolean(demoteCandidate)}
          onClose={() => setDemoteCandidate(null)}
          onConfirm={handleConfirmDemotion}
          title="Revoke Administrator Access?"
          message={
            demoteCandidate
              ? `Are you sure you want to revoke admin rights for "${demoteCandidate.email}"? They will become a standard customer account and lose access to the Admin Portal.`
              : ''
          }
          confirmLabel="Revoke Admin Access"
          cancelLabel="Cancel"
          variant="danger"
          isLoading={demoting}
        />
      </div>
    </>
  );
}
