import {
  IsNotEmpty,
  IsString,
  Matches,
} from 'class-validator'

export class TopupDto {
  @IsString()
  @IsNotEmpty()
  @Matches(
    /^\d+(\.\d{1,2})?$/,
    {
      message:
        'Amount must be positive with max 2 decimals',
    },
  )
  amount!: string
}
