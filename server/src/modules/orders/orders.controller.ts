import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create and place a new Deal Drip customer order' })
  async createOrder(@Body() dto: CreateOrderDto) {
    const order = await this.ordersService.createOrder(dto);
    return ApiResponse.success(order, 'Order placed successfully');
  }

  @Get()
  @ApiOperation({ summary: 'List recent orders' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async listOrders(@Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const orders = await this.ordersService.listOrders(parsedLimit);
    return ApiResponse.success(orders, 'Orders retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List orders placed by a specific Neon Auth user' })
  @ApiParam({ name: 'userId', example: 'usr_neon_12345' })
  async getOrdersByUser(@Param('userId') userId: string) {
    const orders = await this.ordersService.listOrdersByUser(userId);
    return ApiResponse.success(orders, 'User orders retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order and tracking details by Order ID' })
  @ApiParam({ name: 'id', example: 'DD-2026-10293' })
  async getOrderById(@Param('id') id: string) {
    const order = await this.ordersService.getOrderById(id);
    return ApiResponse.success(order, 'Order details retrieved successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update an order status & append tracking note' })
  @ApiParam({ name: 'id', example: 'DD-2026-10293' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const updated = await this.ordersService.updateOrderStatus(id, dto);
    return ApiResponse.success(updated, `Order status updated to ${dto.status}`);
  }
}
