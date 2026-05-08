import { Controller, Get } from '@nestjs/common'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { Test } from '@nestjs/testing'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { AuthModule } from '../auth.module.js'

import { UserApiKeyResolver } from './api-key.strategy.js'

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

describe('ApiKey Strategy', () => {
  let app: NestFastifyApplication

  const userResolver: UserApiKeyResolver<User> = {
    findUserByApiKey(token: string) {
      return token === 'abcdef' ? new User('asdf') : null
    },
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TestController],
      imports: [
        AuthModule.forRoot<User>({
          useJwt: false,
          useApiKey: true,
          userApiKeyResolver: userResolver,
        }),
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
    const result = await app.inject({
      method: 'GET',
      url: '/foo',
      headers: {
        authorization: 'bearer abcdef',
      },
    })
    expect(result.statusCode).toEqual(200)
  })
})
