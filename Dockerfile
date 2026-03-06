# ============================================
# STAGE 1: Build do Frontend (Client)
# ============================================
FROM node:22-alpine AS client-builder

WORKDIR /app

# Instalar pnpm na versão fixada (evita download extra no runtime)
RUN npm install -g pnpm@10.4.1

# Copiar package.json e lock files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Instalar todas as dependências (dev incluso para build)
RUN pnpm install --frozen-lockfile

# Copiar código fonte do cliente
COPY client ./client
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./

# Build do frontend
RUN pnpm run build:client

# ============================================
# STAGE 2: Build do Backend (Server)
# ============================================
FROM node:22-alpine AS server-builder

WORKDIR /app

# Instalar pnpm na versão fixada
RUN npm install -g pnpm@10.4.1

# Copiar package.json e lock files
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Instalar todas as dependências (dev incluso para build)
RUN pnpm install --frozen-lockfile

# Copiar código fonte do servidor
COPY server ./server
COPY drizzle ./drizzle
COPY shared ./shared
COPY tsconfig.json ./
COPY vite.config.ts ./

# Build do backend
RUN pnpm run build:server

# ============================================
# STAGE 3: Imagem Final de Produção
# ============================================
FROM node:22-alpine

WORKDIR /app

# Instalar pnpm na versão fixada
RUN npm install -g pnpm@10.4.1

# Copiar package.json e lock files ANTES de definir NODE_ENV
# (NODE_ENV=production antes do install pode interferir na resolução do pnpm)
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY patches ./patches

# Instalar apenas dependências de produção
# NODE_ENV é definido DEPOIS da cópia dos manifests e ANTES do install
# para que o pnpm resolva corretamente sem conflito com o lockfile
RUN pnpm install --prod --frozen-lockfile && \
    pnpm store prune

# Copiar builds do frontend e backend
COPY --from=client-builder /app/dist/public ./dist/server/public
COPY --from=server-builder /app/dist/server ./dist/server

# Copiar arquivos necessários
COPY drizzle ./drizzle
COPY drizzle.config.ts ./drizzle.config.ts
COPY shared ./shared
COPY scripts ./scripts

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app && \
    chmod +x /app/scripts/*.sh 2>/dev/null || true

USER nodejs

# Expor porta
EXPOSE 8080

# Variáveis de ambiente de produção (definidas aqui, após o install)
ENV NODE_ENV=production \
    PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 8080) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["sh", "scripts/start-prod.sh"]
