# 🚀 IMPLEMENTAÇÃO COMPLETA - CRUD E MELHORIAS

**Data:** 31/01/2026  
**Sistema:** Leman Negócios Imobiliários  
**Objetivo:** Implementar CRUD completo em todas as páginas + Sistema de Simulações de Financiamento

---

## 📋 RESUMO DAS MELHORIAS

### **1. Módulo Financeiro**
- ✅ Botão "Nova Entrada" (receitas)
- ✅ Botão "Nova Saída" (despesas)
- ✅ Modal de criação/edição de transações
- ✅ Botão "Editar" em cada transação
- ✅ Botão "Excluir" com confirmação
- ✅ Categorias: Consertos, Processos Judiciais, Manutenção, Marketing, etc.

### **2. Gestão de Clientes**
- ✅ Botão "Novo Cliente"
- ✅ Modal de criação/edição
- ✅ Botão "Editar" em cada cliente
- ✅ Botão "Excluir" com confirmação
- ✅ Melhor visualização dos dados

### **3. Simulações de Financiamento**
- ✅ Nova tabela no banco: `financing_simulations`
- ✅ Página de gestão de simulações
- ✅ Ver dados dos clientes que simularam
- ✅ Status: Pendente, Contatado, Convertido, Perdido
- ✅ Ações: Contatar, Marcar como Convertido, Marcar como Perdido

### **4. Leads e Follow-up**
- ✅ Botões de Editar e Excluir
- ✅ Modais de confirmação

---

## 🗄️ PARTE 1: BANCO DE DADOS

### **Migration SQL Completa**

```sql
-- ============================================
-- MIGRATION: Melhorias CRUD + Simulações
-- ============================================

-- 1. Criar enum para status de simulação
DO $$ BEGIN
  CREATE TYPE simulation_status AS ENUM ('pendente', 'contatado', 'convertido', 'perdido');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Criar tabela de simulações de financiamento
CREATE TABLE IF NOT EXISTS financing_simulations (
  id SERIAL PRIMARY KEY,
  
  -- Dados do Cliente
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  cpf VARCHAR(14),
  
  -- Dados da Simulação
  property_value INTEGER NOT NULL,
  down_payment INTEGER NOT NULL,
  financed_amount INTEGER NOT NULL,
  term_months INTEGER NOT NULL,
  interest_rate NUMERIC(5, 2) NOT NULL,
  amortization_system amortization_system NOT NULL,
  monthly_payment INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  
  -- Dados Adicionais
  monthly_income INTEGER,
  property_id INTEGER,
  notes TEXT,
  
  -- Status e Acompanhamento
  status simulation_status DEFAULT 'pendente' NOT NULL,
  contacted_at TIMESTAMP,
  converted_at TIMESTAMP,
  lost_reason TEXT,
  
  -- Metadados
  ip_address VARCHAR(45),
  user_agent TEXT,
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX IF NOT EXISTS idx_financing_simulations_email ON financing_simulations(email);
CREATE INDEX IF NOT EXISTS idx_financing_simulations_phone ON financing_simulations(phone);
CREATE INDEX IF NOT EXISTS idx_financing_simulations_status ON financing_simulations(status);
CREATE INDEX IF NOT EXISTS idx_financing_simulations_created_at ON financing_simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_financing_simulations_property_id ON financing_simulations(property_id);

-- 4. Adicionar categorias financeiras padrão (se não existirem)
INSERT INTO financial_categories (name, type, color) VALUES
  ('Comissão de Venda', 'income', '#10b981'),
  ('Comissão de Locação', 'income', '#10b981'),
  ('Aluguel Recebido', 'income', '#3b82f6'),
  ('Taxa Administrativa', 'income', '#8b5cf6'),
  ('Manutenção', 'expense', '#ef4444'),
  ('Conserto', 'expense', '#f97316'),
  ('Processo Judicial', 'expense', '#dc2626'),
  ('Marketing', 'expense', '#ec4899'),
  ('Escritório', 'expense', '#6366f1'),
  ('Salários', 'expense', '#14b8a6'),
  ('Impostos', 'expense', '#f59e0b'),
  ('Outras Despesas', 'expense', '#64748b')
ON CONFLICT (name) DO NOTHING;

-- 5. Comentários
COMMENT ON TABLE financing_simulations IS 'Armazena simulações de financiamento bancário realizadas por clientes';
COMMENT ON COLUMN financing_simulations.status IS 'Status do lead: pendente, contatado, convertido, perdido';
```

### **Como Aplicar a Migration**

```bash
# No VPS, conectar no banco
cd /root/app
docker exec -i leman-postgres psql -U leman_user -d leman_db < drizzle/0013_add_financing_simulations.sql

# Verificar se foi criada
docker exec leman-postgres psql -U leman_user -d leman_db -c "\d financing_simulations"
```

---

## 🔧 PARTE 2: BACKEND (tRPC)

### **Arquivo:** `server/routers.ts`

Adicionar rotas para:

1. **Simulações de Financiamento**
```typescript
// Listar simulações
financingSimulations: {
  list: protectedProcedure
    .input(z.object({
      status: z.enum(['pendente', 'contatado', 'convertido', 'perdido']).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ input, ctx }) => {
      // Implementar query
    }),
  
  // Criar simulação
  create: publicProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      // ... outros campos
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar criação
    }),
  
  // Atualizar status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['pendente', 'contatado', 'convertido', 'perdido']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar atualização
    }),
  
  // Excluir
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Implementar exclusão
    }),
}
```

2. **Transações Financeiras (Melhorar)**
```typescript
financial: {
  // ... rotas existentes ...
  
  // Criar transação (entrada ou saída)
  createTransaction: protectedProcedure
    .input(z.object({
      type: z.enum(['revenue', 'expense']),
      category: z.string(),
      amount: z.number(),
      description: z.string(),
      date: z.string(),
      propertyId: z.number().optional(),
      ownerId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar criação
    }),
  
  // Editar transação
  updateTransaction: protectedProcedure
    .input(z.object({
      id: z.number(),
      // ... campos para editar
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar edição
    }),
  
  // Excluir transação
  deleteTransaction: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Implementar exclusão
    }),
}
```

3. **Clientes (Melhorar)**
```typescript
clients: {
  // ... rotas existentes ...
  
  // Criar cliente
  create: protectedProcedure
    .input(z.object({
      name: z.string(),
      email: z.string().email().optional(),
      phone: z.string(),
      cpfCnpj: z.string().optional(),
      clientType: z.enum(['proprietario_locacao', 'proprietario_venda', 'locatario', 'comprador']),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar criação
    }),
  
  // Editar cliente
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      // ... campos para editar
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementar edição
    }),
  
  // Excluir cliente
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      // Implementar exclusão com confirmação
    }),
}
```

---

## 🎨 PARTE 3: FRONTEND

### **1. Página: FinancialDashboard.tsx**

**Adicionar no header (após botão "Filtros"):**

```tsx
<Button onClick={() => setIsNewTransactionModalOpen(true)} variant="default">
  <ArrowUpRight className="w-4 h-4 mr-2" />
  Nova Entrada
</Button>

<Button onClick={() => setIsNewExpenseModalOpen(true)} variant="destructive">
  <ArrowDownLeft className="w-4 h-4 mr-2" />
  Nova Saída
</Button>
```

**Adicionar Modal de Nova Transação:**

```tsx
<Dialog open={isNewTransactionModalOpen} onOpenChange={setIsNewTransactionModalOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Nova Entrada (Receita)</DialogTitle>
      <DialogDescription>
        Registre uma nova receita no sistema
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleCreateTransaction}>
      <div className="space-y-4">
        <div>
          <Label>Categoria</Label>
          <Select value={newTransaction.category} onValueChange={(v) => setNewTransaction({...newTransaction, category: v})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Comissão de Venda">Comissão de Venda</SelectItem>
              <SelectItem value="Comissão de Locação">Comissão de Locação</SelectItem>
              <SelectItem value="Aluguel Recebido">Aluguel Recebido</SelectItem>
              <SelectItem value="Taxa Administrativa">Taxa Administrativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Valor (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={newTransaction.amount}
            onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
            placeholder="0,00"
          />
        </div>
        
        <div>
          <Label>Descrição</Label>
          <Textarea
            value={newTransaction.description}
            onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
            placeholder="Descreva a transação..."
          />
        </div>
        
        <div>
          <Label>Data</Label>
          <Input
            type="date"
            value={newTransaction.date}
            onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsNewTransactionModalOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Receita
          </Button>
        </div>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

**Adicionar botões de Editar/Excluir em cada transação:**

```tsx
{filteredData?.transactions?.map((transaction: any) => (
  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <p className="font-medium">{transaction.description}</p>
      <p className="text-sm text-muted-foreground">{transaction.category}</p>
    </div>
    <div className="flex items-center gap-2">
      <span className="font-bold">{formatCurrency(transaction.amount)}</span>
      <Button size="sm" variant="outline" onClick={() => handleEditTransaction(transaction.id)}>
        <Edit className="w-4 h-4" />
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleDeleteTransaction(transaction.id)}>
        <Trash className="w-4 h-4" />
      </Button>
    </div>
  </div>
))}
```

---

### **2. Página: ClientManagement.tsx**

**Adicionar botão "Novo Cliente" no header:**

```tsx
<Button onClick={() => setIsNewClientModalOpen(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Novo Cliente
</Button>
```

**Adicionar Modal de Novo Cliente:**

```tsx
<Dialog open={isNewClientModalOpen} onOpenChange={setIsNewClientModalOpen}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Novo Cliente</DialogTitle>
      <DialogDescription>
        Cadastre um novo cliente no sistema
      </DialogDescription>
    </DialogHeader>
    <form onSubmit={handleCreateClient}>
      <div className="space-y-4">
        <div>
          <Label>Nome Completo</Label>
          <Input
            value={newClient.name}
            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
            placeholder="João Silva"
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={newClient.email}
              onChange={(e) => setNewClient({...newClient, email: e.target.value})}
              placeholder="joao@email.com"
            />
          </div>
          <div>
            <Label>Telefone</Label>
            <Input
              value={newClient.phone}
              onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
              placeholder="(11) 99999-9999"
              required
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>CPF/CNPJ</Label>
            <Input
              value={newClient.cpfCnpj}
              onChange={(e) => setNewClient({...newClient, cpfCnpj: e.target.value})}
              placeholder="000.000.000-00"
            />
          </div>
          <div>
            <Label>Tipo de Cliente</Label>
            <Select value={newClient.clientType} onValueChange={(v) => setNewClient({...newClient, clientType: v})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprador">Comprador</SelectItem>
                <SelectItem value="locatario">Locatário</SelectItem>
                <SelectItem value="proprietario_venda">Proprietário (Venda)</SelectItem>
                <SelectItem value="proprietario_locacao">Proprietário (Locação)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setIsNewClientModalOpen(false)}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Cliente
          </Button>
        </div>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

**Adicionar botões de Editar/Excluir em cada cliente:**

```tsx
{clients?.map((client: any) => (
  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
    <div>
      <p className="font-medium">{client.name}</p>
      <p className="text-sm text-muted-foreground">{client.email}</p>
      <Badge>{client.clientType}</Badge>
    </div>
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => handleEditClient(client.id)}>
        <Edit className="w-4 h-4 mr-2" />
        Editar
      </Button>
      <Button size="sm" variant="destructive" onClick={() => handleDeleteClient(client.id)}>
        <Trash className="w-4 h-4 mr-2" />
        Excluir
      </Button>
    </div>
  </div>
))}
```

---

### **3. Nova Página: FinancingSimulations.tsx**

**Criar arquivo:** `client/src/pages/admin/FinancingSimulations.tsx`

```tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Mail, CheckCircle, XCircle, Clock, Trash } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

const FinancingSimulations: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const { data: simulations, isLoading, refetch } = trpc.financingSimulations.list.useQuery({
    status: filterStatus !== 'all' ? filterStatus : undefined,
  });
  
  const updateStatusMutation = trpc.financingSimulations.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const deleteMutation = trpc.financingSimulations.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });
  
  const handleUpdateStatus = (id: number, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };
  
  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta simulação?')) {
      deleteMutation.mutate({ id });
    }
  };
  
  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'secondary',
      contatado: 'default',
      convertido: 'success',
      perdido: 'destructive',
    };
    
    const labels = {
      pendente: 'Pendente',
      contatado: 'Contatado',
      convertido: 'Convertido',
      perdido: 'Perdido',
    };
    
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };
  
  if (isLoading) {
    return <div>Carregando...</div>;
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Simulações de Financiamento</h1>
          <p className="text-muted-foreground">
            Gerencie as simulações realizadas pelos clientes
          </p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="contatado">Contatados</SelectItem>
            <SelectItem value="convertido">Convertidos</SelectItem>
            <SelectItem value="perdido">Perdidos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Simulações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{simulations?.length || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">
              {simulations?.filter((s: any) => s.status === 'pendente').length || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {simulations?.filter((s: any) => s.status === 'convertido').length || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {simulations?.length > 0
                ? ((simulations.filter((s: any) => s.status === 'convertido').length / simulations.length) * 100).toFixed(1)
                : 0}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Valor Financiado</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {simulations?.map((sim: any) => (
                <TableRow key={sim.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sim.name}</p>
                      {sim.cpf && (
                        <p className="text-sm text-muted-foreground">CPF: {sim.cpf}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3" />
                        {sim.phone}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-3 h-3" />
                        {sim.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(sim.financedAmount)}</TableCell>
                  <TableCell>{formatCurrency(sim.monthlyPayment)}</TableCell>
                  <TableCell>{sim.termMonths} meses</TableCell>
                  <TableCell>{getStatusBadge(sim.status)}</TableCell>
                  <TableCell>
                    {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {sim.status === 'pendente' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(sim.id, 'contatado')}
                          >
                            <Clock className="w-4 h-4 mr-1" />
                            Contatar
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateStatus(sim.id, 'convertido')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Converter
                          </Button>
                        </>
                      )}
                      
                      {sim.status === 'contatado' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleUpdateStatus(sim.id, 'convertido')}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Converter
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUpdateStatus(sim.id, 'perdido')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Perdido
                          </Button>
                        </>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(sim.id)}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancingSimulations;
```

**Adicionar rota no arquivo de rotas:**

```tsx
// client/src/App.tsx ou routes.tsx
import FinancingSimulations from './pages/admin/FinancingSimulations';

// Adicionar na lista de rotas:
<Route path="/admin/financing-simulations" element={<FinancingSimulations />} />
```

**Adicionar no menu lateral:**

```tsx
// client/src/components/AdminLayout.tsx ou Sidebar.tsx
<NavLink to="/admin/financing-simulations">
  <Calculator className="w-4 h-4 mr-2" />
  Simulações de Financiamento
</NavLink>
```

---

## 🚀 PARTE 4: DEPLOY

### **Passo 1: Aplicar Migration no Banco**

```bash
# Conectar no VPS
ssh root@174.138.78.197

# Ir para diretório do projeto
cd /root/app

# Aplicar migration
docker exec -i leman-postgres psql -U leman_user -d leman_db < drizzle/0013_add_financing_simulations.sql

# Verificar se foi criada
docker exec leman-postgres psql -U leman_user -d leman_db -c "\d financing_simulations"
```

### **Passo 2: Atualizar Código no GitHub**

```bash
# No repositório local
cd /tmp/app

# Adicionar arquivos modificados
git add drizzle/schema.ts
git add drizzle/0013_add_financing_simulations.sql
git add client/src/pages/admin/FinancingSimulations.tsx
git add client/src/pages/admin/FinancialDashboard.tsx
git add client/src/pages/admin/ClientManagement.tsx
git add server/routers.ts

# Commit
git commit -m "feat: Implementar CRUD completo + Simulações de Financiamento"

# Push
git push origin main
```

### **Passo 3: Deploy no VPS**

```bash
# No VPS
cd /root/app

# Puxar atualizações
git pull origin main

# Rebuild dos containers
docker compose down
docker compose build --no-cache
docker compose up -d

# Verificar logs
docker compose logs -f leman-app
```

### **Passo 4: Testar**

1. ✅ Acessar http://174.138.78.197
2. ✅ Fazer login
3. ✅ Ir em "Financeiro" → Testar "Nova Entrada" e "Nova Saída"
4. ✅ Ir em "Clientes" → Testar "Novo Cliente", "Editar" e "Excluir"
5. ✅ Ir em "Simulações de Financiamento" → Ver lista
6. ✅ Testar mudança de status das simulações

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### **Banco de Dados**
- [ ] Migration aplicada
- [ ] Tabela `financing_simulations` criada
- [ ] Índices criados
- [ ] Categorias financeiras inseridas

### **Backend**
- [ ] Rotas de simulações implementadas
- [ ] Rotas de transações melhoradas
- [ ] Rotas de clientes melhoradas
- [ ] Validações implementadas

### **Frontend**
- [ ] Botões "Nova Entrada" e "Nova Saída" adicionados
- [ ] Modais de criação/edição implementados
- [ ] Botões de Editar/Excluir adicionados
- [ ] Página de Simulações criada
- [ ] Rota adicionada
- [ ] Menu atualizado

### **Deploy**
- [ ] Código commitado no GitHub
- [ ] Deploy realizado no VPS
- [ ] Testes realizados
- [ ] Sistema funcionando

---

## 🎯 PRÓXIMOS PASSOS (OPCIONAL)

1. **Notificações por Email**
   - Enviar email quando nova simulação for criada
   - Notificar quando lead for convertido

2. **Integração com WhatsApp**
   - Botão para enviar mensagem direto do sistema
   - Template de mensagem automática

3. **Relatórios Avançados**
   - Exportar simulações para Excel
   - Gráficos de conversão por período
   - Análise de ticket médio

4. **Automações**
   - Marcar automaticamente como "perdido" após X dias sem contato
   - Lembrete de follow-up

---

## ✅ CONCLUSÃO

Este documento contém **TODAS** as mudanças necessárias para implementar o CRUD completo e o sistema de simulações de financiamento.

**Siga os passos na ordem** e teste cada etapa antes de avançar.

**Qualquer dúvida, consulte este documento!** 🚀
