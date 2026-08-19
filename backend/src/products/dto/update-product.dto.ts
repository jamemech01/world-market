import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  IsUrl,
} from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Product name min 2 chars',
  })
  @MaxLength(20, {
    message: 'Product name max 20 chars',
  })
  name?: string

  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Category min 2 chars',
  })
  @MaxLength(20, {
    message: 'Category max 20 chars',
  })
  category?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price max 2 decimals' },
  )
  @Min(0.01, {
    message: 'Price must be greater than 0',
  })
  price?: number

  @IsOptional()
  @IsUrl()
  imageUrl?: string
}