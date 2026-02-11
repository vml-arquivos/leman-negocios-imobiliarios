function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    console.error(`❌ [ENV] Variável obrigatória não configurada: ${key}`);
    throw new Error(`Variável de ambiente obrigatória não configurada: ${key}`);
  }
  return value;
}

function getOptionalEnv(key: string, defaultValue: string = ""): string {
  return process.env[key] ?? defaultValue;
}

export const ENV = {
  // Variáveis obrigatórias
  jwtSecret: getRequiredEnv("JWT_SECRET"),
  databaseUrl: getRequiredEnv("DATABASE_URL"),
  
  // Variáveis opcionais (OAuth)
  appId: getOptionalEnv("VITE_APP_ID", "leman-negocios-imobiliarios"),
  oAuthServerUrl: getOptionalEnv("OAUTH_SERVER_URL"),
  ownerOpenId: getOptionalEnv("OWNER_OPEN_ID"),
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: getOptionalEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: getOptionalEnv("BUILT_IN_FORGE_API_KEY"),
  n8nLeadWebhookUrl: getOptionalEnv("N8N_LEAD_WEBHOOK_URL"),
  n8nChatWebhookUrl: getOptionalEnv("VITE_N8N_CHAT_WEBHOOK_URL"),
  storageBucket: getOptionalEnv("STORAGE_BUCKET"),
  storageRegion: getOptionalEnv("STORAGE_REGION"),
  storageEndpoint: getOptionalEnv("STORAGE_ENDPOINT"),
  storageAccessKey: getOptionalEnv("STORAGE_ACCESS_KEY"),
  storageSecretKey: getOptionalEnv("STORAGE_SECRET_KEY"),
  
  // Supabase Storage
  supabaseUrl: getOptionalEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseStorageBucket: getOptionalEnv("SUPABASE_STORAGE_BUCKET"),
};

// Log de inicialização
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("🔧 [ENV] Variáveis de Ambiente Carregadas");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`ℹ️  APP_ID: ${ENV.appId}`);
console.log(`✅ DATABASE_URL: ${ENV.databaseUrl ? "Configurado" : "❌ Vazio"}`);
console.log(`✅ JWT_SECRET: ${ENV.jwtSecret ? "Configurado (oculto)" : "❌ Vazio"}`);
console.log(`ℹ️  OAUTH_SERVER_URL: ${ENV.oAuthServerUrl || "Não configurado (opcional)"}`);
console.log(`ℹ️  NODE_ENV: ${process.env.NODE_ENV || "development"}`);
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
