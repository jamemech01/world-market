import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common'

import { JwtGuard } from '../auth/jwt.guard'
import { WalletService } from './wallet.service'
import { TopupDto } from './dto/topup.dto'

@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
  ) {}

  @UseGuards(JwtGuard)
  @Get('me')
  getMyWallet(@Request() req: any) {
    return this.walletService.getMyWallet(
      req.user.userId,
    )
  }

  @UseGuards(JwtGuard)
  @Post('topup')
  topup(
    @Request() req: any,
    @Body() dto: TopupDto,
  ) {
    return this.walletService.topup(
      req.user.userId,
      dto.amount,
    )
  }
}