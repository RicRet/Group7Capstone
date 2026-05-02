import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { login as apiLogin, LoginResponse } from "./api/login";
import { updateProfile as apiUpdateProfile, UpdateProfileRequest } from "./api/profile";
import { http, setAuthToken } from "./http";

// Lightweight storage abstraction (web: localStorage, native: in-memory)
const memStore: Record<string, string> = {};
const Storage = {
  async getItem(key: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key) || null;
      }
    } catch {}
    return memStore[key] ?? null;
  },
  async setItem(key: string, val: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, val);
        return;
      }
    } catch {}
    memStore[key] = val;
  },
  async removeItem(key: string) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch {}
    delete memStore[key];
  }
};

export type SessionUser = { id: string; username?: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null; email?: string | null; roles: string[] };
export type SessionState = {
  token?: string;
  user?: SessionUser;
  loading: boolean;
};

export type SessionContextValue = SessionState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (fields: UpdateProfileRequest) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(undefined);
const TOKEN_KEY = "sessionToken";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [user, setUser] = useState<SessionUser | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  // Bootstrap token from storage
  useEffect(() => {
    (async () => {
      const t = await Storage.getItem(TOKEN_KEY);
      if (t) {
        setToken(t);
        setAuthToken(t);
        try {
          const res = await http.get<{ userId: string; username?: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null; email?: string | null; roles: string[] }>("/users/me");
          setUser({ id: String(res.data.userId), username: res.data.username, firstName: res.data.firstName, lastName: res.data.lastName, avatarUrl: res.data.avatarUrl, email: res.data.email, roles: res.data.roles || [] });
        } catch {
          // token invalid; clear
          await Storage.removeItem(TOKEN_KEY);
          setToken(undefined);
          setAuthToken(undefined);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const resp: LoginResponse = await apiLogin({ username, password });
    await Storage.setItem(TOKEN_KEY, resp.token);
    setToken(resp.token);
    setUser(resp.user);
    setAuthToken(resp.token);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!token) return;
    const res = await http.get<{ userId: string; username?: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null; email?: string | null; roles: string[] }>("/users/me");
    setUser({ id: String(res.data.userId), username: res.data.username, firstName: res.data.firstName, lastName: res.data.lastName, avatarUrl: res.data.avatarUrl, email: res.data.email, roles: res.data.roles || [] });
  }, [token]);

  const updateProfile = useCallback(async (fields: UpdateProfileRequest) => {
    const updated = await apiUpdateProfile(fields);
    setUser((prev) => prev ? {
      ...prev,
      username: updated.username ?? prev.username,
      firstName: updated.firstName ?? prev.firstName,
      lastName: updated.lastName ?? prev.lastName,
      avatarUrl: updated.avatarUrl ?? prev.avatarUrl,
      email: updated.email ?? prev.email,
    } : prev);
  }, []);

  const logout = useCallback(async () => {
    try {
      await http.post("/auth/logout");
    } catch {}
    await Storage.removeItem(TOKEN_KEY);
    setToken(undefined);
    setUser(undefined);
    setAuthToken(undefined);
  }, []);

  const value = useMemo<SessionContextValue>(() => ({ token, user, loading, login, logout, refreshMe, updateProfile }), [token, user, loading, login, logout, refreshMe, updateProfile]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
