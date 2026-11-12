
import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (
    data: { full_name?: string; phone?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  role: null,
  isAdmin: false,
  isLoading: true,
  isInitialized: false,
  error: null,

  clearError: () => set({ error: null }),

  initialize: async () => {
    if (!isSupabaseConfigured) {
      set({
        user: null,
        profile: null,
        role: null,
        isAdmin: false,
        isLoading: false,
        isInitialized: true,
      });
      return;
    }

    try {
      set({ isLoading: true });

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (session?.user) {
        const user = session.user;
        const [profile, role] = await Promise.all([
          fetchUserProfile(user),
          fetchUserRole(user.id),
        ]);

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          set({
            user: null,
            profile: null,
            role: null,
            isAdmin: false,
            isLoading: false,
            isInitialized: true,
            error: `Account suspended: ${profile.banned_reason || 'Access has been revoked by store administrator.'}`,
          });
          return;
        }

        set({
          user,
          profile,
          role,
          isAdmin: role === 'admin',
          isLoading: false,
          isInitialized: true,
        });
      } else {
        set({
          user: null,
          profile: null,
          role: null,
          isAdmin: false,
          isLoading: false,
          isInitialized: true,
        });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          set({
            user: null,
            profile: null,
            role: null,
            isAdmin: false,
            isLoading: false,
          });
          return;
        }

        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED'
        ) {
          const user = session.user;
          const [profile, role] = await Promise.all([
            fetchUserProfile(user),
            fetchUserRole(user.id),
          ]);

          if (profile?.is_banned) {
            await supabase.auth.signOut();
            set({
              user: null,
              profile: null,
              role: null,
              isAdmin: false,
              isLoading: false,
              error: `Account suspended: ${profile.banned_reason || 'Access has been revoked by store administrator.'}`,
            });
            return;
          }

          set({
            user,
            profile,
            role,
            isAdmin: role === 'admin',
            isLoading: false,
          });
        }
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Authentication initialization failed';

      console.error('[AuthStore] Initialization failed:', message);

      set({
        user: null,
        profile: null,
        role: null,
        isAdmin: false,
        isLoading: false,
        isInitialized: true,
        error: message,
      });
    }
  },

  signIn: async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Authentication is disabled because Supabase is not configured.',
      };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login.');

      const [profile, role] = await Promise.all([
        fetchUserProfile(data.user),
        fetchUserRole(data.user.id),
      ]);

      if (profile?.is_banned) {
        await supabase.auth.signOut();
        const banMessage = `Account suspended: ${profile.banned_reason || 'Access has been revoked by store administrator.'}`;
        set({
          user: null,
          profile: null,
          role: null,
          isAdmin: false,
          isLoading: false,
          error: banMessage,
        });
        return { success: false, error: banMessage };
      }

      set({
        user: data.user,
        profile,
        role,
        isAdmin: role === 'admin',
        isLoading: false,
      });

      return { success: true };
    } catch (err: unknown) {
      let message =
        err instanceof Error ? err.message : 'Invalid email or password';

      if (message.toLowerCase().includes('banned') || message.toLowerCase().includes('suspended')) {
        message = 'This account has been suspended by the store administrator. Access is revoked.';
      }

      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signUp: async (email, password, fullName, phone) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Registration is disabled because Supabase is not configured.',
      };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            phone: phone?.trim() || null,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        // Allow the database registration trigger to complete.
        await new Promise((resolve) => setTimeout(resolve, 400));

        const [profile, role] = await Promise.all([
          fetchUserProfile(data.user),
          fetchUserRole(data.user.id),
        ]);

        set({
          user: data.user,
          profile,
          role,
          isAdmin: role === 'admin',
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }

      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create account';

      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }

    set({
      user: null,
      profile: null,
      role: null,
      isAdmin: false,
      isLoading: false,
      error: null,
    });
  },

  resetPassword: async (email) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Password reset is disabled because Supabase is not configured.',
      };
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo }
      );

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to send password reset link';

      return { success: false, error: message };
    }
  },

  updatePassword: async (newPassword) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Password update is disabled because Supabase is not configured.',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update password';

      return { success: false, error: message };
    }
  },

  updateProfile: async (data) => {
    const current = get().user;

    if (!current || !isSupabaseConfigured) {
      return { success: false, error: 'User is not authenticated.' };
    }

    try {
      const updates: {
        full_name?: string;
        phone?: string;
        updated_at: string;
      } = {
        updated_at: new Date().toISOString(),
      };

      if (data.full_name !== undefined) {
        updates.full_name = data.full_name;
      }

      if (data.phone !== undefined) {
        updates.phone = data.phone;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', current.id);

      if (error) throw error;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          ...(data.full_name !== undefined && {
            full_name: data.full_name,
          }),
          ...(data.phone !== undefined && {
            phone: data.phone,
          }),
        },
      });

      if (metadataError) throw metadataError;

      const updatedProfile = await fetchUserProfile(current);
      set({ profile: updatedProfile });

      return { success: true };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to update profile';

      return { success: false, error: message };
    }
  },
}));

// Fetch the user's role from Supabase.
async function fetchUserRole(userId: string): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (error) {
      console.error('[fetchUserRole] Failed to load role:', error.message);
      throw error;
    }

    const roles = data?.map((item) => item.role) ?? [];

    // Admin takes priority when an account has both roles.
    if (roles.includes('admin')) {
      return 'admin';
    }

    return 'customer';
  } catch (error) {
    console.error('[fetchUserRole] Role lookup failed:', error);
    return 'customer';
  }
}

// Fetch the user's profile, with a fallback to Auth metadata.
async function fetchUserProfile(user: User): Promise<Profile> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[fetchUserProfile] Profile query warning:', error.message);
    }

    if (data) {
      return {
        id: data.id,
        email: user.email || data.email || '',
        full_name: data.full_name,
        phone: data.phone,
        avatar_url: data.avatar_url || null,
        role: 'customer',
        is_banned: Boolean(data.is_banned),
        banned_reason: data.banned_reason || null,
        banned_at: data.banned_at || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
    }
  } catch (error) {
    console.warn('[fetchUserProfile] Failed to load profile:', error);
  }

  return {
    id: user.id,
    email: user.email || '',
    full_name:
      (user.user_metadata?.full_name as string) ||
      (user.email ? user.email.split('@')[0] : 'Valued Customer'),
    phone: (user.user_metadata?.phone as string) || null,
    avatar_url: null,
    role: 'customer',
    created_at: user.created_at || new Date().toISOString(),
    updated_at: user.updated_at || new Date().toISOString(),
  };
}
