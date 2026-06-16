import { type UserJwtResolver } from '@metapic/nestjs-utils/auth'
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'

export class User {
  constructor(readonly id: string) {}
}

@Injectable()
export class UserRepository {
  findById(id: string): Promise<User | null> {
    return Promise.resolve(new User(id))
  }
}

@Injectable()
export class AuthService implements UserJwtResolver<User> {
  constructor(private readonly userRepository: UserRepository) {}

  async findUserByJwt(payload: Record<string, unknown>): Promise<User | null> {
    return await this.userRepository.findById(String(payload.sub))
  }
}

@Injectable()
export class ApiVersionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>()
    if (request.headers['x-api-version'] === '0.0.1') {
      throw new UnauthorizedException('API version 0.0.1 is no longer supported')
    }
    return true
  }
}
