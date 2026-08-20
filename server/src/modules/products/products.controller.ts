import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ApiResponse } from '../../common/dto/api-response.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get full product details, packages, and inventory' })
  async getProduct() {
    const product = await this.productsService.getProduct();
    return ApiResponse.success(product, 'Product details fetched successfully');
  }

  @Get('plans')
  @ApiOperation({ summary: 'Get all available purchase plans' })
  async getPlans() {
    const plans = await this.productsService.getPlans();
    return ApiResponse.success(plans, 'Available plans fetched successfully');
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get details for a specific plan by ID (single | duo)' })
  @ApiParam({ name: 'id', example: 'single' })
  async getPlanById(@Param('id') id: string) {
    const plan = await this.productsService.getPlanById(id);
    return ApiResponse.success(plan, `Plan ${id} fetched successfully`);
  }
}
