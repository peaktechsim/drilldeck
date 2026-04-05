import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SHOOTER_STORAGE_KEY, type Shooter } from "@/lib/api";

type AuthContextValue = {
  shooter: Shooter | null;
  login: (nextShooter: Shooter) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredShooter(): Shooter | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(SHOOTER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Shooter;
  } catch {
    window.sessionStorage.removeItem(SHOOTER_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [shooter, setShooter] = useState<Shooter | null>(() => readStoredShooter());

  useEffect(() => {
    setShooter(readStoredShooter());
  }, []);

  const login = useCallback((nextShooter: Shooter) => {
    window.sessionStorage.setItem(SHOOTER_STORAGE_KEY, JSON.stringify(nextShooter));
    setShooter(nextShooter);
  }, []);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(SHOOTER_STORAGE_KEY);
    setShooter(null);
  }, []);

  const value = useMemo(
    () => ({ shooter, login, logout }),
    [login, logout, shooter],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
