import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const {
    user,
    profile,
    role,
    isAdmin,
    isLoading,
    isInitialized,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  } = useAuthStore();

  return {
    user,
    profile,
    role,
    isAdmin,
    isAuthenticated: Boolean(user),
    isLoading,
    isInitialized,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    clearError,
  };
}
