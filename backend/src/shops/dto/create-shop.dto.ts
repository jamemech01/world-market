import {
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator'

export class CreateShopDto {
  @IsString()
  @MinLength(2, {
    message: 'Shop name min 2 chars',
  })
  @MaxLength(20, {
    message: 'Shop name max 20 chars',
  })
  name!: string

  @IsNumber()
  @Min(-90, {
    message: 'Invalid latitude',
  })
  @Max(90, {
    message: 'Invalid latitude',
  })
  lat!: number

  @IsNumber()
  @Min(-180, {
    message: 'Invalid longitude',
  })
  @Max(180, {
    message: 'Invalid longitude',
  })
  lng!: number
}