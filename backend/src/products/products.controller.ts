import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common'

import { JwtGuard } from '../auth/jwt.guard'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { UpdateStockDto } from './dto/update-stock.dto'

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
  ) {}

  // Create Product
  @UseGuards(JwtGuard)
  @Post()
  create(
    @Request() req: any,
    @Body() dto: CreateProductDto,
  ) {
    return this.productsService.create(
      req.user.userId,
      dto,
    )
  }

  // Get Products By Shop
  @Get('shop/:shopId')
  findByShop(
    @Param('shopId', ParseIntPipe) shopId: number,
  ) {
    return this.productsService.findByShop(shopId)
  }

  // Edit Product: name + price
  @UseGuards(JwtGuard)
  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(
      req.user.userId,
      id,
      dto,
    )
  }

  // Update Stock: stock only
  @UseGuards(JwtGuard)
  @Patch(':id/stock')
  updateStock(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockDto,
  ) {
    return this.productsService.updateStock(
      req.user.userId,
      id,
      dto,
    )
  }

  // Delete Product
  @UseGuards(JwtGuard)
  @Delete(':id')
  remove(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productsService.remove(
      req.user.userId,
      id,
    )
  }
}