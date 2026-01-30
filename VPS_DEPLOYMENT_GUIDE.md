# 🚀 Guia de Deployment na VPS – Leman Negócios Imobiliários

**Domínio:** `leman.casadf.com.br`  
**Data:** 30 de janeiro de 2026

---

Este guia detalha o processo completo para fazer o deploy da aplicação na sua VPS (Virtual Private Server), incluindo a configuração do ambiente, a obtenção de certificados SSL com Let's Encrypt e a automação do processo de atualização.

## 📋 Pré-requisitos

Antes de começar, garanta que sua VPS atenda aos seguintes requisitos:

1.  **Sistema Operacional:** Ubuntu 22.04 LTS (recomendado).
2.  **Acesso:** Acesso `root` ou um usuário com privilégios `sudo`.
3.  **DNS Configurado:** O subdomínio `leman.casadf.com.br` deve estar apontando para o endereço de IP da sua VPS.

## ⚙️ ETAPA 1: Configuração Inicial do Servidor

Estes comandos preparam o ambiente da sua VPS, instalando as ferramentas necessárias para o deploy.

### 1.1. Atualizar o Sistema

Conecte-se à sua VPS via SSH e execute os seguintes comandos para atualizar os pacotes do sistema:

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2. Instalar Git, Docker e Docker Compose

O Git é necessário para clonar o repositório, e o Docker/Docker Compose são essenciais para orquestrar os contêineres da aplicação.

```bash
# Instalar Git
sudo apt install git -y

# Instalar Docker
sudo apt install docker.io -y
sudo systemctl start docker
sudo systemctl enable docker

# Adicionar seu usuário ao grupo do Docker para executar comandos sem sudo
sudo usermod -aG docker ${USER}
# IMPORTANTE: Faça logout e login novamente para que a alteração tenha efeito.

# Instalar Docker Compose
sudo apt install docker-compose -y
```

## 📦 ETAPA 2: Clonar e Configurar o Projeto

Agora, vamos clonar o projeto do GitHub e configurar as variáveis de ambiente.

### 2.1. Clonar o Repositório

Clone a versão mais recente do projeto para o diretório de sua preferência (ex: `/home/ubuntu/`):

```bash
cd /home/ubuntu
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios
```

### 2.2. Configurar o Arquivo de Ambiente (`.env.production`)

O arquivo `.env.production` contém informações sensíveis e configurações específicas do ambiente. **É crucial que você edite este arquivo antes de continuar.**

Use um editor de texto como o `nano` para editar o arquivo:

```bash
nano .env.production
```

**O que você PRECISA alterar:**

-   `JWT_SECRET`: Gere uma chave forte e única. Você pode usar o comando `openssl rand -base64 32` no seu terminal para criar uma.
-   `DB_PASSWORD`: Defina uma senha segura para o banco de dados.
-   `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`: Insira suas credenciais do Google Cloud para o login social.
-   `STORAGE_*`: Insira as credenciais do seu provedor de armazenamento de objetos (como AWS S3).
-   `CERTBOT_EMAIL`: Insira um e-mail válido para receber notificações sobre a expiração do seu certificado SSL.

Após editar, salve o arquivo (`Ctrl + X`, depois `Y` e `Enter`).

## 🔒 ETAPA 3: Obtenção do Certificado SSL com Certbot

Vamos usar o Certbot dentro de um contêiner Docker para gerar o certificado SSL para o seu domínio, garantindo a comunicação segura via HTTPS.

### 3.1. Criar Diretórios para o Certbot

O Certbot precisa de diretórios para armazenar os certificados e os desafios de validação.

```bash
mkdir -p certbot/www certbot/conf
```

### 3.2. Gerar o Certificado SSL

Execute o comando abaixo para solicitar um certificado para `leman.casadf.com.br`. O Certbot irá iniciar um servidor web temporário na porta 80 para validar a propriedade do domínio.

```bash
docker-compose run --rm --entrypoint "\n  certbot certonly --webroot -w /var/www/certbot \n    --email seu_email_para_notificacoes_do_certbot@exemplo.com \n    --agree-tos \n    --no-eff-email \n    -d leman.casadf.com.br \n    --force-renewal"
  certbot
```

**IMPORTANTE:** Substitua `seu_email_para_notificacoes_do_certbot@exemplo.com` pelo mesmo e-mail que você configurou no arquivo `.env.production`.

Se tudo ocorrer bem, você verá uma mensagem de sucesso, e os certificados estarão salvos em `certbot/conf/live/leman.casadf.com.br/`.

## 🚀 ETAPA 4: Fazer o Deploy da Aplicação

Com tudo configurado, agora é a hora de construir e iniciar os contêineres da aplicação.

### 4.1. Construir e Iniciar os Contêineres

Este comando irá ler o `docker-compose.yml`, construir a imagem da sua aplicação e iniciar todos os serviços (App, Nginx, Postgres, Redis) em segundo plano (`-d`).

```bash
docker-compose up --build -d
```

O processo pode levar alguns minutos na primeira vez. Após a conclusão, sua aplicação estará no ar e acessível em **https://leman.casadf.com.br**.

### 4.2. Verificar o Status dos Contêineres

Para garantir que todos os serviços estão rodando corretamente, use o comando:

```bash
docker-compose ps
```

Você deve ver todos os contêineres com o status `Up` ou `running`.

## 🔄 ETAPA 5: Atualizar a Aplicação

Quando houver novas atualizações no repositório do GitHub, siga estes passos para atualizar sua aplicação na VPS sem downtime significativo.

### 5.1. Puxar as Atualizações do Git

Navegue até o diretório do projeto e puxe as alterações do branch `master`.

```bash
cd /home/ubuntu/leman-negocios-imobiliarios
git pull origin master
```

### 5.2. Reconstruir e Reiniciar os Contêineres

Use o mesmo comando de deploy. O Docker Compose é inteligente o suficiente para reconstruir apenas os serviços que foram alterados (neste caso, o `app`).

```bash
docker-compose up --build -d
```

E pronto! Sua aplicação estará atualizada com a versão mais recente.

## 🛠️ Comandos Úteis de Gerenciamento

-   **Ver logs em tempo real:** `docker-compose logs -f app`
-   **Parar todos os serviços:** `docker-compose down`
-   **Reiniciar um serviço específico:** `docker-compose restart app`
-   **Acessar o shell do contêiner da aplicação:** `docker-compose exec app /bin/sh`
-   **Forçar a recriação de todos os contêineres:** `docker-compose up --build --force-recreate -d`

---

**Guia gerado por:** Manus AI - Senior Full Stack Architect
