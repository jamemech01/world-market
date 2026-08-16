import {
  IsString,
  IsNumber,
  IsInt,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator'

export class CreateProductDto {
  @IsString()
  @MinLength(2, {
    message: 'Product name min 2 chars',
  })
  @MaxLength(20, {
    message: 'Product name max 20 chars',
  })
  name!: string

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price max 2 decimals' },
  )
  @Min(0, {
    message: 'Price must be 0 or more',
  })
  price!: number

  @IsInt()
  @Min(0.01, {
    message: 'Stock must be 0 or more',
  })
  stock!: number
}