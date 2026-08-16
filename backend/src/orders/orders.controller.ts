import {
  Body,
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  Post,
} from '@nestjs/common'

import { JwtGuard } from '../auth/jwt.guard'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { DeliveryFeeDto } from './dto/delivery-fee.dto'

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
  ) {}

  @Post('quote')
  quote(
    @Body() dto: DeliveryFeeDto,
  ) {
    return this.ordersService.quote(
      dto.shopId,
      dto.deliveryLat,
      dto.deliveryLng,
    )
  }

  @Post()
  create(
    @Request() req: any,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(
      req.user.userId,
      dto,
    )
  }

  @Get('me')
  findMyOrders(
    @Request() req: any,
  ) {
    return this.ordersService.findMyOrders(
      req.user.userId,
    )
  }

  @Get('shop')
  findShopOrders(
    @Request() req: any,
  ) {
    return this.ordersService.findShopOrders(
      req.user.userId,
    )
  }

  @Patch(':id/accept')
  accept(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.ordersService.accept(
      id,
      req.user.userId,
    )
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.ordersService.reject(
      id,
      req.user.userId,
    )
  }

  @Patch(':id/delivered')
  delivered(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.ordersService.delivered(
      id,
      req.user.userId,
    )
  }

  @Patch(':id/complete')
  complete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.ordersService.complete(
      id,
      req.user.userId,
    )
  }
}