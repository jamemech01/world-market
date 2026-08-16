import {
  IsInt,
  IsNumber,
} from 'class-validator'

export class DeliveryFeeDto {
  @IsInt()
  shopId!: number

  @IsNumber()
  deliveryLat!: number

  @IsNumber()
  deliveryLng!: number
}