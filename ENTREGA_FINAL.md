# 🏠 Leman Negócios Imobiliários - Sistema Completo

## 📋 Resumo do Projeto

Sistema imobiliário completo desenvolvido para a **Leman Negócios Imobiliários**, especializada em imóveis de médio e alto padrão no Distrito Federal.

---

## ✅ Funcionalidades Implementadas

### 🎨 **Identidade Visual**
- Logo Leman Negócios Imobiliários (azul marinho + dourado)
- Cores: `#1a1f3c` (azul marinho) + `#c9a962` (dourado)
- Design responsivo para mobile, tablet e desktop
- 7 versões da logo otimizadas

### 🏘️ **Sistema de Imóveis**
- **12 imóveis fictícios** cadastrados
- Regiões: Vicente Pires, Águas Claras, Park Way, Arniqueiras, Sudoeste, Guará, Taguatinga
- Filtro avançado estilo QuintoAndar/ZAP Imóveis
- Cards com fotos, preço, características
- Páginas individuais de imóveis
- Comparação de imóveis
- Integração WhatsApp

### 📝 **Blog Imobiliário**
- **4 artigos** publicados
- Sistema de busca de posts
- Categorização de conteúdo
- SEO otimizado

### 📊 **Dashboard CRM**
- Visão geral de vendas
- Funil de vendas Kanban
- Gestão de leads
- Qualificação automática
- Perfil de clientes
- Analytics e relatórios

### 💰 **Gestão Financeira**
- Controle de aluguéis
- Cálculo automático de comissões
- Repasses aos proprietários
- Dashboard financeiro completo
- Relatórios detalhados
- **SEM necessidade de planilhas manuais**

### 🤖 **Integrações**
- N8N para automações
- WhatsApp Business
- Qualificação de leads via IA
- Webhooks configurados

---

## 🚀 Deploy

### **Repositório GitHub**
```
https://github.com/vml-arquivos/leman-negocios-imobiliarios
```

### **Tecnologias**
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + tRPC
- **Banco de Dados**: MySQL/MariaDB (compatível com PostgreSQL)
- **ORM**: Drizzle
- **Containerização**: Docker + Docker Compose

### **Variáveis de Ambiente**

Copie `.env.example` para `.env` e configure:

```bash
# Banco de Dados
DATABASE_URL="mysql://leman_user:leman_password@localhost:3306/leman_imoveis"

# Servidor
PORT=5000
NODE_ENV=production

# N8N Webhooks
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook
N8N_LEAD_QUALIFICATION_WEBHOOK=https://seu-n8n.com/webhook/qualify-lead

# WhatsApp (opcional)
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=

# Storage (opcional)
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

### **Instalação Local**

```bash
# 1. Clone o repositório
git clone https://github.com/vml-arquivos/leman-negocios-imobiliarios.git
cd leman-negocios-imobiliarios

# 2. Instale as dependências
pnpm install

# 3. Configure o banco de dados
cp .env.example .env
# Edite o .env com suas configurações

# 4. Crie as tabelas
pnpm db:push

# 5. Popule com dados de exemplo
npx tsx scripts/seed-leman-demo.ts

# 6. Inicie o servidor
pnpm dev
```

### **Deploy com Docker**

```bash
# 1. Configure o ambiente
cp .env.production .env

# 2. Suba os containers
docker-compose up -d

# 3. Acesse o sistema
http://localhost:5000
```

### **Deploy no Google Cloud**

Consulte o arquivo `DOCKER_DEPLOY.md` para instruções detalhadas de deploy em VPS Ubuntu no Google Cloud.

---

## 🔐 Credenciais de Acesso

### **Dashboard Admin**
- **URL**: `/admin`
- **Email**: `admin@lemannegocios.com.br`
- **Senha**: `leman@2026`

⚠️ **IMPORTANTE**: Altere a senha em produção!

---

## 📞 Informações de Contato

- **Nome**: Leman Negócios Imobiliários
- **Telefone**: (61) 99868-7245
- **Email**: contato@lemannegocios.com.br
- **Instagram**: @leman.negociosimob
- **Localização**: Brasília - DF

---

## 📊 Dados Cadastrados

### **Imóveis (12)**
1. Casa de Alto Padrão em Vicente Pires - R$ 1.850.000
2. Sobrado Moderno em Vicente Pires - R$ 980.000
3. Apartamento 3 Quartos em Águas Claras - R$ 650.000
4. Cobertura Duplex em Águas Claras - R$ 1.450.000
5. Mansão no Park Way - R$ 4.500.000
6. Apartamento Reformado no Sudoeste - R$ 890.000
7. Casa Térrea no Guará II - R$ 580.000
8. Apartamento 3 Quartos em Taguatinga - R$ 420.000
9. Chácara em Arniqueiras - R$ 1.200.000
10. Apartamento para Aluguel - Águas Claras - R$ 2.800/mês
11. Apartamento para Aluguel - Guará I - R$ 1.800/mês
12. Casa para Aluguel - Arniqueiras - R$ 4.500/mês

### **Blog (4 artigos)**
1. Guia Completo: Como Comprar seu Primeiro Imóvel no DF
2. Os Melhores Bairros para Investir em Brasília em 2026
3. Checklist: O que Verificar Antes de Alugar um Imóvel
4. Financiamento Imobiliário: Tudo que Você Precisa Saber

### **Leads (5 exemplos)**
- Diversos perfis de clientes em diferentes estágios do funil

---

## 🛠️ Estrutura do Projeto

```
leman-negocios-imobiliarios/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── lib/           # Utilitários
│   │   └── hooks/         # React hooks customizados
│   └── public/            # Assets estáticos
├── server/                # Backend Node.js
│   ├── _core/            # Configurações do servidor
│   ├── routers.ts        # Rotas tRPC
│   └── db.ts             # Funções de banco de dados
├── drizzle/              # Schema e migrações
├── scripts/              # Scripts de seed e utilitários
├── docker-compose.yml    # Configuração Docker
└── Dockerfile           # Imagem Docker
```

---

## 📚 Documentação Adicional

- `README.md` - Documentação principal
- `DOCKER_DEPLOY.md` - Guia de deploy com Docker
- `API_DOCUMENTATION.md` - Documentação da API
- `FINANCIAL_DASHBOARD_DOCS.md` - Documentação do dashboard financeiro

---

## 🎯 Próximos Passos

1. **Configurar N8N**: Criar workflows de automação
2. **Integrar WhatsApp**: Conectar API do WhatsApp Business
3. **Configurar Storage**: S3 ou similar para upload de imagens
4. **SSL/HTTPS**: Configurar certificado SSL no servidor
5. **Backup**: Implementar rotina de backup do banco de dados
6. **Monitoramento**: Configurar logs e alertas

---

## 📝 Changelog

### v1.0.0 (24/01/2026)
- ✅ Sistema completo desenvolvido
- ✅ 12 imóveis cadastrados
- ✅ 4 artigos de blog
- ✅ Dashboard CRM funcional
- ✅ Gestão financeira automática
- ✅ Identidade visual Leman
- ✅ Responsividade mobile
- ✅ Deploy no GitHub

---

## 📧 Suporte

Para dúvidas ou suporte técnico, entre em contato através do GitHub Issues:
https://github.com/vml-arquivos/leman-negocios-imobiliarios/issues

---

**Desenvolvido com ❤️ para Leman Negócios Imobiliários**
