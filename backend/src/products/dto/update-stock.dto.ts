import {
  IsInt,
  Min,
} from 'class-validator'

export class UpdateStockDto {
  @IsInt()
  @Min(0, {
    message: 'Stock must be 0 or more',
  })
  stock!: number
}