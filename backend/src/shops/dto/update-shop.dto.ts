import {
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator'

export class UpdateShopDto {
  @IsString()
  @MinLength(2, {
    message: 'Shop name min 2 chars',
  })
  @MaxLength(20, {
    message: 'Shop name max 20 chars',
  })
  name!: string
}