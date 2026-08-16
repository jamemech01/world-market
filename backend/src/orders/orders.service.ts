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

const PENDING_ORDER_TIMEOUT_HOURS = 24

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(
    OrdersService.name,
  )

  constructor(
    private prisma: PrismaService,
    private routingService: RoutingService,
  ) {}

  /**
   * Calculate delivery fee from real road distance.
   *
   * <= 3 km = 20 baht
   * > 3 km  = 20 + 5 baht per additional km
   *
   * Examples:
   * 2.5 km = 20
   * 3.0 km = 20
   * 3.2 km = 25
   * 5.1 km = 35
   */
  private calculateDeliveryFee(
    distanceKm: number,
  ): number {
    return distanceKm <= 3
      ? 20
      : 20 +
          Math.ceil(distanceKm - 3) * 5
  }

  /**
   * Calculate delivery quote before placing order.
   *
   * This does NOT:
   * - deduct wallet
   * - reserve stock
   * - create order
   *
   * It only calculates the delivery fee.
   */
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
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException(
        'Order must contain at least one product',
      )
    }

    // Prevent duplicate product IDs.
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

    // Validate quantities
    for (const item of dto.items) {
      if (
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        throw new BadRequestException(
          'Quantity must be a positive integer',
        )
      }
    }

    // Validate delivery location
    if (
      !Number.isFinite(dto.deliveryLat) ||
      !Number.isFinite(dto.deliveryLng)
    ) {
      throw new BadRequestException(
        'Invalid delivery location',
      )
    }

    // Find shop
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

    // Calculate real road distance
    // AGAIN on the server when actually creating the order.
    //
    // We intentionally do not trust the delivery fee
    // calculated by the frontend.
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
        // Find products belonging to this shop
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

        // Calculate product total
        let productTotal =
          new Prisma.Decimal(0)

        for (const item of dto.items) {
          const product =
            products.find(
              (p) =>
                p.id === item.productId,
            )

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

        // Find buyer wallet
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

        // Reserve stock
        //
        // Use stock >= quantity in WHERE
        // so concurrent orders cannot
        // decrement stock below zero.
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

        // Hold buyer's money.
        //
        // Money is removed from buyer
        // but NOT transferred to shop yet.
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

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'hold',
            amount: totalAmount,
          },
        })

        // Create order
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
                      products.find(
                        (p) =>
                          p.id ===
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
          status: 'pending',
        },
      })

    if (!order) {
      throw new BadRequestException(
        'Invalid order',
      )
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
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
          status: 'pending',
        },
      })

    if (!order) {
      throw new BadRequestException(
        'Invalid order',
      )
    }

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

        // Refund buyer
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
            type: 'refund',
            amount:
              order.totalAmount,
          },
        })

        // Restore stock
        for (const item of order.items) {
          if (
            item.productId !== null
          ) {
            const product =
              await tx.product.findUnique({
                where: {
                  id: item.productId,
                },
              })

            if (product) {
              await tx.product.update({
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
        }

        // Reject order
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
          status: 'accepted',
        },
      })

    if (!order) {
      throw new BadRequestException(
        'Invalid order',
      )
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
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

        // Release held money to shop
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
            type: 'sale',
            amount:
              order.totalAmount,
          },
        })

        // Buyer confirmed received
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