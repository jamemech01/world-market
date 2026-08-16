import {
  IsString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator'

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
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Price max 2 decimals' },
  )
  @Min(0.01, {
    message: 'Price must be 0 or more',
  })
  price?: number
}