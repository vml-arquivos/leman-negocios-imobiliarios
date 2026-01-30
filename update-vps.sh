#!/bin/bash
# ==============================================================================
# SCRIPT DE ATUALIZAÇÃO DA APLICAÇÃO NA VPS - LEMAN NEGÓCIOS IMOBILIÁRIOS
# ==============================================================================
# Este script automatiza a atualização da aplicação, puxando as últimas
# alterações do GitHub e reconstruindo os contêineres necessários.
#
# USO:
# 1. Certifique-se de que este script está no diretório raiz do projeto.
# 2. Dê permissão de execução: chmod +x update-vps.sh
# 3. Execute o script: ./update-vps.sh
# ==============================================================================

# Cores para o output
GREEN=\'\033[0;32m\'
NC=\'\033[0m\' # No Color

# Função para printar mensagens
echo_info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

# Parar o script em caso de erro
set -e

# --- 1. NAVEGAR PARA O DIRETÓRIO DO PROJETO ---
# Garante que o script está sendo executado do lugar certo
cd "$(dirname "$0")"

# --- 2. PUXAR ATUALIZAÇÕES DO GITHUB ---
echo_info "Puxando as últimas atualizações do repositório (branch master)..."
git pull origin main

# --- 3. RECONSTRUIR E REINICIAR OS CONTÊINERES ---
echo_info "Reconstruindo a imagem da aplicação e reiniciando os serviços..."
# O Docker Compose irá recriar apenas os contêineres que precisam ser atualizados
docker compose up --build -d

# --- 4. LIMPEZA DE IMAGENS ANTIGAS (OPCIONAL) ---
echo_info "Limpando imagens Docker antigas e não utilizadas..."
docker image prune -f

echo_info "=================================================================="
echo_info "✅ ATUALIZAÇÃO CONCLUÍDA! ✅"
echo_info "A aplicação foi atualizada com sucesso."
echo_info "Use 'docker compose ps' para verificar o status dos contêineres."
echo_info "=================================================================="

# Fim do script
