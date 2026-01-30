/**
 * Sistema de Permissões Granulares
 * Inspirado em HubSpot, Salesforce e RD Station
 */

export const PERMISSIONS = {
  // Usuários
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Imóveis
  PROPERTIES_VIEW: 'properties.view',
  PROPERTIES_CREATE: 'properties.create',
  PROPERTIES_EDIT: 'properties.edit',
  PROPERTIES_DELETE: 'properties.delete',
  PROPERTIES_PUBLISH: 'properties.publish',
  
  // Leads
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_EDIT: 'leads.edit',
  LEADS_DELETE: 'leads.delete',
  LEADS_ASSIGN: 'leads.assign',
  
  // Clientes
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // Configurações
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_ADVANCED: 'settings.advanced',
  
  // Blog
  BLOG_VIEW: 'blog.view',
  BLOG_CREATE: 'blog.create',
  BLOG_EDIT: 'blog.edit',
  BLOG_DELETE: 'blog.delete',
  BLOG_PUBLISH: 'blog.publish',
  
  // Financeiro
  FINANCIAL_VIEW: 'financial.view',
  FINANCIAL_EDIT: 'financial.edit',
  
  // Logs
  LOGS_VIEW: 'logs.view',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * Mapeamento de Roles para Permissões
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS), // Admin tem TODAS as permissões
  
  gerente: [
    // Usuários (apenas visualizar e editar)
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_EDIT,
    
    // Imóveis (tudo)
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_EDIT,
    PERMISSIONS.PROPERTIES_DELETE,
    PERMISSIONS.PROPERTIES_PUBLISH,
    
    // Leads (tudo)
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.LEADS_DELETE,
    PERMISSIONS.LEADS_ASSIGN,
    
    // Clientes (tudo)
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_DELETE,
    
    // Analytics (tudo)
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    
    // Configurações (apenas visualizar)
    PERMISSIONS.SETTINGS_VIEW,
    
    // Blog (tudo)
    PERMISSIONS.BLOG_VIEW,
    PERMISSIONS.BLOG_CREATE,
    PERMISSIONS.BLOG_EDIT,
    PERMISSIONS.BLOG_DELETE,
    PERMISSIONS.BLOG_PUBLISH,
    
    // Financeiro (visualizar)
    PERMISSIONS.FINANCIAL_VIEW,
    
    // Logs
    PERMISSIONS.LOGS_VIEW,
  ],
  
  corretor: [
    // Imóveis (visualizar, criar, editar)
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.PROPERTIES_CREATE,
    PERMISSIONS.PROPERTIES_EDIT,
    
    // Leads (tudo exceto deletar)
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    
    // Clientes (visualizar, criar, editar)
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    
    // Analytics (apenas visualizar)
    PERMISSIONS.ANALYTICS_VIEW,
    
    // Blog (visualizar)
    PERMISSIONS.BLOG_VIEW,
  ],
  
  atendente: [
    // Imóveis (apenas visualizar)
    PERMISSIONS.PROPERTIES_VIEW,
    
    // Leads (visualizar, criar)
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    
    // Clientes (visualizar, criar)
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    
    // Blog (visualizar)
    PERMISSIONS.BLOG_VIEW,
  ],
  
  user: [
    // Apenas visualizar imóveis e blog
    PERMISSIONS.PROPERTIES_VIEW,
    PERMISSIONS.BLOG_VIEW,
  ],
};

/**
 * Verifica se um usuário tem uma permissão específica
 */
export function hasPermission(
  userRole: string,
  userPermissions: string[] = [],
  requiredPermission: Permission
): boolean {
  // Admin sempre tem acesso
  if (userRole === 'admin') return true;
  
  // Verificar permissões customizadas do usuário
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Verificar permissões do role
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  return rolePerms.includes(requiredPermission);
}

/**
 * Verifica se um usuário tem TODAS as permissões especificadas
 */
export function hasAllPermissions(
  userRole: string,
  userPermissions: string[] = [],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(perm => 
    hasPermission(userRole, userPermissions, perm)
  );
}

/**
 * Verifica se um usuário tem ALGUMA das permissões especificadas
 */
export function hasAnyPermission(
  userRole: string,
  userPermissions: string[] = [],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(perm => 
    hasPermission(userRole, userPermissions, perm)
  );
}

/**
 * Retorna todas as permissões de um usuário
 */
export function getUserPermissions(
  userRole: string,
  userPermissions: string[] = []
): Permission[] {
  const rolePerms = ROLE_PERMISSIONS[userRole] || [];
  const customPerms = userPermissions.filter(p => 
    Object.values(PERMISSIONS).includes(p as Permission)
  ) as Permission[];
  
  // Combinar e remover duplicatas
  return Array.from(new Set([...rolePerms, ...customPerms]));
}

/**
 * Labels amigáveis para as permissões
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [PERMISSIONS.USERS_VIEW]: 'Visualizar Usuários',
  [PERMISSIONS.USERS_CREATE]: 'Criar Usuários',
  [PERMISSIONS.USERS_EDIT]: 'Editar Usuários',
  [PERMISSIONS.USERS_DELETE]: 'Deletar Usuários',
  
  [PERMISSIONS.PROPERTIES_VIEW]: 'Visualizar Imóveis',
  [PERMISSIONS.PROPERTIES_CREATE]: 'Criar Imóveis',
  [PERMISSIONS.PROPERTIES_EDIT]: 'Editar Imóveis',
  [PERMISSIONS.PROPERTIES_DELETE]: 'Deletar Imóveis',
  [PERMISSIONS.PROPERTIES_PUBLISH]: 'Publicar Imóveis',
  
  [PERMISSIONS.LEADS_VIEW]: 'Visualizar Leads',
  [PERMISSIONS.LEADS_CREATE]: 'Criar Leads',
  [PERMISSIONS.LEADS_EDIT]: 'Editar Leads',
  [PERMISSIONS.LEADS_DELETE]: 'Deletar Leads',
  [PERMISSIONS.LEADS_ASSIGN]: 'Atribuir Leads',
  
  [PERMISSIONS.CLIENTS_VIEW]: 'Visualizar Clientes',
  [PERMISSIONS.CLIENTS_CREATE]: 'Criar Clientes',
  [PERMISSIONS.CLIENTS_EDIT]: 'Editar Clientes',
  [PERMISSIONS.CLIENTS_DELETE]: 'Deletar Clientes',
  
  [PERMISSIONS.ANALYTICS_VIEW]: 'Visualizar Analytics',
  [PERMISSIONS.ANALYTICS_EXPORT]: 'Exportar Analytics',
  
  [PERMISSIONS.SETTINGS_VIEW]: 'Visualizar Configurações',
  [PERMISSIONS.SETTINGS_EDIT]: 'Editar Configurações',
  [PERMISSIONS.SETTINGS_ADVANCED]: 'Configurações Avançadas',
  
  [PERMISSIONS.BLOG_VIEW]: 'Visualizar Blog',
  [PERMISSIONS.BLOG_CREATE]: 'Criar Posts',
  [PERMISSIONS.BLOG_EDIT]: 'Editar Posts',
  [PERMISSIONS.BLOG_DELETE]: 'Deletar Posts',
  [PERMISSIONS.BLOG_PUBLISH]: 'Publicar Posts',
  
  [PERMISSIONS.FINANCIAL_VIEW]: 'Visualizar Financeiro',
  [PERMISSIONS.FINANCIAL_EDIT]: 'Editar Financeiro',
  
  [PERMISSIONS.LOGS_VIEW]: 'Visualizar Logs',
};

/**
 * Labels amigáveis para os roles
 */
export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  corretor: 'Corretor',
  atendente: 'Atendente',
  user: 'Usuário',
};
