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
        'Amount must be a positive number with maximum 2 decimal places',
    },
  )
  amount!: string
}