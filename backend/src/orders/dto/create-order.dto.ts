import {
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
} from 'class-validator'
import { Type } from 'class-transformer'

class OrderItemDto {
  @IsInt()
  @Min(1, {
    message: 'Product ID must be greater than 0',
  })
  productId!: number

  @IsInt()
  @Min(1, {
    message: 'Quantity must be at least 1',
  })
  quantity!: number
}

export class CreateOrderDto {
  @IsInt()
  @Min(1, {
    message: 'Shop ID must be greater than 0',
  })
  shopId!: number

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Order must contain at least one product',
  })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[]

  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: 'Delivery latitude must be a number',
    },
  )
  @Min(-90, {
    message: 'Invalid delivery latitude',
  })
  @Max(90, {
    message: 'Invalid delivery latitude',
  })
  deliveryLat!: number

  @Type(() => Number)
  @IsNumber(
    {},
    {
      message: 'Delivery longitude must be a number',
    },
  )
  @Min(-180, {
    message: 'Invalid delivery longitude',
  })
  @Max(180, {
    message: 'Invalid delivery longitude',
  })
  deliveryLng!: number
}