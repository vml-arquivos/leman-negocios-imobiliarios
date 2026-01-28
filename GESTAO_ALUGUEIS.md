# 🏠 Sistema de Gestão de Aluguéis - Leman Negócios Imobiliários

## 📋 Visão Geral

Sistema completo de administração de locações com cálculos automáticos de comissões, repasses e relatórios financeiros.

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

1. **landlords** - Proprietários
   - Dados pessoais e de contato
   - Dados bancários (PIX, conta corrente)
   - Taxa de comissão personalizada
   - Status (ativo/inativo/bloqueado)

2. **tenants** - Inquilinos/Locatários
   - Dados pessoais e profissionais
   - Renda mensal
   - Contatos de emergência

3. **rental_contracts** - Contratos de Locação
   - Relacionamento: imóvel + proprietário + inquilino
   - Valores: aluguel, condomínio, IPTU
   - Comissão e forma de pagamento
   - Garantias e fiadores
   - Índice de reajuste (IGPM, IPCA)

4. **rental_payments** - Pagamentos de Aluguel
   - Valores detalhados (aluguel, taxas, multas)
   - Cálculo automático de comissão
   - Valor líquido para proprietário
   - Status e comprovantes

5. **property_expenses** - Despesas por Imóvel
   - Tipos: manutenção, reparo, IPTU, etc.
   - Responsável pelo pagamento
   - Comprovantes e fornecedores

6. **landlord_transfers** - Repasses aos Proprietários
   - Consolidação mensal
   - Total recebido, comissões e despesas
   - Valor líquido a repassar
   - Comprovantes de transferência

7. **rent_adjustments** - Histórico de Reajustes
   - Valores anterior e novo
   - Índice utilizado e percentual
   - Data de vigência

---

## 🔧 APIs Disponíveis

### Proprietários (`/api/trpc/rental.landlords`)

```typescript
// Criar proprietário
rental.landlords.create({
  name: "João Silva",
  cpfCnpj: "123.456.789-00",
  email: "joao@email.com",
  phone: "(61) 99999-9999",
  bankName: "Banco do Brasil",
  agencyNumber: "1234-5",
  accountNumber: "12345-6",
  pixKey: "joao@email.com",
  commissionRate: "10.00"
})

// Listar proprietários
rental.landlords.list({ status: "ativo" })

// Obter por ID
rental.landlords.getById({ id: 1 })

// Atualizar
rental.landlords.update({ id: 1, data: { ... } })
```

### Inquilinos (`/api/trpc/rental.tenants`)

```typescript
// Criar inquilino
rental.tenants.create({
  name: "Maria Santos",
  cpf: "987.654.321-00",
  email: "maria@email.com",
  phone: "(61) 98888-8888",
  occupation: "Médica",
  monthlyIncome: 15000 // em centavos
})

// Listar inquilinos
rental.tenants.list({ status: "ativo" })
```

### Contratos (`/api/trpc/rental.contracts`)

```typescript
// Criar contrato
rental.contracts.create({
  propertyId: 1,
  landlordId: 1,
  tenantId: 1,
  startDate: "2026-02-01",
  endDate: "2027-02-01",
  durationMonths: 12,
  rentAmount: 250000, // R$ 2.500,00 em centavos
  condoFee: 50000, // R$ 500,00
  iptu: 15000, // R$ 150,00
  commissionRate: "10.00",
  paymentDay: 5
})

// Listar contratos
rental.contracts.list({ landlordId: 1, status: "ativo" })
```

### Pagamentos (`/api/trpc/rental.payments`)

```typescript
// Criar pagamento
rental.payments.create({
  contractId: 1,
  propertyId: 1,
  landlordId: 1,
  tenantId: 1,
  referenceMonth: "2026-02",
  rentAmount: 250000,
  condoFee: 50000,
  iptu: 15000,
  commissionRate: "10.00",
  dueDate: "2026-02-05"
})

// Marcar como pago
rental.payments.markAsPaid({
  id: 1,
  paymentDate: "2026-02-05",
  paymentMethod: "pix",
  paymentProof: "url-do-comprovante"
})

// Gerar pagamentos do mês
rental.payments.generateMonthly({ referenceMonth: "2026-02" })
```

### Despesas (`/api/trpc/rental.expenses`)

```typescript
// Criar despesa
rental.expenses.create({
  propertyId: 1,
  landlordId: 1,
  expenseType: "manutencao",
  description: "Reparo no encanamento",
  amount: 35000, // R$ 350,00
  paidBy: "imobiliaria",
  expenseDate: "2026-02-10"
})

// Listar despesas
rental.expenses.list({ landlordId: 1, propertyId: 1 })
```

### Repasses (`/api/trpc/rental.transfers`)

```typescript
// Calcular repasse mensal
rental.transfers.calculate({
  landlordId: 1,
  referenceMonth: "2026-02"
})

// Listar repasses
rental.transfers.list({ landlordId: 1 })
```

### Relatórios (`/api/trpc/rental.reports`)

```typescript
// Relatório financeiro do proprietário
rental.reports.landlordFinancial({
  landlordId: 1,
  startMonth: "2026-01",
  endMonth: "2026-12"
})
```

---

## 💰 Cálculos Automáticos

### 1. Pagamento de Aluguel

```
Total a Receber = Aluguel + Condomínio + IPTU + Água + Gás + Outros + Multa + Juros - Desconto
Comissão = Aluguel × (Taxa de Comissão / 100)
Valor para Proprietário = Total Recebido - Comissão
```

### 2. Repasse Mensal

```
Total Recebido = Soma de todos os pagamentos recebidos no mês
Total de Comissões = Soma das comissões dos pagamentos
Total de Despesas = Soma das despesas pagas pela imobiliária
Valor Líquido = Total Recebido - Comissões - Despesas
```

### 3. Multa e Juros por Atraso

```
Multa = Aluguel × 2% (padrão)
Juros = Aluguel × 0,033% × Dias de Atraso (1% ao mês)
```

---

## 📊 Fluxo de Trabalho

### Mês 1 - Configuração

1. Cadastrar proprietário com dados bancários
2. Cadastrar inquilino
3. Criar contrato de locação
4. Sistema gera primeiro pagamento automaticamente

### Mês 2+ - Operação

1. **Dia 1 do mês**: Sistema gera pagamentos automaticamente
   ```typescript
   rental.payments.generateMonthly({ referenceMonth: "2026-02" })
   ```

2. **Inquilino paga**: Marcar pagamento como recebido
   ```typescript
   rental.payments.markAsPaid({ id, paymentDate, paymentMethod })
   ```

3. **Registrar despesas** (se houver)
   ```typescript
   rental.expenses.create({ ... })
   ```

4. **Dia 10 do mês**: Calcular e processar repasse
   ```typescript
   rental.transfers.calculate({ landlordId, referenceMonth })
   ```

5. **Transferir para proprietário**: Atualizar status do repasse
   ```typescript
   rental.transfers.update({ id, data: { status: "concluido" } })
   ```

---

## 📈 Relatórios Disponíveis

### 1. Extrato do Proprietário

- Pagamentos recebidos
- Comissões cobradas
- Despesas deduzidas
- Repasses realizados
- Saldo pendente

### 2. Relatório de Inadimplência

- Pagamentos atrasados
- Valor total em atraso
- Dias de atraso
- Histórico de pagamentos

### 3. DRE (Demonstrativo de Resultados)

- Receita total de aluguéis
- Comissões recebidas
- Despesas operacionais
- Lucro líquido

---

## 🔄 Automações Disponíveis

1. **Geração Automática de Pagamentos**
   - Executar todo dia 1º do mês
   - Cria pagamentos para todos os contratos ativos

2. **Cálculo de Multas e Juros**
   - Automático ao marcar pagamento como atrasado
   - Baseado na data de vencimento

3. **Notificações**
   - Vencimento de aluguel (3 dias antes)
   - Pagamento recebido
   - Repasse processado
   - Contrato próximo do vencimento

4. **Integração N8N**
   - Webhook ao receber pagamento
   - Webhook ao processar repasse
   - Envio automático de comprovantes via WhatsApp
   - Follow-up de inadimplência

---

## 🎯 Próximas Funcionalidades

- [ ] Dashboard visual com gráficos
- [ ] Geração automática de boletos
- [ ] Integração com bancos (Open Banking)
- [ ] Assinatura eletrônica de contratos
- [ ] Portal do proprietário (visualizar extratos)
- [ ] Portal do inquilino (pagar online)
- [ ] App mobile para gestão

---

## 📞 Suporte

Para dúvidas sobre o sistema de gestão de aluguéis:
- **Email**: contato@lemanimoveis.com.br
- **WhatsApp**: (61) 99868-7245
- **GitHub**: https://github.com/vml-arquivos/leman-negocios-imobiliarios

---

**Sistema desenvolvido por Manus AI** 🤖
