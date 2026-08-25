import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AppRole = "tenant" | "landlord" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  phone_verified_at?: string | null;
  email_verified_at?: string | null;
};

type AuthState = {
  user: any | null;
  session: any | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data directly out of XAMPP local session tokens
  const syncLocalAuth = useCallback(() => {
    const storedUser = localStorage.getItem("keja_user");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setRole(userData.role as AppRole);
        setProfile({
          id: userData.id,
          full_name: userData.fullName || userData.full_name || null,
          email: userData.email,
          avatar_url: userData.avatarUrl || null,
          phone: userData.phone || null,
          phone_verified_at: userData.phone_verified_at || null,
          email_verified_at: userData.email_verified_at || null,
        });
      } catch (e) {
        console.error("Failed to parse local user data", e);
        localStorage.removeItem("keja_user");
      }
    } else {
      setUser(null);
      setProfile(null);
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Synchronize authentication on mount
    syncLocalAuth();

    // Listen for cross-tab logins or logouts automatically
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "keja_user") {
        syncLocalAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncLocalAuth]);

  const refresh = useCallback(async () => {
    syncLocalAuth();
  }, [syncLocalAuth]);

  const signOut = useCallback(async () => {
    localStorage.removeItem("keja_user");
    setUser(null);
    setProfile(null);
    setRole(null);
    // Hard refresh back to login route to completely flush route memory
    window.location.href = "/login";
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      session: user ? { user } : null, // Mocked session block for compatibility matches
      profile,
      role,
      loading,
      signOut,
      refresh,
    }),
    [user, profile, role, loading, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function dashboardPathForRole(role: AppRole | null | undefined): string {
  if (role === "landlord") return "/dashboard/landlord";
  if (role === "admin") return "/dashboard/admin";
  return "/dashboard/tenant";
}
