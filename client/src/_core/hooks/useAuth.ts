import { useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/auth/login" } = options ?? {};
  const [, setLocation] = useLocation();

  // ============================================
  // QUERY: Validar sessão via tRPC (auth.me)
  // ============================================
  const {
    data: user,
    isLoading: loading,
    error,
    refetch,
  } = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // ============================================
  // MUTATION: Login via tRPC
  // ============================================
  const loginMutation = trpc.auth.login.useMutation();

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await loginMutation.mutateAsync({ email, password });

        if (result.success) {
          // Armazenar token no localStorage para compatibilidade
          if (result.token) {
            localStorage.setItem("leman_token", result.token);
          }
          if (result.user) {
            localStorage.setItem("leman_user", JSON.stringify(result.user));
          }

          // Invalidar cache e refetch do usuário
          await refetch();

          return { success: true, user: result.user };
        }

        return { success: false, error: "Erro desconhecido" };
      } catch (err) {
        console.error("[Auth] Erro no login:", err);
        return {
          success: false,
          error: err instanceof Error ? err.message : "Erro ao fazer login",
        };
      }
    },
    [loginMutation, refetch]
  );

  // ============================================
  // MUTATION: Logout via tRPC
  // ============================================
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (err) {
      console.error("[Auth] Erro no logout:", err);
    } finally {
      // Limpar localStorage
      localStorage.removeItem("leman_token");
      localStorage.removeItem("leman_user");

      // Navegar para login usando SPA navigation (sem hard reload)
      setLocation("/auth/login");
    }
  }, [logoutMutation, setLocation]);

  // ============================================
  // REFRESH: Revalidar sessão
  // ============================================
  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Redirecionar se não autenticado (após loading)
  if (redirectOnUnauthenticated && !loading && !user) {
    if (typeof window !== "undefined" && window.location.pathname !== redirectPath) {
      setTimeout(() => setLocation(redirectPath), 0);
    }
  }

  return {
    user: user ?? null,
    loading,
    error: error?.message ?? null,
    isAuthenticated: Boolean(user),
    login,
    logout,
    refresh,
  };
}
