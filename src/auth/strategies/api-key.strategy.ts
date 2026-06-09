import { Inject } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy } from 'passport-http-bearer'

export const USER_API_KEY_RESOLVER_TOKEN = Symbol('USER_API_KEY_RESOLVER')

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserApiKeyResolver<TUser> {
  findUserByApiKey(token: string): Promise<TUser | null>
}

export class ApiKeyStrategy<TUser> extends PassportStrategy(Strategy, 'apiKey') {
  constructor(
    @Inject(USER_API_KEY_RESOLVER_TOKEN) private readonly resolver: UserApiKeyResolver<TUser>,
  ) {
    super()
  }

  async validate(token: string): Promise<TUser | null> {
    return this.resolver.findUserByApiKey(token)
  }
}
