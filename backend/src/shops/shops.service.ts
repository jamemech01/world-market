import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateShopDto } from './dto/create-shop.dto'
import { UpdateShopDto } from './dto/update-shop.dto'

@Injectable()
export class ShopsService {
  constructor(private prisma: PrismaService) { }

  async create(userId: number, dto: CreateShopDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user?.canOpenShop) {
      throw new ForbiddenException(
        'You are not allowed to open a shop',
      )
    }

    const existing = await this.prisma.shop.findUnique({
      where: {
        userId,
      },
    })

    if (existing) {
      throw new ConflictException(
        'You already have a shop',
      )
    }

    return this.prisma.shop.create({
      data: {
        name: dto.name,
        lat: dto.lat,
        lng: dto.lng,
        userId,
      },
    })
  }

  async requestOpenShop(
    userId: number,
    code: string,
  ) {
    const shopOpenCode = process.env.SHOP_OPEN_CODE

    if (!shopOpenCode || code !== shopOpenCode) {
      throw new UnauthorizedException(
        'Invalid shop open code',
      )
    }

    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        canOpenShop: true,
      },
      select: {
        id: true,
        canOpenShop: true,
      },
    })
  }

  findMyShop(userId: number) {
    return this.prisma.shop.findUnique({
      where: {
        userId,
      },
    })
  }

  findAll() {
    return this.prisma.shop.findMany()
  }

  findOne(id: number) {
    return this.prisma.shop.findUnique({
      where: {
        id,
      },
    })
  }

  async update(
    userId: number,
    dto: UpdateShopDto,
  ) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        userId,
      },
    })

    if (!shop) {
      throw new NotFoundException(
        'Shop not found',
      )
    }

    return this.prisma.shop.update({
      where: {
        id: shop.id,
      },
      data: {
        name: dto.name,
      },
    })
  }

  async delete(userId: number) {
    const shop = await this.prisma.shop.findUnique({
      where: {
        userId,
      },
    })

    if (!shop) {
      throw new ForbiddenException(
        'You do not have a shop',
      )
    }

    return this.prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        where: {
          shopId: shop.id,
          status: {
            in: ['pending', 'accepted'],
          },
        },
        include: {
          items: true,
        },
      })

      for (const order of orders) {
        const wallet = await tx.wallet.findUnique({
          where: {
            userId: order.buyerId,
          },
        })

        if (!wallet) {
          throw new ConflictException(
            `Buyer wallet not found for order #${order.id}`,
          )
        }

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },
          data: {
            balance: {
              increment: order.totalAmount,
            },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'refund',
            amount: order.totalAmount,
          },
        })

        for (const item of order.items) {
          if (item.productId !== null) {
            await tx.product.update({
              where: {
                id: item.productId,
              },
              data: {
                stock: {
                  increment: item.quantity,
                },
              },
            })
          }
        }

        await tx.order.update({
          where: {
            id: order.id,
          },
          data: {
            status: 'rejected',
          },
        })
      }

      return tx.shop.delete({
        where: {
          id: shop.id,
        },
      })
    })
  }
}