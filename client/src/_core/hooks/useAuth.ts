import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // TEMPORÁRIO: Desabilitar autenticação e retornar usuário mockado
  // TODO: Reativar autenticação quando o login estiver funcionando
  
  const mockUser = {
    id: 1,
    name: "Administrador",
    email: "admin@lemannegocios.com.br",
    role: "admin" as const,
  };

  const logout = useCallback(async () => {
    // Redirecionar para home ao fazer logout
    window.location.href = "/";
  }, []);

  return {
    user: mockUser,
    loading: false,
    error: null,
    isAuthenticated: true,
    refresh: () => Promise.resolve(),
    logout,
  };
}
