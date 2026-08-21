import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { DatabaseService } from '../../database/database.service';
import * as schema from '../../database/schema';
import { eq, desc } from 'drizzle-orm';

export interface OrderRecord {
  orderId: string;
  userId?: string;
  date: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  notes?: string;
  paymentMethod: string;
  cart: {
    plan: 'single' | 'duo';
    quantity: number;
    couponCode?: string;
    discountAmount?: number;
    discountPercentage?: number;
  };
  subtotal: number;
  discount: number;
  total: number;
  trackingHistory: Array<{
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(private readonly dbService: DatabaseService) {}

  private readonly fallbackOrders: Map<string, OrderRecord> = new Map();

  async createOrder(dto: CreateOrderDto): Promise<OrderRecord> {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const orderId = `DD-${year}-${randomSuffix}`;
    const now = new Date();

    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const fallbackRecord: OrderRecord = {
      orderId,
      userId: dto.userId || undefined,
      date: formattedDate,
      createdAt: now.toISOString(),
      status: OrderStatus.CONFIRMED,
      customerName: dto.customerName,
      phone: dto.phone,
      email: dto.email || 'Not provided',
      province: dto.province,
      city: dto.city,
      address: dto.address,
      notes: dto.notes,
      paymentMethod: dto.paymentMethod,
      cart: dto.cart,
      subtotal: dto.subtotal,
      discount: dto.discount,
      total: dto.total,
      trackingHistory: [
        {
          status: OrderStatus.CONFIRMED,
          timestamp: now.toISOString(),
          note: 'Order placed and confirmed. Ready for packaging.',
        },
      ],
    };

    if (this.dbService.isConnected) {
      try {
        const result = await this.dbService.db.transaction(async (tx) => {
          const [order] = await tx
            .insert(schema.orders)
            .values({
              id: orderId,
              userId: dto.userId || null,
              customerName: dto.customerName,
              phone: dto.phone,
              email: dto.email || null,
              province: dto.province,
              city: dto.city,
              address: dto.address,
              notes: dto.notes || null,
              paymentMethod: dto.paymentMethod,
              planId: dto.cart.plan,
              quantity: dto.cart.quantity,
              couponCode: dto.cart.couponCode || null,
              subtotal: dto.subtotal,
              discount: dto.discount,
              total: dto.total,
              status: 'CONFIRMED',
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          const [tracking] = await tx
            .insert(schema.trackingEvents)
            .values({
              orderId: order.id,
              status: 'CONFIRMED',
              note: 'Order placed and confirmed. Ready for packaging.',
              timestamp: now,
            })
            .returning();

          return { order, trackingHistory: [tracking] };
        });

        return {
          orderId: result.order.id,
          date: formattedDate,
          createdAt: result.order.createdAt.toISOString(),
          status: result.order.status as OrderStatus,
          customerName: result.order.customerName,
          phone: result.order.phone,
          email: result.order.email || 'Not provided',
          province: result.order.province,
          city: result.order.city,
          address: result.order.address,
          notes: result.order.notes || undefined,
          paymentMethod: result.order.paymentMethod,
          cart: {
            plan: result.order.planId as 'single' | 'duo',
            quantity: result.order.quantity,
            couponCode: result.order.couponCode || undefined,
            discountAmount: dto.cart.discountAmount,
            discountPercentage: dto.cart.discountPercentage,
          },
          subtotal: result.order.subtotal,
          discount: result.order.discount,
          total: result.order.total,
          trackingHistory: result.trackingHistory.map((t) => ({
            status: t.status as OrderStatus,
            timestamp: t.timestamp.toISOString(),
            note: t.note || undefined,
          })),
        };
      } catch (e) {
        // Fallback
      }
    }

    this.fallbackOrders.set(orderId, fallbackRecord);
    return fallbackRecord;
  }

  async getOrderById(orderId: string): Promise<OrderRecord> {
    if (this.dbService.isConnected) {
      try {
        const order = await this.dbService.db.query.orders.findFirst({
          where: (o, { eq }) => eq(o.id, orderId),
          with: { trackingHistory: true },
        });

        if (order) {
          const date = order.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return {
            orderId: order.id,
            date,
            createdAt: order.createdAt.toISOString(),
            status: order.status as OrderStatus,
            customerName: order.customerName,
            phone: order.phone,
            email: order.email || 'Not provided',
            province: order.province,
            city: order.city,
            address: order.address,
            notes: order.notes || undefined,
            paymentMethod: order.paymentMethod,
            cart: {
              plan: order.planId as 'single' | 'duo',
              quantity: order.quantity,
              couponCode: order.couponCode || undefined,
            },
            subtotal: order.subtotal,
            discount: order.discount,
            total: order.total,
            trackingHistory: order.trackingHistory.map((t) => ({
              status: t.status as OrderStatus,
              timestamp: t.timestamp.toISOString(),
              note: t.note || undefined,
            })),
          };
        }
      } catch (e) {
        // Fallback
      }
    }

    const fallback = this.fallbackOrders.get(orderId);
    if (!fallback) {
      throw new NotFoundException(`Order with ID "${orderId}" was not found.`);
    }
    return fallback;
  }

  async listOrders(limit: number = 50): Promise<OrderRecord[]> {
    if (this.dbService.isConnected) {
      try {
        const orders = await this.dbService.db.query.orders.findMany({
          limit,
          orderBy: (o, { desc }) => [desc(o.createdAt)],
          with: { trackingHistory: true },
        });

        return orders.map((order) => ({
          orderId: order.id,
          date: order.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: order.createdAt.toISOString(),
          status: order.status as OrderStatus,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email || 'Not provided',
          province: order.province,
          city: order.city,
          address: order.address,
          notes: order.notes || undefined,
          paymentMethod: order.paymentMethod,
          cart: {
            plan: order.planId as 'single' | 'duo',
            quantity: order.quantity,
            couponCode: order.couponCode || undefined,
          },
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          trackingHistory: order.trackingHistory.map((t) => ({
            status: t.status as OrderStatus,
            timestamp: t.timestamp.toISOString(),
            note: t.note || undefined,
          })),
        }));
      } catch (e) {
        // Fallback
      }
    }

    return Array.from(this.fallbackOrders.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async listOrdersByUser(userId: string): Promise<OrderRecord[]> {
    if (this.dbService.isConnected) {
      try {
        const orders = await this.dbService.db.query.orders.findMany({
          where: (o, { eq }) => eq(o.userId, userId),
          orderBy: (o, { desc }) => [desc(o.createdAt)],
          with: {
            trackingHistory: {
              orderBy: (t, { desc }) => [desc(t.timestamp)],
            },
          },
        });

        return orders.map((order) => ({
          orderId: order.id,
          userId: order.userId || undefined,
          date: order.createdAt.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          createdAt: order.createdAt.toISOString(),
          status: order.status as OrderStatus,
          customerName: order.customerName,
          phone: order.phone,
          email: order.email || 'Not provided',
          province: order.province,
          city: order.city,
          address: order.address,
          notes: order.notes || undefined,
          paymentMethod: order.paymentMethod,
          cart: {
            plan: order.planId as 'single' | 'duo',
            quantity: order.quantity,
            couponCode: order.couponCode || undefined,
          },
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          trackingHistory: order.trackingHistory.map((t) => ({
            status: t.status as OrderStatus,
            timestamp: t.timestamp.toISOString(),
            note: t.note || undefined,
          })),
        }));
      } catch (e) {
        // Fallback
      }
    }

    return Array.from(this.fallbackOrders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderRecord> {
    if (this.dbService.isConnected) {
      try {
        const now = new Date();
        await this.dbService.db.transaction(async (tx) => {
          await tx
            .update(schema.orders)
            .set({
              status: dto.status as schema.OrderStatusType,
              updatedAt: now,
            })
            .where(eq(schema.orders.id, orderId));

          await tx.insert(schema.trackingEvents).values({
            orderId,
            status: dto.status as schema.OrderStatusType,
            note: dto.trackingNote || `Status updated to ${dto.status}`,
            timestamp: now,
          });
        });

        return this.getOrderById(orderId);
      } catch (e) {
        // Fallback
      }
    }

    const order = await this.getOrderById(orderId);
    order.status = dto.status;
    order.trackingHistory.push({
      status: dto.status,
      timestamp: new Date().toISOString(),
      note: dto.trackingNote || `Status updated to ${dto.status}`,
    });
    this.fallbackOrders.set(orderId, order);
    return order;
  }
}
