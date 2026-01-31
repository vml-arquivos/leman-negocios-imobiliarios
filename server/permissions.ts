// ============================================
// SISTEMA DE PERMISSÕES E CONTROLE DE ACESSO
// ============================================

export type UserRole = "user" | "agent" | "admin";

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
}

/**
 * Matriz de permissões por role
 */
const PERMISSIONS_MATRIX: Record<UserRole, Permission[]> = {
  // Usuário comum (cliente/lead)
  user: [
    { resource: "properties", action: "read" },
    { resource: "blog", action: "read" },
    { resource: "simulations", action: "create" },
    { resource: "simulations", action: "read" },
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
  ],

  // Corretor (agent)
  agent: [
    // Pode tudo que o user pode
    { resource: "properties", action: "read" },
    { resource: "blog", action: "read" },
    { resource: "simulations", action: "create" },
    { resource: "simulations", action: "read" },
    { resource: "profile", action: "read" },
    { resource: "profile", action: "update" },
    
    // Permissões específicas de corretor
    { resource: "leads", action: "read" }, // Apenas seus próprios leads
    { resource: "leads", action: "update" }, // Apenas seus próprios leads
    { resource: "interactions", action: "create" },
    { resource: "interactions", action: "read" },
    { resource: "interactions", action: "update" },
    { resource: "appointments", action: "create" },
    { resource: "appointments", action: "read" },
    { resource: "appointments", action: "update" },
    { resource: "proposals", action: "create" },
    { resource: "proposals", action: "read" },
    { resource: "proposals", action: "update" },
    { resource: "analytics", action: "read" }, // Apenas suas próprias métricas
  ],

  // Administrador
  admin: [
    // Acesso total a tudo
    { resource: "*", action: "manage" },
  ],
};

/**
 * Verificar se um role tem permissão para uma ação
 */
export function hasPermission(
  userRole: UserRole,
  resource: string,
  action: Permission["action"]
): boolean {
  const permissions = PERMISSIONS_MATRIX[userRole] || [];

  // Admin tem acesso total
  if (userRole === "admin") {
    return true;
  }

  // Verificar permissões específicas
  return permissions.some(
    (perm) =>
      (perm.resource === resource || perm.resource === "*") &&
      (perm.action === action || perm.action === "manage")
  );
}

/**
 * Verificar se usuário pode acessar um lead específico
 */
export function canAccessLead(userRole: UserRole, userId: number, leadAssignedTo: number | null): boolean {
  // Admin pode acessar tudo
  if (userRole === "admin") {
    return true;
  }

  // Corretor só pode acessar seus próprios leads
  if (userRole === "agent") {
    return leadAssignedTo === userId;
  }

  // Usuário comum não pode acessar leads
  return false;
}

/**
 * Verificar se usuário pode atribuir leads
 */
export function canAssignLeads(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Verificar se usuário pode criar/editar imóveis
 */
export function canManageProperties(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Verificar se usuário pode ver analytics globais
 */
export function canViewGlobalAnalytics(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Verificar se usuário pode gerenciar outros usuários
 */
export function canManageUsers(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Verificar se usuário pode gerenciar configurações do site
 */
export function canManageSettings(userRole: UserRole): boolean {
  return userRole === "admin";
}

/**
 * Filtrar dados baseado no role do usuário
 */
export function filterDataByRole<T extends { assigned_to?: number | null }>(
  data: T[],
  userRole: UserRole,
  userId: number
): T[] {
  // Admin vê tudo
  if (userRole === "admin") {
    return data;
  }

  // Corretor vê apenas seus próprios dados
  if (userRole === "agent") {
    return data.filter((item) => item.assigned_to === userId);
  }

  // Usuário comum não vê nada
  return [];
}

/**
 * Obter label amigável do role
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    user: "Usuário",
    agent: "Corretor",
    admin: "Administrador",
  };
  return labels[role] || "Desconhecido";
}

/**
 * Obter descrição do role
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    user: "Acesso básico ao site e simulações",
    agent: "Corretor com acesso a leads e vendas",
    admin: "Acesso total ao sistema",
  };
  return descriptions[role] || "";
}

/**
 * Lista de roles disponíveis
 */
export const AVAILABLE_ROLES: Array<{ value: UserRole; label: string; description: string }> = [
  {
    value: "user",
    label: getRoleLabel("user"),
    description: getRoleDescription("user"),
  },
  {
    value: "agent",
    label: getRoleLabel("agent"),
    description: getRoleDescription("agent"),
  },
  {
    value: "admin",
    label: getRoleLabel("admin"),
    description: getRoleDescription("admin"),
  },
];

/**
 * Validar se um role é válido
 */
export function isValidRole(role: string): role is UserRole {
  return ["user", "agent", "admin"].includes(role);
}
