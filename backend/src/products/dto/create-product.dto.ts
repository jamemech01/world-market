import {
  IsString,
  IsNumber,
  IsInt,
  MinLength,
  MaxLength,
  Min,
  IsOptional,
  IsUrl,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateProductDto {
  @IsString()
  @MinLength(2, {
    message: 'Product name min 2 chars',
  })
  @MaxLength(20, {
    message: 'Product name max 20 chars',
  })
  name!: string

  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Category min 2 chars',
  })
  @MaxLength(20, {
    message: 'Category max 20 chars',
  })
  category?: string

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price max 2 decimals' },
  )
  @Min(0.01, {
    message: 'Price must be greater than 0',
  })
  price!: number

  @Type(() => Number)
  @IsInt()
  @Min(0, {
    message: 'Stock must be 0 or more',
  })
  stock!: number

  @IsOptional()
  @IsUrl()
  imageUrl?: string
}