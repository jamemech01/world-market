import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { Prisma } from '@prisma/client'

const MAX_TOPUP = new Prisma.Decimal(
  '99999999.99',
)

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getOrCreateWallet(userId: number) {
    return this.prisma.wallet.upsert({
      where: {
        userId,
      },

      update: {},

      create: {
        userId,
        balance: new Prisma.Decimal(0),
      },
    })
  }

  async getMyWallet(userId: number) {
    const wallet =
      await this.getOrCreateWallet(userId)

    const transactions =
      await this.prisma.walletTransaction.findMany({
        where: {
          walletId: wallet.id,
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

    return {
      ...wallet,
      transactions,
    }
  }

  async topup(
    userId: number,
    amount: string,
  ) {
    const value = amount.trim()

    if (!value) {
      throw new BadRequestException(
        'Amount is required',
      )
    }

    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
      throw new BadRequestException(
        'Invalid amount',
      )
    }

    const decimal =
      new Prisma.Decimal(value)

    if (decimal.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'Amount must be greater than 0',
      )
    }

    if (decimal.greaterThan(MAX_TOPUP)) {
      throw new BadRequestException(
        'Maximum top up is 99,999,999.99',
      )
    }

    const wallet =
      await this.getOrCreateWallet(userId)

    return this.prisma.$transaction(
      async (tx) => {
        const updated =
          await tx.wallet.update({
            where: {
              id: wallet.id,
            },

            data: {
              balance: {
                increment: decimal,
              },
            },
          })

        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'topup',
            amount: decimal,
          },
        })

        return updated
      },
    )
  }
}