import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import { UsersService } from '../users/users.service'
import * as bcrypt from 'bcrypt'
import { AuthDto } from './dto/auth.dto'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  private createAuthResponse(
    user: {
      id: number
      username: string
    },
  ) {
    const payload = {
      sub: user.id,
      username: user.username,
    }

    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
    }
  }

  async register(dto: AuthDto) {
    const existingUser =
      await this.usersService.findByUsername(
        dto.username,
      )

    if (existingUser) {
      throw new ConflictException(
        'Username is already taken',
      )
    }

    const hashedPassword =
      await bcrypt.hash(
        dto.password,
        10,
      )

    const user =
      await this.usersService.create({
        username: dto.username,
        password: hashedPassword,
      })

    return this.createAuthResponse(user)
  }

  async login(dto: AuthDto) {
    const user =
      await this.usersService.findByUsername(
        dto.username,
      )

    if (!user) {
      throw new UnauthorizedException(
        'Wrong username or password',
      )
    }

    const valid =
      await bcrypt.compare(
        dto.password,
        user.password,
      )

    if (!valid) {
      throw new UnauthorizedException(
        'Wrong username or password',
      )
    }

    return this.createAuthResponse(user)
  }
}