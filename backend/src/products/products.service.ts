import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { UpdateStockDto } from './dto/update-stock.dto'

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  private async findOwnedProduct(
    userId: number,
    productId: number,
  ) {
    const product =
      await this.prisma.product.findUnique({
        where: {
          id: productId,
        },
        include: {
          shop: true,
        },
      })

    if (!product) {
      throw new NotFoundException(
        'Product not found',
      )
    }

    if (product.shop.userId !== userId) {
      throw new ForbiddenException(
        'You do not own this product',
      )
    }

    return product
  }

  async create(
    userId: number,
    dto: CreateProductDto,
    file?: any,
  ) {
    const shop =
      await this.prisma.shop.findUnique({
        where: {
          userId,
        },
      })

    if (!shop) {
      throw new ForbiddenException(
        'You do not have a shop',
      )
    }

    let imageUrl: string | null = null

    if (file) {
      const result =
        await this.cloudinary.uploadImage(file)

      imageUrl = (result as any).secure_url
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category || 'Other',
        price: new Prisma.Decimal(dto.price),
        stock: dto.stock,
        imageUrl,
        shopId: shop.id,
      },
    })
  }

  async findByShop(shopId: number) {
    const shop =
      await this.prisma.shop.findUnique({
        where: {
          id: shopId,
        },
      })

    if (!shop) {
      throw new NotFoundException(
        'Shop not found',
      )
    }

    return this.prisma.product.findMany({
      where: {
        shopId,
      },
      orderBy: {
        id: 'asc',
      },
    })
  }

  async update(
    userId: number,
    productId: number,
    dto: UpdateProductDto,
  ) {
    if (
      dto.name === undefined &&
      dto.category === undefined &&
      dto.price === undefined
    ) {
      throw new BadRequestException(
        'Nothing to update',
      )
    }

    const product =
      await this.findOwnedProduct(
        userId,
        productId,
      )

    return this.prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        ...(dto.name !== undefined && {
          name: dto.name,
        }),

        ...(dto.category !== undefined && {
          category: dto.category,
        }),

        ...(dto.price !== undefined && {
          price: new Prisma.Decimal(dto.price),
        }),
      },
    })
  }

  async updateImage(
    userId: number,
    productId: number,
    file?: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Image is required',
      )
    }

    const product =
      await this.findOwnedProduct(
        userId,
        productId,
      )

    const result =
      await this.cloudinary.uploadImage(file)

    const imageUrl =
      (result as any).secure_url

    return this.prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        imageUrl,
      },
    })
  }

  async updateStock(
    userId: number,
    productId: number,
    dto: UpdateStockDto,
  ) {
    await this.findOwnedProduct(
      userId,
      productId,
    )

    return this.prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        stock: dto.stock,
      },
    })
  }

  async remove(
    userId: number,
    productId: number,
  ) {
    await this.findOwnedProduct(
      userId,
      productId,
    )

    return this.prisma.product.delete({
      where: {
        id: productId,
      },
    })
  }
}