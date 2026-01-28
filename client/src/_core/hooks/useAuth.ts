import { useState, useEffect, useCallback } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
};

// Credenciais hardcoded (TEMPORÁRIO - substituir por API quando funcionar)
const VALID_CREDENTIALS = [
  {
    email: "evandro@lemannegocios.com.br",
    password: "admin123",
    user: { id: 1, name: "Evandro Santos", email: "evandro@lemannegocios.com.br", role: "admin" as const },
  },
  {
    email: "admin@admin.com",
    password: "admin123",
    user: { id: 2, name: "Administrador", email: "admin@admin.com", role: "admin" as const },
  },
];

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/auth/login" } = options ?? {};
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar usuário do localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("leman_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("leman_user");
      }
    }
    setLoading(false);
  }, []);

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, user]);

  const login = useCallback((email: string, password: string): boolean => {
    const credential = VALID_CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );

    if (credential) {
      setUser(credential.user);
      localStorage.setItem("leman_user", JSON.stringify(credential.user));
      return true;
    }

    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("leman_user");
    window.location.href = "/auth/login";
  }, []);

  return {
    user,
    loading,
    error: null,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh: () => Promise.resolve(),
  };
}
