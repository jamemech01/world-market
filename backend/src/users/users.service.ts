import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(username: string, passwordHash: string) {
    return this.prisma.user.create({
      data: { username, password_hash: passwordHash },
    });
  }
}