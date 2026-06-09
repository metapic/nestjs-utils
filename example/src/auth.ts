import { type UserJwtResolver } from '@metapic/nestjs-utils/auth'

export class User {
  constructor(readonly id: string) {}
}

export class AuthService implements UserJwtResolver<User> {
  findUserByJwt(payload: Record<string, unknown>): Promise<User | null> {
    return Promise.resolve(new User(String(payload.sub)))
  }
}
