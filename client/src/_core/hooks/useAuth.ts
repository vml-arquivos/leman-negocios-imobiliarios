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

  // Carregar usuário do token
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("leman_token");
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
        } else {
          // Token inválido, remover
          localStorage.removeItem("leman_token");
          localStorage.removeItem("leman_user");
        }
      } catch (err) {
        console.error("[Auth] Erro ao carregar usuário:", err);
        localStorage.removeItem("leman_token");
        localStorage.removeItem("leman_user");
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

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salvar token e usuário
        localStorage.setItem("leman_token", data.data.token);
        localStorage.setItem("leman_user", JSON.stringify(data.data.user));
        setUser(data.data.user);
        return { success: true };
      } else {
        const errorMsg = data.message || "Erro ao fazer login";
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err: any) {
      const errorMsg = "Erro de conexão com o servidor";
      setError(errorMsg);
      console.error("[Auth] Erro no login:", err);
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem("leman_token");
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
      }
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
    const token = localStorage.getItem("leman_token");
    
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data.user);
        localStorage.setItem("leman_user", JSON.stringify(data.data.user));
      } else {
        localStorage.removeItem("leman_token");
        localStorage.removeItem("leman_user");
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
    login,
    logout,
    refresh,
  };
}
