import { Controller, Get, UseGuards } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { beforeAll, describe, expect, it } from 'vitest'

import { AuthModule } from './auth.module.js'
import { CurrentUser } from './decorators/current-user.decorator.js'
import { Public } from './decorators/public.decorator.js'
import { SkipGuards } from './decorators/skip-guards.decorator.js'
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard.js'
import { AuthGuard } from './guards/auth.guard.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { UserApiKeyResolver } from './strategies/api-key.strategy.js'
import { UserJwtResolver } from './strategies/jwt.strategy.js'
import { createJwt } from './testing/index.js'

class User {
  constructor(public id: string) {}
}

@Controller()
class TestController {
  @Get('excluded')
  excluded() {
    return true
  }

  @Public()
  @Get('public')
  public() {
    return true
  }

  @Get('private')
  private() {
    return true
  }

  @UseGuards(AuthGuard)
  @Get('explicitly-private')
  explicitlyPrivate(@CurrentUser() user: User) {
    return user.id
  }

  @UseGuards(JwtAuthGuard)
  @Get('explicit-jwt')
  explicitJwt() {
    return true
  }

  @UseGuards(ApiKeyAuthGuard)
  @Get('explicit-api-key')
  explicitApiKey() {
    return true
  }

  @SkipGuards(JwtAuthGuard)
  @Get('skip-jwt')
  skipJwt() {
    return true
  }

  @SkipGuards(ApiKeyAuthGuard)
  @Get('skip-api-key')
  skipApiKey() {
    return true
  }
}

const apiKey = 'api-key-12345'
const validUserId = '123456789'

class AuthService implements UserApiKeyResolver<User>, UserJwtResolver<User> {
  findUserByApiKey(token: string) {
    return Promise.resolve(token === apiKey ? new User(validUserId) : null)
  }

  findUserByJwt(payload: Record<string, unknown>) {
    return Promise.resolve(payload.user_id == validUserId ? new User(validUserId) : null)
  }
}

describe('Auth module', () => {
  let app: NestFastifyApplication

  describe('with global auth guard', () => {
    beforeAll(async () => {
      const module = await Test.createTestingModule({
        controllers: [TestController],
        providers: [AuthService],
        imports: [
          ConfigModule.forFeature(() => ({
            auth: { jwtSecret: 'abcdef', jwtIssuer: 'test', jwtAudience: 'test' },
          })),
          AuthModule.forRoot<User>({
            useJwt: true,
            useApiKey: true,
            userJwtResolver: AuthService,
            userApiKeyResolver: AuthService,
            excludedPaths: ['/excluded'],
          }),
        ],
      }).compile()

      app = module.createNestApplication(new FastifyAdapter())
      await app.init()
      await app.getHttpAdapter().getInstance().ready()
    })

    describe('unauthorized request', () => {
      it.each([
        ['/public', 200],
        ['/excluded', 200],
        ['/private', 401],
        ['/explicitly-private', 401],
        ['/explicit-jwt', 401],
        ['/explicit-api-key', 401],
        ['/skip-api-key', 401],
        ['/skip-jwt', 401],
      ])('GET %s => %i', async (path, expectedStatus) => {
        const result = await app.inject({ method: 'GET', url: path })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })

    describe('authorized request with JWT', () => {
      it.each([
        ['/public', validUserId, 200],
        ['/excluded', validUserId, 200],
        ['/private', validUserId, 200],
        ['/explicitly-private', validUserId, 200],
        ['/explicit-jwt', validUserId, 200],
        ['/explicit-api-key', validUserId, 401],
        ['/skip-api-key', validUserId, 200],
        ['/skip-jwt', validUserId, 401],
        ['/explicit-jwt', 'invalid', 401],
      ])('GET %s with userId %s => %i', async (path, userId, expectedStatus) => {
        const token = createJwt(app, { user_id: userId })
        const result = await app.inject({
          method: 'GET',
          url: path,
          headers: { authorization: `bearer ${token}` },
        })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })

    describe('authorized request with API key', () => {
      it.each([
        ['/public', apiKey, 200],
        ['/excluded', apiKey, 200],
        ['/private', apiKey, 200],
        ['/explicitly-private', apiKey, 200],
        ['/explicit-jwt', apiKey, 401],
        ['/explicit-api-key', apiKey, 200],
        ['/skip-api-key', apiKey, 401],
        ['/skip-jwt', apiKey, 200],
        ['/explicit-api-key', 'invalid', 401],
      ])('GET %s with API key %s => %i', async (path, token, expectedStatus) => {
        const result = await app.inject({
          method: 'GET',
          url: path,
          headers: { authorization: `bearer ${token}` },
        })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })
  })

  describe('without global auth guard', () => {
    beforeAll(async () => {
      const module = await Test.createTestingModule({
        controllers: [TestController],
        providers: [AuthService],
        imports: [
          ConfigModule.forFeature(() => ({
            auth: { jwtSecret: 'abcdef', jwtIssuer: 'test', jwtAudience: 'test' },
          })),
          AuthModule.forRoot<User>({
            useJwt: true,
            useApiKey: true,
            userJwtResolver: AuthService,
            userApiKeyResolver: AuthService,
            provideGlobalAuthGuard: false,
          }),
        ],
      }).compile()

      app = module.createNestApplication(new FastifyAdapter())
      await app.init()
      await app.getHttpAdapter().getInstance().ready()
    })

    describe('unauthorized request', () => {
      it.each([
        ['/public', 200],
        ['/excluded', 200],
        ['/explicitly-private', 401],
        ['/explicit-jwt', 401],
        ['/explicit-api-key', 401],
        ['/skip-api-key', 200],
        ['/skip-jwt', 200],
      ])('GET %s => %i', async (path, expectedStatus) => {
        const result = await app.inject({ method: 'GET', url: path })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })

    describe('authorized request with JWT', () => {
      it.each([
        ['/private', validUserId, 200],
        ['/explicitly-private', validUserId, 200],
        ['/explicit-api-key', validUserId, 401],
        ['/explicit-jwt', validUserId, 200],
        ['/skip-jwt', validUserId, 200],
        ['/skip-api-key', validUserId, 200],
        ['/explicit-jwt', 'invalid', 401],
      ])('GET %s with userId %s => %i', async (path, userId, expectedStatus) => {
        const token = createJwt(app, { user_id: userId })
        const result = await app.inject({
          method: 'GET',
          url: path,
          headers: { authorization: `bearer ${token}` },
        })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })

    describe('authorized request with API key', () => {
      it.each([
        ['/private', apiKey, 200],
        ['/explicitly-private', apiKey, 200],
        ['/explicit-api-key', apiKey, 200],
        ['/explicit-jwt', apiKey, 401],
        ['/skip-jwt', apiKey, 200],
        ['/skip-api-key', apiKey, 200],
        ['/explicit-api-key', 'invalid', 401],
      ])('GET %s with API key %s => %i', async (path, token, expectedStatus) => {
        const result = await app.inject({
          method: 'GET',
          url: path,
          headers: { authorization: `bearer ${token}` },
        })

        expect(result.statusCode).toEqual(expectedStatus)
      })
    })
  })
})
