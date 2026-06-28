"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, type User } from "@/lib/api";
import AuthForm from "./AuthForm";

interface AuthValue {
  user: User;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/** Access the signed-in user and logout action. Must be used within AuthGate. */
export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within <AuthGate>");
  return value;
}

/**
 * Client-side auth boundary: checks the session on mount and renders the
 * sign-in form until the user is authenticated. The backend independently
 * enforces auth on protected endpoints (e.g. /api/chat).
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-16 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <AuthForm onAuthed={setUser} />;
  }

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, logout }}>{children}</AuthContext.Provider>;
}
