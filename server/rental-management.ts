/**
 * Funções de Gestão de Aluguéis
 * Sistema completo de administração de locações
 */

import { db } from "./db";
import {
  landlords,
  tenants,
  rentalContracts,
  rentalPayments,
  propertyExpenses,
  landlordTransfers,
  rentAdjustments,
  type Landlord,
  type Tenant,
  type RentalContract,
  type RentalPayment,
  type PropertyExpense,
  type LandlordTransfer,
} from "../drizzle/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

// ============================================
// PROPRIETÁRIOS (LANDLORDS)
// ============================================

export async function createLandlord(data: typeof landlords.$inferInsert) {
  const [landlord] = await db.insert(landlords).values(data);
  return landlord;
}

export async function getLandlordById(id: number) {
  const [landlord] = await db.select().from(landlords).where(eq(landlords.id, id));
  return landlord;
}

export async function listLandlords(filters?: { status?: string }) {
  let query = db.select().from(landlords);
  
  if (filters?.status) {
    query = query.where(eq(landlords.status, filters.status as any));
  }
  
  return await query.orderBy(desc(landlords.createdAt));
}

export async function updateLandlord(id: number, data: Partial<typeof landlords.$inferInsert>) {
  await db.update(landlords).set(data).where(eq(landlords.id, id));
  return getLandlordById(id);
}

export async function deleteLandlord(id: number) {
  await db.delete(landlords).where(eq(landlords.id, id));
}

// ============================================
// LOCATÁRIOS (TENANTS)
// ============================================

export async function createTenant(data: typeof tenants.$inferInsert) {
  const [tenant] = await db.insert(tenants).values(data);
  return tenant;
}

export async function getTenantById(id: number) {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
  return tenant;
}

export async function listTenants(filters?: { status?: string }) {
  let query = db.select().from(tenants);
  
  if (filters?.status) {
    query = query.where(eq(tenants.status, filters.status as any));
  }
  
  return await query.orderBy(desc(tenants.createdAt));
}

export async function updateTenant(id: number, data: Partial<typeof tenants.$inferInsert>) {
  await db.update(tenants).set(data).where(eq(tenants.id, id));
  return getTenantById(id);
}

// ============================================
// CONTRATOS DE LOCAÇÃO
// ============================================

export async function createRentalContract(data: typeof rentalContracts.$inferInsert) {
  // Calcular comissão
  const commissionAmount = Math.round((data.rentAmount * Number(data.commissionRate)) / 100);
  
  const contractData = {
    ...data,
    commissionAmount,
  };
  
  const [contract] = await db.insert(rentalContracts).values(contractData);
  return contract;
}

export async function getRentalContractById(id: number) {
  const [contract] = await db.select().from(rentalContracts).where(eq(rentalContracts.id, id));
  return contract;
}

export async function listRentalContracts(filters?: {
  status?: string;
  landlordId?: number;
  tenantId?: number;
  propertyId?: number;
}) {
  let query = db.select().from(rentalContracts);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(rentalContracts.status, filters.status as any));
  if (filters?.landlordId) conditions.push(eq(rentalContracts.landlordId, filters.landlordId));
  if (filters?.tenantId) conditions.push(eq(rentalContracts.tenantId, filters.tenantId));
  if (filters?.propertyId) conditions.push(eq(rentalContracts.propertyId, filters.propertyId));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(rentalContracts.createdAt));
}

export async function updateRentalContract(id: number, data: Partial<typeof rentalContracts.$inferInsert>) {
  await db.update(rentalContracts).set(data).where(eq(rentalContracts.id, id));
  return getRentalContractById(id);
}

// ============================================
// PAGAMENTOS DE ALUGUEL
// ============================================

export async function createRentalPayment(data: typeof rentalPayments.$inferInsert) {
  // Calcular valores automaticamente
  const totalAmount = 
    data.rentAmount +
    (data.condoFee || 0) +
    (data.iptu || 0) +
    (data.waterBill || 0) +
    (data.gasBill || 0) +
    (data.otherCharges || 0) +
    (data.lateFee || 0) +
    (data.interest || 0) -
    (data.discount || 0);
  
  const commissionAmount = Math.round((data.rentAmount * Number(data.commissionRate)) / 100);
  const landlordAmount = totalAmount - commissionAmount;
  
  const paymentData = {
    ...data,
    totalAmount,
    commissionAmount,
    landlordAmount,
  };
  
  const [payment] = await db.insert(rentalPayments).values(paymentData);
  return payment;
}

export async function getRentalPaymentById(id: number) {
  const [payment] = await db.select().from(rentalPayments).where(eq(rentalPayments.id, id));
  return payment;
}

export async function listRentalPayments(filters?: {
  status?: string;
  contractId?: number;
  landlordId?: number;
  tenantId?: number;
  referenceMonth?: string;
}) {
  let query = db.select().from(rentalPayments);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(rentalPayments.status, filters.status as any));
  if (filters?.contractId) conditions.push(eq(rentalPayments.contractId, filters.contractId));
  if (filters?.landlordId) conditions.push(eq(rentalPayments.landlordId, filters.landlordId));
  if (filters?.tenantId) conditions.push(eq(rentalPayments.tenantId, filters.tenantId));
  if (filters?.referenceMonth) conditions.push(eq(rentalPayments.referenceMonth, filters.referenceMonth));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(rentalPayments.dueDate));
}

export async function updateRentalPayment(id: number, data: Partial<typeof rentalPayments.$inferInsert>) {
  await db.update(rentalPayments).set(data).where(eq(rentalPayments.id, id));
  return getRentalPaymentById(id);
}

export async function markPaymentAsPaid(id: number, paymentDate: Date, paymentMethod: string, paymentProof?: string) {
  await db.update(rentalPayments)
    .set({
      status: "pago",
      paymentDate: paymentDate.toISOString().split('T')[0],
      paymentMethod,
      paymentProof,
    })
    .where(eq(rentalPayments.id, id));
  
  return getRentalPaymentById(id);
}

// ============================================
// DESPESAS
// ============================================

export async function createPropertyExpense(data: typeof propertyExpenses.$inferInsert) {
  const [expense] = await db.insert(propertyExpenses).values(data);
  return expense;
}

export async function getPropertyExpenseById(id: number) {
  const [expense] = await db.select().from(propertyExpenses).where(eq(propertyExpenses.id, id));
  return expense;
}

export async function listPropertyExpenses(filters?: {
  status?: string;
  propertyId?: number;
  landlordId?: number;
  expenseType?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = db.select().from(propertyExpenses);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(propertyExpenses.status, filters.status as any));
  if (filters?.propertyId) conditions.push(eq(propertyExpenses.propertyId, filters.propertyId));
  if (filters?.landlordId) conditions.push(eq(propertyExpenses.landlordId, filters.landlordId));
  if (filters?.expenseType) conditions.push(eq(propertyExpenses.expenseType, filters.expenseType as any));
  if (filters?.startDate) conditions.push(gte(propertyExpenses.expenseDate, filters.startDate));
  if (filters?.endDate) conditions.push(lte(propertyExpenses.expenseDate, filters.endDate));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(propertyExpenses.expenseDate));
}

export async function updatePropertyExpense(id: number, data: Partial<typeof propertyExpenses.$inferInsert>) {
  await db.update(propertyExpenses).set(data).where(eq(propertyExpenses.id, id));
  return getPropertyExpenseById(id);
}

// ============================================
// REPASSES AOS PROPRIETÁRIOS
// ============================================

export async function createLandlordTransfer(data: typeof landlordTransfers.$inferInsert) {
  const [transfer] = await db.insert(landlordTransfers).values(data);
  return transfer;
}

export async function getLandlordTransferById(id: number) {
  const [transfer] = await db.select().from(landlordTransfers).where(eq(landlordTransfers.id, id));
  return transfer;
}

export async function listLandlordTransfers(filters?: {
  status?: string;
  landlordId?: number;
  referenceMonth?: string;
}) {
  let query = db.select().from(landlordTransfers);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(landlordTransfers.status, filters.status as any));
  if (filters?.landlordId) conditions.push(eq(landlordTransfers.landlordId, filters.landlordId));
  if (filters?.referenceMonth) conditions.push(eq(landlordTransfers.referenceMonth, filters.referenceMonth));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  
  return await query.orderBy(desc(landlordTransfers.referenceMonth));
}

export async function updateLandlordTransfer(id: number, data: Partial<typeof landlordTransfers.$inferInsert>) {
  await db.update(landlordTransfers).set(data).where(eq(landlordTransfers.id, id));
  return getLandlordTransferById(id);
}

// ============================================
// CÁLCULOS AUTOMÁTICOS
// ============================================

/**
 * Gera pagamentos de aluguel para um mês específico
 */
export async function generateMonthlyPayments(referenceMonth: string) {
  // Buscar contratos ativos
  const activeContracts = await db
    .select()
    .from(rentalContracts)
    .where(eq(rentalContracts.status, "ativo"));
  
  const payments = [];
  
  for (const contract of activeContracts) {
    // Verificar se já existe pagamento para este mês
    const existing = await db
      .select()
      .from(rentalPayments)
      .where(
        and(
          eq(rentalPayments.contractId, contract.id),
          eq(rentalPayments.referenceMonth, referenceMonth)
        )
      );
    
    if (existing.length === 0) {
      // Criar pagamento
      const [year, month] = referenceMonth.split('-');
      const dueDate = new Date(parseInt(year), parseInt(month) - 1, contract.paymentDay);
      
      const payment = await createRentalPayment({
        contractId: contract.id,
        propertyId: contract.propertyId,
        landlordId: contract.landlordId,
        tenantId: contract.tenantId,
        referenceMonth,
        rentAmount: contract.rentAmount,
        condoFee: contract.condoFee,
        iptu: contract.iptu,
        waterBill: contract.waterBill,
        gasBill: contract.gasBill,
        commissionRate: contract.commissionRate,
        dueDate: dueDate.toISOString().split('T')[0],
        status: "pendente",
      });
      
      payments.push(payment);
    }
  }
  
  return payments;
}

/**
 * Calcula e cria repasse para um proprietário em um mês específico
 */
export async function calculateLandlordTransfer(landlordId: number, referenceMonth: string) {
  // Buscar pagamentos recebidos do proprietário no mês
  const payments = await db
    .select()
    .from(rentalPayments)
    .where(
      and(
        eq(rentalPayments.landlordId, landlordId),
        eq(rentalPayments.referenceMonth, referenceMonth),
        eq(rentalPayments.status, "pago")
      )
    );
  
  // Buscar despesas do proprietário no mês
  const [year, month] = referenceMonth.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
  
  const expenses = await db
    .select()
    .from(propertyExpenses)
    .where(
      and(
        eq(propertyExpenses.landlordId, landlordId),
        eq(propertyExpenses.paidBy, "imobiliaria"),
        gte(propertyExpenses.expenseDate, startDate),
        lte(propertyExpenses.expenseDate, endDate)
      )
    );
  
  // Calcular totais
  const totalRentReceived = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalCommissions = payments.reduce((sum, p) => sum + p.commissionAmount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netAmount = totalRentReceived - totalCommissions - totalExpenses;
  
  // Criar repasse
  const transfer = await createLandlordTransfer({
    landlordId,
    referenceMonth,
    totalRentReceived,
    totalCommissions,
    totalExpenses,
    netAmount,
    paymentsIncluded: JSON.stringify(payments.map(p => p.id)),
    expensesIncluded: JSON.stringify(expenses.map(e => e.id)),
    status: "pendente",
  });
  
  return transfer;
}

/**
 * Gera relatório financeiro de um proprietário
 */
export async function getLandlordFinancialReport(landlordId: number, startMonth: string, endMonth: string) {
  const payments = await db
    .select()
    .from(rentalPayments)
    .where(
      and(
        eq(rentalPayments.landlordId, landlordId),
        gte(rentalPayments.referenceMonth, startMonth),
        lte(rentalPayments.referenceMonth, endMonth)
      )
    )
    .orderBy(rentalPayments.referenceMonth);
  
  const expenses = await db
    .select()
    .from(propertyExpenses)
    .where(
      and(
        eq(propertyExpenses.landlordId, landlordId),
        gte(propertyExpenses.expenseDate, `${startMonth}-01`),
        lte(propertyExpenses.expenseDate, `${endMonth}-31`)
      )
    )
    .orderBy(propertyExpenses.expenseDate);
  
  const transfers = await db
    .select()
    .from(landlordTransfers)
    .where(
      and(
        eq(landlordTransfers.landlordId, landlordId),
        gte(landlordTransfers.referenceMonth, startMonth),
        lte(landlordTransfers.referenceMonth, endMonth)
      )
    )
    .orderBy(landlordTransfers.referenceMonth);
  
  return {
    payments,
    expenses,
    transfers,
    summary: {
      totalRentReceived: payments.reduce((sum, p) => sum + (p.status === "pago" ? p.totalAmount : 0), 0),
      totalCommissions: payments.reduce((sum, p) => sum + (p.status === "pago" ? p.commissionAmount : 0), 0),
      totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalTransferred: transfers.reduce((sum, t) => sum + (t.status === "concluido" ? t.netAmount : 0), 0),
      pendingPayments: payments.filter(p => p.status === "pendente").length,
      latePayments: payments.filter(p => p.status === "atrasado").length,
    },
  };
}
