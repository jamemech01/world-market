import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'

import { PrismaService } from '../prisma/prisma.service'
import { RoutingService } from '../routing/routing.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { Prisma } from '@prisma/client'

const PENDING_ORDER_TIMEOUT_HOURS = 1

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(
    OrdersService.name,
  )

  constructor(
    private prisma: PrismaService,
    private routingService: RoutingService,
  ) { }

  private calculateDeliveryFee(
    distanceKm: number,
  ): number {
    return distanceKm <= 3
      ? 20
      : 20 + Math.ceil(distanceKm - 3) * 5
  }

  private async findShopOrder(
    orderId: number,
    userId: number,
    status: 'pending' | 'accepted',
  ) {
    const shop =
      await this.prisma.shop.findUnique({
        where: {
          userId,
        },
      })

    if (!shop) {
      throw new BadRequestException(
        'Shop not found',
      )
    }

    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          shopId: shop.id,
          status,
        },
      })

    if (!order) {
      throw new BadRequestException(
        'Invalid order',
      )
    }

    return order
  }

  async quote(
    shopId: number,
    deliveryLat: number,
    deliveryLng: number,
  ) {
    const shop =
      await this.prisma.shop.findUnique({
        where: {
          id: shopId,
        },
      })

    if (!shop) {
      throw new BadRequestException(
        'Shop not found',
      )
    }

    if (
      !Number.isFinite(deliveryLat) ||
      !Number.isFinite(deliveryLng)
    ) {
      throw new BadRequestException(
        'Invalid delivery location',
      )
    }

    const route =
      await this.routingService.getDrivingRoute(
        shop.lat,
        shop.lng,
        deliveryLat,
        deliveryLng,
      )

    const distanceKm =
      route.distanceMeters / 1000

    const deliveryFee =
      this.calculateDeliveryFee(
        distanceKm,
      )

    return {
      distanceKm: Number(
        distanceKm.toFixed(2),
      ),
      deliveryFee,
    }
  }

  async create(
    buyerId: number,
    dto: CreateOrderDto,
  ) {
    const productIds = dto.items.map(
      (item) => item.productId,
    )

    const uniqueProductIds =
      new Set(productIds)

    if (
      uniqueProductIds.size !==
      productIds.length
    ) {
      throw new BadRequestException(
        'Duplicate products are not allowed',
      )
    }

    if (
      !Number.isFinite(dto.deliveryLat) ||
      !Number.isFinite(dto.deliveryLng)
    ) {
      throw new BadRequestException(
        'Invalid delivery location',
      )
    }

    const shop =
      await this.prisma.shop.findUnique({
        where: {
          id: dto.shopId,
        },
      })

    if (!shop) {
      throw new BadRequestException(
        'Shop not found',
      )
    }

    const route =
      await this.routingService.getDrivingRoute(
        shop.lat,
        shop.lng,
        dto.deliveryLat,
        dto.deliveryLng,
      )

    const distanceKm =
      route.distanceMeters / 1000

    const deliveryFee =
      this.calculateDeliveryFee(
        distanceKm,
      )

    return this.prisma.$transaction(
      async (tx) => {
        const products =
          await tx.product.findMany({
            where: {
              id: {
                in: productIds,
              },
              shopId: dto.shopId,
            },
          })

        if (
          products.length !==
          uniqueProductIds.size
        ) {
          throw new BadRequestException(
            'Some products are invalid',
          )
        }

        const productsById = new Map(
          products.map((product) => [
            product.id,
            product,
          ]),
        )

        let productTotal =
          new Prisma.Decimal(0)

        for (const item of dto.items) {
          const product =
            productsById.get(item.productId)

          if (!product) {
            throw new BadRequestException(
              'Product not found',
            )
          }

          if (
            product.stock <
            item.quantity
          ) {
            throw new BadRequestException(
              `${product.name} is out of stock`,
            )
          }

          productTotal =
            productTotal.add(
              product.price.mul(
                item.quantity,
              ),
            )
        }

        const deliveryFeeDecimal =
          new Prisma.Decimal(
            deliveryFee.toFixed(2),
          )

        const totalAmount =
          productTotal.add(
            deliveryFeeDecimal,
          )

        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId: buyerId,
            },
          })

        if (!wallet) {
          throw new BadRequestException(
            'Wallet not found',
          )
        }

        if (
          wallet.balance.lessThan(
            totalAmount,
          )
        ) {
          throw new BadRequestException(
            'Insufficient balance',
          )
        }

        for (const item of dto.items) {
          const updated =
            await tx.product.updateMany({
              where: {
                id: item.productId,
                shopId: dto.shopId,
                stock: {
                  gte: item.quantity,
                },
              },

              data: {
                stock: {
                  decrement:
                    item.quantity,
                },
              },
            })

          if (updated.count !== 1) {
            throw new BadRequestException(
              'Product stock changed. Please try again',
            )
          }
        }

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: {
              decrement:
                totalAmount,
            },
          },
        })

        return tx.order.create({
          data: {
            buyerId,
            shopId: dto.shopId,
            totalAmount,
            deliveryFee:
              deliveryFeeDecimal,
            deliveryLat:
              dto.deliveryLat,
            deliveryLng:
              dto.deliveryLng,
            status: 'pending',

            items: {
              create:
                dto.items.map(
                  (item) => {
                    const product =
                      productsById.get(
                        item.productId,
                      )!

                    return {
                      productId:
                        item.productId,
                      productName:
                        product.name,
                      quantity:
                        item.quantity,
                      price:
                        product.price,
                    }
                  },
                ),
            },
          },

          include: {
            items: true,
          },
        })
      },
    )
  }

  async findMyOrders(
    buyerId: number,
  ) {
    return this.prisma.order.findMany({
      where: {
        buyerId,
      },

      include: {
        items: true,
        shop: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findShopOrders(
    userId: number,
  ) {
    const shop =
      await this.prisma.shop.findUnique({
        where: {
          userId,
        },
      })

    if (!shop) {
      return []
    }

    return this.prisma.order.findMany({
      where: {
        shopId: shop.id,
      },

      include: {
        items: {
          include: {
            product: true,
          },
        },
        buyer: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async accept(
    orderId: number,
    userId: number,
  ) {
    const order =
      await this.findShopOrder(
        orderId,
        userId,
        'pending',
      )

    return this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: 'accepted',
      },
    })
  }

  async reject(
    orderId: number,
    userId: number,
  ) {
    await this.findShopOrder(
      orderId,
      userId,
      'pending',
    )

    return this.rejectOrder(orderId)
  }

  private async rejectOrder(
    orderId: number,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id: orderId,
            },

            include: {
              items: true,
            },
          })

        if (
          !order ||
          order.status !== 'pending'
        ) {
          throw new BadRequestException(
            'Invalid order',
          )
        }

        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId: order.buyerId,
            },
          })

        if (!wallet) {
          throw new BadRequestException(
            'Buyer wallet not found',
          )
        }

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: {
              increment:
                order.totalAmount,
            },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            orderId: order.id,
            type: 'refund',
            amount: order.totalAmount,
          },
        })

        for (const item of order.items) {
          if (
            item.productId !== null
          ) {
            await tx.product.updateMany({
              where: {
                id: item.productId,
              },

              data: {
                stock: {
                  increment:
                    item.quantity,
                },
              },
            })
          }
        }

        return tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            status: 'rejected',
          },
        })
      },
    )
  }

  async delivered(
    orderId: number,
    userId: number,
  ) {
    const order =
      await this.findShopOrder(
        orderId,
        userId,
        'accepted',
      )

    return this.prisma.order.update({
      where: {
        id: order.id,
      },

      data: {
        status: 'delivered',
      },
    })
  }

  async complete(
    orderId: number,
    buyerId: number,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findFirst({
            where: {
              id: orderId,
              buyerId,
              status: 'delivered',
            },
          })

        if (!order) {
          throw new BadRequestException(
            'Invalid order',
          )
        }

        if (order.shopId === null) {
          throw new BadRequestException(
            'Shop no longer exists',
          )
        }

        const shop =
          await tx.shop.findUnique({
            where: {
              id: order.shopId,
            },
          })

        if (!shop) {
          throw new BadRequestException(
            'Shop not found',
          )
        }

        const wallet =
          await tx.wallet.findUnique({
            where: {
              userId: shop.userId,
            },
          })

        if (!wallet) {
          throw new BadRequestException(
            'Shop wallet not found',
          )
        }

        await tx.wallet.update({
          where: {
            id: wallet.id,
          },

          data: {
            balance: {
              increment:
                order.totalAmount,
            },
          },
        })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            orderId: order.id,
            type: 'sale',
            amount: order.totalAmount,
          },
        })

        return tx.order.update({
          where: {
            id: orderId,
          },

          data: {
            status: 'completed',
          },
        })
      },
    )
  }

  @Cron(CronExpression.EVERY_HOUR)
  async autoRejectStaleOrders() {
    const cutoff = new Date(
      Date.now() -
      PENDING_ORDER_TIMEOUT_HOURS *
      60 *
      60 *
      1000,
    )

    const staleOrders =
      await this.prisma.order.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lt: cutoff,
          },
        },
      })

    for (const order of staleOrders) {
      try {
        await this.rejectOrder(
          order.id,
        )

        this.logger.log(
          `Auto-rejected stale order #${order.id}`,
        )
      } catch (error) {
        this.logger.error(
          `Failed to auto-reject order #${order.id}`,
          error,
        )
      }
    }
  }
}
