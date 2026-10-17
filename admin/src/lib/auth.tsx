"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiClient } from "./api";

export interface AdminUser {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
  role: "ADMIN" | "RETAILER" | "DELIVERY_PARTNER" | "CUSTOMER";
  isActive: boolean;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("ingrezy_admin_token");
    const savedUser = localStorage.getItem("ingrezy_admin_user");

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("ingrezy_admin_user");
      }
    }
    setIsLoading(false);
  }, []);

  const refreshProfile = async () => {
    const res = await apiClient<AdminUser>("/api/auth/me");
    if (res.success && res.data) {
      if (res.data.role !== "ADMIN") {
        logout();
        return;
      }
      setUser(res.data);
      localStorage.setItem("ingrezy_admin_user", JSON.stringify(res.data));
    }
  };

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient<{ token: string; user: AdminUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.success || !res.data) {
        setIsLoading(false);
        return { success: false, message: res.message || "Login failed" };
      }

      if (res.data.user.role !== "ADMIN") {
        setIsLoading(false);
        return {
          success: false,
          message: "Access denied. Only authorized ADMIN accounts can access this panel.",
        };
      }

      setToken(res.data.token);
      setUser(res.data.user);
      localStorage.setItem("ingrezy_admin_token", res.data.token);
      localStorage.setItem("ingrezy_admin_user", JSON.stringify(res.data.user));

      setIsLoading(false);
      return { success: true, message: "Login successful" };
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        message: err instanceof Error ? err.message : "Unexpected login error",
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("ingrezy_admin_token");
    localStorage.removeItem("ingrezy_admin_user");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
