import { PassportStrategy } from '@nestjs/passport'
import { Strategy, type WithSecretOrKey } from 'passport-jwt'

export const USER_JWT_RESOLVER_TOKEN = Symbol('USER_JWT_RESOLVER')

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserJwtResolver<TUser> {
  findUserByJwt(payload: Record<string, unknown>): Promise<TUser | null>
}

export class JwtStrategy<TUser> extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly resolver: UserJwtResolver<TUser>,
    options: WithSecretOrKey,
  ) {
    super(options)
  }

  async validate(payload: Record<string, unknown>): Promise<TUser | null> {
    return this.resolver.findUserByJwt(payload)
  }
}
