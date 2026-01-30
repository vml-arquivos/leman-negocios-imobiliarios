
import { z } from 'zod';
import { createRouter, protectedProcedure } from '../trpc';
import { db } from '../db';
import { transactions, contracts, financialCategories } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const financeRouter = createRouter({
  processRentPayment: protectedProcedure
    .input(z.object({ transactionId: z.number() }))
    .mutation(async ({ input }) => {
      const { transactionId } = input;

      // 1. Obter a transação de aluguel original (entrada)
      const rentalPayment = await db.query.transactions.findFirst({
        where: eq(transactions.id, transactionId),
      });

      if (!rentalPayment) {
        throw new Error('Transação de aluguel não encontrada.');
      }

      if (rentalPayment.type !== 'revenue' || rentalPayment.category !== 'Aluguel') {
        throw new Error('A transação não é um pagamento de aluguel válido.');
      }

      // 2. Encontrar o contrato de aluguel associado
      const rentalContract = await db.query.contracts.findFirst({
        where: eq(contracts.propertyId, rentalPayment.propertyId),
      });

      if (!rentalContract || !rentalContract.isActiveRental) {
        throw new Error('Contrato de aluguel ativo não encontrado para esta propriedade.');
      }

      // 3. Calcular a taxa de administração e o valor líquido para o proprietário
      const adminFeePercent = rentalContract.adminFeePercent || 10; // Default 10%
      const rentAmount = parseFloat(rentalPayment.amount);
      const adminFee = (rentAmount * adminFeePercent) / 100;
      const netAmount = rentAmount - adminFee;

      // 4. Criar a transação de repasse para o proprietário (saída)
      const [ownerTransfer] = await db.insert(transactions).values({
        type: 'expense',
        category: 'Repasse Proprietário',
        amount: netAmount.toString(),
        currency: 'BRL',
        propertyId: rentalPayment.propertyId,
        ownerId: rentalContract.ownerId,
        description: `Repasse de aluguel para proprietário (Contrato #${rentalContract.id})`,
        status: 'pending',
        parentTransactionId: transactionId, // Vincula ao pagamento original
        dueDate: new Date(), // Pode ser ajustado conforme regras de negócio
      }).returning();

      // 5. (Opcional) Criar a transação da taxa de administração para a imobiliária
      const [adminFeeTransaction] = await db.insert(transactions).values({
        type: 'revenue',
        category: 'Taxa de Administração',
        amount: adminFee.toString(),
        currency: 'BRL',
        propertyId: rentalPayment.propertyId,
        ownerId: rentalContract.ownerId,
        description: `Taxa de administração (Contrato #${rentalContract.id})`,
        status: 'paid',
        parentTransactionId: transactionId, // Vincula ao pagamento original
        paymentDate: new Date(),
      }).returning();

      return {
        success: true,
        message: 'Processamento de aluguel concluído com sucesso!',
        ownerTransferId: ownerTransfer.id,
        adminFeeTransactionId: adminFeeTransaction.id,
      };
    }),
});
