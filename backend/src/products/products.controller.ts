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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

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

  @UseGuards(JwtGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Request() req: any,
    @Body() dto: CreateProductDto,
    @UploadedFile() file?: any,
  ) {
    return this.productsService.create(
      req.user.userId,
      dto,
      file,
    )
  }

  @Get('shop/:shopId')
  findByShop(
    @Param('shopId', ParseIntPipe) shopId: number,
  ) {
    return this.productsService.findByShop(shopId)
  }

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

  @UseGuards(JwtGuard)
  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('image'))
  updateImage(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: any,
  ) {
    return this.productsService.updateImage(
      req.user.userId,
      id,
      file,
    )
  }

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