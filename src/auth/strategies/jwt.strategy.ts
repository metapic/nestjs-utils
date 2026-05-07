import * as fs from 'node:fs'

import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy, StrategyOptionsWithSecret } from 'passport-jwt'

const jwkCache = new Map<string, Buffer>()

export const USER_JWT_RESOLVER_TOKEN = Symbol('USER_JWT_RESOLVER')

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface UserJwtResolver<TUser> {
  findUserByJwt(payload: Record<string, unknown>): TUser | null
}

export class JwtStrategy<TUser> extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @Inject(USER_JWT_RESOLVER_TOKEN) private readonly resolver: UserJwtResolver<TUser>,
  ) {
    const key = config.get<string>('jwt.secret')
    const jwkPath = config.get<string>('jwt.jwkPath')
    if ((key === undefined) === (jwkPath === undefined)) {
      throw new Error('Exactly one of jwt.secret or jwt.jwkPath must be provided.')
    }

    if (key === undefined && jwkPath !== undefined && !jwkCache.has(jwkPath)) {
      jwkCache.set(jwkPath, fs.readFileSync(jwkPath))
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: key ?? jwkCache.get(jwkPath!),
      audience: config.get('auth.jwtAudience'),
      issuer: config.get('auth.jwtIssuer'),
      ignoreExpiration: false,
    } as StrategyOptionsWithSecret)
  }

  validate(payload: Record<string, unknown>): TUser | null {
    return this.resolver.findUserByJwt(payload)
  }
}
