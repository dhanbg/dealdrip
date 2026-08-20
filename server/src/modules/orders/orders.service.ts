import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { PrismaService } from '../../prisma/prisma.service';

export interface OrderRecord {
  orderId: string;
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
  constructor(private readonly prisma: PrismaService) {}

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

    if (this.prisma.isConnected) {
      try {
        const order = await this.prisma.order.create({
          data: {
            id: orderId,
            customerName: dto.customerName,
            phone: dto.phone,
            email: dto.email,
            province: dto.province,
            city: dto.city,
            address: dto.address,
            notes: dto.notes,
            paymentMethod: dto.paymentMethod,
            planId: dto.cart.plan,
            quantity: dto.cart.quantity,
            couponCode: dto.cart.couponCode,
            subtotal: dto.subtotal,
            discount: dto.discount,
            total: dto.total,
            status: OrderStatus.CONFIRMED,
            trackingHistory: {
              create: [
                {
                  status: OrderStatus.CONFIRMED,
                  note: 'Order placed and confirmed. Ready for packaging.',
                },
              ],
            },
          },
          include: {
            trackingHistory: true,
          },
        });

        return {
          orderId: order.id,
          date: formattedDate,
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
            discountAmount: dto.cart.discountAmount,
            discountPercentage: dto.cart.discountPercentage,
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
      } catch (e) {
        // Fallback
      }
    }

    this.fallbackOrders.set(orderId, fallbackRecord);
    return fallbackRecord;
  }

  async getOrderById(orderId: string): Promise<OrderRecord> {
    if (this.prisma.isConnected) {
      try {
        const order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { trackingHistory: true },
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
    if (this.prisma.isConnected) {
      try {
        const orders = await this.prisma.order.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { trackingHistory: true },
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

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<OrderRecord> {
    if (this.prisma.isConnected) {
      try {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            status: dto.status,
            trackingHistory: {
              create: {
                status: dto.status,
                note: dto.trackingNote || `Status updated to ${dto.status}`,
              },
            },
          },
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
