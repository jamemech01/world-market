import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class AuthDto {
  @IsString()
  @MinLength(3, {
    message: 'Username min 3 chars',
  })
  @MaxLength(20, {
    message: 'Username max 20 chars',
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username invalid',
  })
  username!: string;

  @IsString()
  @MinLength(8, {
    message: 'Password min 8 chars',
  })
  @MaxLength(50, {
    message: 'Password max 50 chars',
  })
  password!: string;
}