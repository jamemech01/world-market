import {
  IsString,
  MinLength,
} from 'class-validator'

export class RequestOpenShopDto {
  @IsString()
  @MinLength(1, {
    message: 'Shop open code is required',
  })
  code!: string
}