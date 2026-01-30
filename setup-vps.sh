#!/bin/bash
# ==============================================================================
# SCRIPT DE SETUP INICIAL DA VPS - LEMAN NEGÓCIOS IMOBILIÁRIOS
# ==============================================================================
# Este script automatiza a configuração inicial de uma VPS Ubuntu 22.04
# para o deploy da aplicação.
#
# USO:
# 1. Envie este script para sua VPS.
# 2. Dê permissão de execução: chmod +x setup-vps.sh
# 3. Execute o script: ./setup-vps.sh
# ==============================================================================

# Cores para o output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para printar mensagens
echo_info() {
    echo -e "${GREEN}[INFO] $1${NC}"
}

echo_warn() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Parar o script em caso de erro
set -e

# --- 1. ATUALIZAÇÃO DO SISTEMA ---
echo_info "Atualizando pacotes do sistema..."
sudo apt-get update && sudo apt-get upgrade -y

# --- 2. INSTALAÇÃO DE DEPENDÊNCIAS ---
echo_info "Instalando Git, Docker e Docker Compose..."
sudo apt-get install -y git docker.io docker-compose

# --- 3. CONFIGURAÇÃO DO DOCKER ---
echo_info "Iniciando e habilitando o serviço do Docker..."
sudo systemctl start docker
sudo systemctl enable docker

echo_info "Adicionando usuário atual ao grupo do Docker..."
sudo usermod -aG docker ${USER}
echo_warn "É necessário fazer logout e login novamente para que a permissão do Docker tenha efeito."
echo_warn "O script continuará, mas lembre-se de reconectar antes de executar comandos Docker."

# --- 4. CLONAR O REPOSITÓRIO ---
if [ -d "leman-negocios-imobiliarios" ]; then
    echo_warn "O diretório 'leman-negocios-imobiliarios' já existe. Pulando o clone."
else
    echo_info "Clonando o repositório do GitHub..."
    git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
fi

cd leman-negocios-imobiliarios

# --- 5. CONFIGURAÇÃO DO AMBIENTE ---
echo_info "Verificando o arquivo de ambiente .env.production..."
if [ -f ".env.production" ]; then
    echo_warn "O arquivo .env.production já existe. Verifique se as variáveis estão corretas."
else
    echo_warn "O arquivo .env.production não foi encontrado. Copiando do exemplo."
    cp .env.example .env.production
fi

echo_warn "=================================================================="
echo_warn "AÇÃO NECESSÁRIA: Edite o arquivo .env.production AGORA."
echo_warn "Use o comando: nano .env.production"
echo_warn "Altere JWT_SECRET, senhas, chaves de API e o e-mail do Certbot."
echo_warn "=================================================================="
read -p "Pressione [Enter] para continuar após editar o arquivo..."

# --- 6. SETUP DO CERTBOT (SSL) ---
echo_info "Criando diretórios para o Certbot..."
mkdir -p certbot/www certbot/conf

echo_info "Obtendo o certificado SSL... Isso pode levar um minuto."
# Extrai o e-mail e o domínio do .env para automação
CERTBOT_EMAIL=$(grep CERTBOT_EMAIL .env.production | cut -d '=' -f2 | tr -d '"')
CERTBOT_DOMAIN=$(grep CERTBOT_DOMAIN .env.production | cut -d '=' -f2 | tr -d '"')

docker-compose run --rm --entrypoint "\n  certbot certonly --webroot -w /var/www/certbot \n    --email $CERTBOT_EMAIL \n    --agree-tos \n    --no-eff-email \n    -d $CERTBOT_DOMAIN \n    --force-renewal"
  certbot

echo_info "Certificado SSL gerado com sucesso para $CERTBOT_DOMAIN!"

# --- 7. DEPLOY FINAL ---
echo_info "Construindo e iniciando os contêineres da aplicação..."
docker-compose up --build -d

echo_info "=================================================================="
echo_info "✅ SETUP CONCLUÍDO! ✅"
_info "Sua aplicação deve estar acessível em https://$CERTBOT_DOMAIN"
echo_info "Use 'docker-compose ps' para verificar o status dos contêineres."
echo_info "Use 'docker-compose logs -f app' para ver os logs da aplicação."
echo_info "=================================================================="

# Fim do script
