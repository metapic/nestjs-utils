import { readFileSync } from 'node:fs'

import { CanActivate, DynamicModule, Module, Provider, Type } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { PassportModule } from '@nestjs/passport'
import { ExtractJwt, WithSecretOrKey } from 'passport-jwt'

import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js'
import { AUTH_EXCLUDED_PATHS_TOKEN, AUTH_GUARDS_TOKEN, AuthGuard } from './guards/auth.guard.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import {
  ApiKeyStrategy,
  USER_API_KEY_RESOLVER_TOKEN,
  UserApiKeyResolver,
} from './strategies/api-key.strategy.js'
import { JwtStrategy, USER_JWT_RESOLVER_TOKEN, UserJwtResolver } from './strategies/jwt.strategy.js'

type AuthModuleOptions<TUser> = {
  provideGlobalAuthGuard?: boolean
  useJwt?: boolean
  useApiKey?: boolean
  excludedPaths?: string[]
  userJwtResolver?: UserJwtResolver<TUser> | Type<UserJwtResolver<TUser>>
  userApiKeyResolver?: UserApiKeyResolver<TUser> | Type<UserApiKeyResolver<TUser>>
}

@Module({
  imports: [PassportModule, ConfigModule],
})
export class AuthModule {
  static forRoot<TUser>(options?: AuthModuleOptions<TUser>): DynamicModule {
    const finalOptions: AuthModuleOptions<TUser> = {
      provideGlobalAuthGuard: true,
      useJwt: true,
      useApiKey: false,
      excludedPaths: [],
      ...options,
    }

    const guards: CanActivate[] = []

    if (finalOptions.useJwt) {
      guards.push(new JwtAuthGuard())
    }

    if (finalOptions.useApiKey) {
      guards.push(new ApiKeyAuthGuard())
    }

    const providers: Provider[] = [
      { provide: AUTH_GUARDS_TOKEN, useValue: guards },
      { provide: AUTH_EXCLUDED_PATHS_TOKEN, useValue: finalOptions.excludedPaths ?? [] },
    ]

    if (finalOptions.useJwt) {
      providers.push(JwtStrategyProvider<TUser>())
      providers.push(JwtAuthGuard)

      if (finalOptions.userJwtResolver) {
        providers.push({
          provide: USER_JWT_RESOLVER_TOKEN,
          ...(typeof finalOptions.userJwtResolver === 'function'
            ? { useClass: finalOptions.userJwtResolver }
            : { useValue: finalOptions.userJwtResolver }),
        })
      }
    }

    if (finalOptions.useApiKey) {
      providers.push(ApiKeyStrategy<TUser>)
      providers.push(ApiKeyAuthGuard)

      if (finalOptions.userApiKeyResolver) {
        providers.push({
          provide: USER_API_KEY_RESOLVER_TOKEN,
          ...(typeof finalOptions.userApiKeyResolver === 'function'
            ? { useClass: finalOptions.userApiKeyResolver }
            : { useValue: finalOptions.userApiKeyResolver }),
        })
      }
    }

    providers.push(AuthGuard)

    if (finalOptions.provideGlobalAuthGuard) {
      providers.push({
        provide: APP_GUARD,
        useExisting: AuthGuard,
      })
    }

    const exports: (Provider | symbol | string)[] = [AUTH_GUARDS_TOKEN, AUTH_EXCLUDED_PATHS_TOKEN]

    if (finalOptions.useJwt) {
      exports.push(JwtStrategy)
      exports.push(JwtAuthGuard)
      exports.push(USER_JWT_RESOLVER_TOKEN)
    }

    if (finalOptions.useApiKey) {
      exports.push(ApiKeyStrategy)
      exports.push(ApiKeyAuthGuard)
      exports.push(USER_API_KEY_RESOLVER_TOKEN)
    }

    return {
      module: AuthModule,
      providers: providers,
      exports: exports,
    }
  }
}

const JwtStrategyProvider = <TUser>(): Provider<JwtStrategy<TUser>> => ({
  provide: JwtStrategy<TUser>,
  useFactory: (configService: ConfigService, resolver: UserJwtResolver<TUser>) => {
    let secretOrKey: WithSecretOrKey['secretOrKey'] | undefined =
      configService.get<string>('jwt.secret')
    const jwkPath = configService.get<string>('jwt.jwkPath')
    if (jwkPath) {
      if (secretOrKey) {
        throw new Error(
          'Both "jwt.secret" and "jwt.jwkPath" were provided. Make sure only one is set',
        )
      }
      secretOrKey = readFileSync(jwkPath)
    }
    if (!secretOrKey) {
      throw new Error('Neither "jwt.secret" or "jwt.jwkPath" were provided')
    }
    return new JwtStrategy<TUser>(resolver, {
      secretOrKey: secretOrKey,
      audience: configService.get('auth.jwtAudience'),
      issuer: configService.get('auth.jwtIssuer'),
      jwtFromRequest: ExtractJwt.fromExtractors([ExtractJwt.fromAuthHeaderAsBearerToken()]),
      ignoreExpiration: false,
    })
  },
  inject: [ConfigService, USER_JWT_RESOLVER_TOKEN],
})
