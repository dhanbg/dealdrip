import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { orders } from './orders.schema';

export const paymentTransactions = pgTable('payment_transactions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  method: text('method').notNull(),
  subtype: text('subtype'),
  amount: integer('amount').notNull(),
  transactionId: text('transaction_id'),
  status: text('status').notNull().default('VERIFIED'),
  senderIdentifier: text('sender_identifier'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).defaultNow().notNull(),
});

export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  order: one(orders, {
    fields: [paymentTransactions.orderId],
    references: [orders.id],
  }),
}));

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type NewPaymentTransaction = typeof paymentTransactions.$inferInsert;
