import { useState, useEffect, useCallback } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  avatarUrl?: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

const API_BASE_URL = "";  // Vazio = mesma origem

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/auth/login" } = options ?? {};
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuário do cookie (via endpoint /api/auth/me)
  useEffect(() => {
    const loadUser = async () => {
      try {
        // O cookie é enviado automaticamente pelo navegador
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: "include", // Importante: envia cookies
          headers: {
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.user) {
            setUser(data.data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[Auth] Erro ao carregar usuário:", err);
        setUser(null);
      }

      setLoading(false);
    };

    loadUser();
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

  // Login é feito diretamente no componente Login.tsx via fetch
  // Não precisa de função login aqui

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });
    } catch (err) {
      console.error("[Auth] Erro no logout:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("leman_token");
      localStorage.removeItem("leman_user");
      window.location.href = "/auth/login";
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.user) {
          setUser(data.data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("[Auth] Erro ao atualizar usuário:", err);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
    logout,
    refresh,
  };
}
