import { IsString, IsNumber, MinLength, MaxLength } from 'class-validator';

export class CreateShopDto {
  @IsString()
  @MinLength(2, { message: 'Shop name min 2 chars' })
  @MaxLength(20, { message: 'Shop name max 20 chars' })
  name!: string;

  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}