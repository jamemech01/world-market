import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { JwtGuard } from '../auth/jwt.guard'
import { ShopsService } from './shops.service'
import { CreateShopDto } from './dto/create-shop.dto'
import { UpdateShopDto } from './dto/update-shop.dto'
import { RequestOpenShopDto } from './dto/request-open-shop.dto'

@Controller('shops')
export class ShopsController {
  constructor(
    private shopsService: ShopsService
  ) {}

  @UseGuards(JwtGuard)
  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateShopDto
  ) {
    return this.shopsService.create(
      req.user.userId,
      dto
    )
  }

  @UseGuards(JwtGuard)
  @Post('request-open')
  requestOpenShop(
    @Req() req: any,
    @Body() dto: RequestOpenShopDto
  ) {
    return this.shopsService.requestOpenShop(
      req.user.userId,
      dto.code
    )
  }

  @UseGuards(JwtGuard)
  @Get('me')
  findMyShop(
    @Req() req: any
  ) {
    return this.shopsService.findMyShop(
      req.user.userId
    )
  }

  @Get()
  findAll() {
    return this.shopsService.findAll()
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.shopsService.findOne(id)
  }

  @UseGuards(JwtGuard)
  @Patch()
  update(
    @Req() req: any,
    @Body() dto: UpdateShopDto
  ) {
    return this.shopsService.update(
      req.user.userId,
      dto
    )
  }

  @UseGuards(JwtGuard)
  @Delete()
  delete(
    @Req() req: any
  ) {
    return this.shopsService.delete(
      req.user.userId
    )
  }
}