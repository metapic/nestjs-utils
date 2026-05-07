import { type UserJwtResolver } from '@metapic/nestjs-utils/auth'

export class User {
  constructor(readonly id: string) {}
}

export class AuthService implements UserJwtResolver<User> {
  findUserByJwt(payload: Record<string, unknown>): User {
    return new User(String(payload.sub))
  }
}
