import { Controller, Get } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AuthModule } from '../auth.module.js'
import { createJwt } from '../testing/index.js'

import { UserJwtResolver } from './jwt.strategy.js'

@Controller()
class TestController {
  @Get('foo')
  foo() {
    return 'bar'
  }
}

class User {
  constructor(public id: string) {}
}

describe('JWT Strategy', () => {
  let app: NestFastifyApplication

  const userResolver: UserJwtResolver<User> = {
    findUserByJwt(payload: Record<string, unknown>) {
      return Promise.resolve(new User(String(payload.sub)))
    },
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        AuthModule.forRoot<User>({
          useJwt: true,
          useApiKey: false,
          userJwtResolver: userResolver,
        }),
        ConfigModule.forFeature(() => ({ jwt: { secret: 'abcdef' } })),
      ],
    }).compile()

    app = module.createNestApplication(new FastifyAdapter())
    await app.init()
    await app.getHttpAdapter().getInstance().ready()
  })

  afterAll(async () => {
    await app?.close()
  })

  it('returns unauthorized without token', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/foo',
    })
    expect(result.statusCode).toEqual(401)
  })

  it('returns unauthorized with invalid token', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/foo',
      headers: {
        authorization: 'bearer 1234',
      },
    })
    expect(result.statusCode).toEqual(401)
  })

  it('returns ok with valid token', async () => {
    const token = createJwt(app)
    const result = await app.inject({
      method: 'GET',
      url: '/foo',
      headers: {
        authorization: `bearer ${token}`,
      },
    })
    expect(result.statusCode).toEqual(200)
  })

  it('returns unauthorized with expired token', async () => {
    const token = createJwt(app, {
      exp: Math.floor(Date.now() / 1000) - 3000,
    })
    const result = await app.inject({
      method: 'GET',
      url: '/foo',
      headers: {
        authorization: `bearer ${token}`,
      },
    })
    expect(result.statusCode).toEqual(401)
  })
})
