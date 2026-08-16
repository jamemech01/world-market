import {
  Controller,
  Get,
  Request,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtGuard)
  async me(@Request() req: any) {
    const user = await this.usersService.findById(req.user.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      canOpenShop: user.canOpenShop,
    };
  }
}